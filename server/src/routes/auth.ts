import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import passport from "passport";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../middleware/auth.js";
import { uploadFile, STORAGE_BUCKETS } from "../lib/storage.js";

function getAvatarPublicUrl(key: string): string {
  if (process.env.B2_PUBLIC_BASE_URL) {
    return `${process.env.B2_PUBLIC_BASE_URL}/${key}`;
  }
  const endpoint = process.env.B2_ENDPOINT || "";
  const bucket = STORAGE_BUCKETS.PREVIEWS;
  return `https://${endpoint}/${bucket}/${key}`;
}

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

const router = Router();

// Google Auth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/prihlasit-se", session: true }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    if (user) {
      req.session.userId = user.id;
      req.session.isAdmin = user.is_admin;
    }
    res.redirect("/");
  }
);

declare module "express-session" {
  interface SessionData {
    userId: number;
    isAdmin: boolean;
  }
}

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email již existuje" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, is_admin",
      [email, hashedPassword]
    );
    
    req.session.userId = result.rows[0].id;
    req.session.isAdmin = result.rows[0].is_admin;
    
    res.json({ user: { id: result.rows[0].id, email: result.rows[0].email, isAdmin: result.rows[0].is_admin } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Chyba při registraci" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query(
      "SELECT id, email, password, is_admin FROM users WHERE email = $1",
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Nesprávný email nebo heslo" });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: "Nesprávný email nebo heslo" });
    }
    
    req.session.userId = user.id;
    req.session.isAdmin = user.is_admin;
    
    res.json({ user: { id: user.id, email: user.email, isAdmin: user.is_admin } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Chyba při přihlášení" });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  (req.session as any) = null;
  res.json({ message: "Odhlášeno" });
});

router.get("/me", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nepřihlášen" });
  }
  
  try {
    const result = await pool.query(
      "SELECT id, email, is_admin, avatar_url, username FROM users WHERE id = $1",
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Uživatel nenalezen" });
    }
    
    res.json({ user: { id: result.rows[0].id, email: result.rows[0].email, isAdmin: result.rows[0].is_admin, avatarUrl: result.rows[0].avatar_url, username: result.rows[0].username } });
  } catch (error) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

router.patch("/username", requireAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: "Uživatelské jméno nesmí být prázdné" });
    }
    const cleaned = username.trim().slice(0, 50);
    if (!/^[a-zA-Z0-9_.\-]+$/.test(cleaned)) {
      return res.status(400).json({ error: "Jméno může obsahovat pouze písmena, čísla, _, . a -" });
    }
    await pool.query("UPDATE users SET username = $1 WHERE id = $2", [cleaned, req.session.userId]);
    res.json({ username: cleaned });
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Toto uživatelské jméno je již obsazené" });
    }
    res.status(500).json({ error: "Chyba při ukládání uživatelského jména" });
  }
});

router.post("/avatar", requireAuth, avatarUpload.single("avatar"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Žádný soubor" });

    const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const key = `avatars/${uuidv4()}${ext}`;

    await uploadFile(STORAGE_BUCKETS.PREVIEWS, key, req.file.buffer, req.file.mimetype);

    const url = getAvatarPublicUrl(key);
    await pool.query("UPDATE users SET avatar_url = $1 WHERE id = $2", [url, req.session.userId]);
    res.json({ avatarUrl: url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ error: "Chyba při nahrávání avataru" });
  }
});

router.get("/profile-info", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nepřihlášen" });
  }
  try {
    const result = await pool.query(
      `SELECT buyer_legal_name, buyer_artist_name, buyer_address
       FROM orders
       WHERE user_id = $1 AND buyer_legal_name IS NOT NULL AND total > 0
       ORDER BY created_at DESC LIMIT 1`,
      [req.session.userId]
    );
    if (result.rows.length === 0) {
      return res.json({});
    }
    const row = result.rows[0];
    res.json({
      buyerLegalName: row.buyer_legal_name,
      buyerArtistName: row.buyer_artist_name,
      buyerAddress: row.buyer_address,
    });
  } catch (error) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

export default router;
