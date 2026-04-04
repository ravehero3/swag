import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import passport from "passport";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";

const avatarUploadDir = process.env.NODE_ENV === "production"
  ? "/tmp/uploads/avatars"
  : path.join(process.cwd(), "public/uploads/avatars");

function ensureAvatarDir() {
  if (!fs.existsSync(avatarUploadDir)) {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
  }
}

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => { ensureAvatarDir(); cb(null, avatarUploadDir); },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `avatar-${Date.now()}${ext}`);
    },
  }),
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
      "SELECT id, email, is_admin, avatar_url FROM users WHERE id = $1",
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Uživatel nenalezen" });
    }
    
    res.json({ user: { id: result.rows[0].id, email: result.rows[0].email, isAdmin: result.rows[0].is_admin, avatarUrl: result.rows[0].avatar_url } });
  } catch (error) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

router.post("/avatar", requireAuth, avatarUpload.single("avatar"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Žádný soubor" });
    const url = `/uploads/avatars/${req.file.filename}`;
    await pool.query("UPDATE users SET avatar_url = $1 WHERE id = $2", [url, req.session.userId]);
    res.json({ avatarUrl: url });
  } catch (error) {
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
