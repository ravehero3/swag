import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import passport from "passport";

const router = Router();

// Google Auth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/prihlasit-se", session: true }),
  (req: Request, res: Response) => {
    // If we have a user from passport, we should sync it with our custom session if needed
    // but passport already handles it via serialize/deserialize
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
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Chyba při odhlášení" });
    }
    res.json({ message: "Odhlášeno" });
  });
});

router.get("/me", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nepřihlášen" });
  }
  
  try {
    const result = await pool.query(
      "SELECT id, email, is_admin FROM users WHERE id = $1",
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Uživatel nenalezen" });
    }
    
    res.json({ user: { id: result.rows[0].id, email: result.rows[0].email, isAdmin: result.rows[0].is_admin } });
  } catch (error) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

export default router;
