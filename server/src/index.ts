import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";
import { pool, initDatabase } from "./db.js";
import authRoutes from "./routes/auth.js";
import beatsRoutes from "./routes/beats.js";
import soundKitsRoutes from "./routes/soundKits.js";
import ordersRoutes from "./routes/orders.js";
import uploadRoutes from "./routes/upload.js";
import savedRoutes from "./routes/saved.js";
import licensesRoutes from "./routes/licenses.js";
import adminLicensesRoutes from "./routes/adminLicenses.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";
// Vite is only used in non-production environments
// import { createServer as createViteServer } from "vite";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const PgStore = pgSession(session);

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.NODE_ENV === "production" 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
        : "/api/auth/google/callback",
      proxy: true,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("No email found from Google profile"));

        // Find or create user
        const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        let user = res.rows[0];

        if (!user) {
          const insertRes = await pool.query(
            "INSERT INTO users (email, password, is_admin) VALUES ($1, $2, $3) RETURNING *",
            [email, "google-auth-no-password", false]
          );
          user = insertRes.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  try {
    const res = await pool.query("SELECT id, email, is_admin FROM users WHERE id = $1", [id]);
    done(null, res.rows[0]);
  } catch (err) {
    done(err);
  }
});

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET environment variable is required in production");
  process.exit(1);
}

if (isProduction) {
  app.set("trust proxy", 1);
}

const sessionSecret = process.env.SESSION_SECRET || "voodoo808_stable_secret_12345";

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/uploads", express.static(path.join(__dirname, "../../public/uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/beats", beatsRoutes);
app.use("/api/sound-kits", soundKitsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/licenses", licensesRoutes);
app.use("/api/admin", adminLicensesRoutes);

async function seedAdmin() {
  try {
    const email = 'admin@voodoo808.com';
    const password = 'admin123';
    console.log(`Checking for admin user: ${email}...`);
    const existing = await pool.query('SELECT id, is_admin FROM users WHERE email = $1', [email]);
    
    if (existing.rows.length === 0) {
      console.log('Admin user not found, creating...');
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO users (email, password, is_admin) VALUES ($1, $2, true)', [email, hashedPassword]);
      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user exists, ensuring admin privileges...');
      await pool.query('UPDATE users SET is_admin = true WHERE email = $1', [email]);
    }
  } catch (e) {
    console.error("Admin seed failed:", e);
  }
}

app.get("/api/promo-codes", requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM promo_codes ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání promo kódů" });
  }
});

app.post("/api/admin/promo-codes", requireAdmin, async (req, res) => {
  try {
    const { code, discountPercent, isActive } = req.body;
    const result = await pool.query(
      "INSERT INTO promo_codes (code, discount_percent, is_active) VALUES ($1, $2, $3) RETURNING *",
      [code.toUpperCase(), discountPercent, isActive ?? true]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání promo kódu" });
  }
});

app.delete("/api/admin/promo-codes/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM promo_codes WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání promo kódu" });
  }
});

app.get("/api/assets", async (req, res) => {
  try {
    const { type } = req.query;
    let query = "SELECT * FROM assets ORDER BY order_index ASC";
    let params: any[] = [];
    if (type) {
      query = "SELECT * FROM assets WHERE type = $1 ORDER BY order_index ASC";
      params = [type];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání assetů" });
  }
});

app.post("/api/admin/assets", requireAdmin, async (req, res) => {
  try {
    const { type, url, title, link, orderIndex } = req.body;
    const result = await pool.query(
      "INSERT INTO assets (type, url, title, link, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [type, url, title, link, orderIndex || 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání assetu" });
  }
});

app.delete("/api/admin/assets/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM assets WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání assetu" });
  }
});

app.get("/api/settings", async (_req, res) => {
  try {
    const result = await pool.query("SELECT key, value FROM settings");
    const settings = result.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání nastavení" });
  }
});

app.post("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    await pool.query(
      "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP",
      [key, value]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání nastavení" });
  }
});

async function startServer() {
  await initDatabase();
  await seedAdmin();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
      root: path.join(__dirname, "../../client"),
    });
    app.use(vite.middlewares);
  } else {
    const publicPath = path.join(__dirname, "../../dist/public");
    app.use(express.static(publicPath));
    
    // API routes are already handled above by app.use("/api/...", ...)
    // This catch-all should only handle frontend routing
    app.get("*", (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        return res.status(404).json({ error: "API endpoint nenalezen" });
      }
      res.sendFile(path.join(publicPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Standard Vercel Node handler export
export default async (req: any, res: any) => {
  try {
    if (process.env.NODE_ENV === "production") {
      await initDatabase();
      await seedAdmin();
    }
    return app(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : String(error) 
    });
  }
};

if (process.env.NODE_ENV !== "production") {
  startServer().catch(console.error);
}
