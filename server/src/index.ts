import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
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
import leadsRoutes from "./routes/leads.js";
import commentsRoutes from "./routes/comments.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";
import bcrypt from "bcryptjs";
import { configureBucketCors, STORAGE_BUCKETS } from "./lib/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: process.env.NODE_ENV === "production"
        ? `${process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`}/api/auth/google/callback`
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
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  app.set("trust proxy", 1);
}

const sessionSecret = process.env.SESSION_SECRET || "voodoo808_stable_secret_12345";

app.use(cookieSession({
  name: "session",
  secret: sessionSecret,
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
}));

// Compatibility shim so passport's req.session.regenerate/save work with cookie-session
app.use((req: any, _res: any, next: any) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb: any) => cb();
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb: any) => cb();
  }
  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use("/uploads", (_req: any, res: any, next: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(path.join(__dirname, "../../public/uploads")));
app.use(express.static(path.join(__dirname, "../../public")));

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/beats", beatsRoutes);
app.use("/api/sound-kits", soundKitsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/licenses", licensesRoutes);
app.use("/api/admin", adminLicensesRoutes);
app.use("/api/beats", commentsRoutes);

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

app.get("/api/admin/comments", requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT bc.id, bc.beat_id, bc.text, bc.created_at, u.email, u.avatar_url, b.title as beat_title
       FROM beat_comments bc
       JOIN users u ON bc.user_id = u.id
       JOIN beats b ON bc.beat_id = b.id
       ORDER BY bc.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání komentářů" });
  }
});

app.get("/api/promo-codes", requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM promo_codes ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání promo kódů" });
  }
});

app.post("/api/promo-codes/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Kód je povinný" });
    const result = await pool.query(
      "SELECT discount_percent FROM promo_codes WHERE code = $1 AND is_active = true",
      [code.toUpperCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Neplatný nebo neaktivní kód" });
    }
    res.json({ discountPercent: result.rows[0].discount_percent });
  } catch (error) {
    res.status(500).json({ error: "Chyba při ověřování kódu" });
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

app.patch("/api/admin/promo-codes/:id", requireAdmin, async (req, res) => {
  try {
    const { isActive, discountPercent } = req.body;
    const updates: string[] = [];
    const params: any[] = [];
    if (isActive !== undefined) { updates.push(`is_active = $${params.length + 1}`); params.push(isActive); }
    if (discountPercent !== undefined) { updates.push(`discount_percent = $${params.length + 1}`); params.push(discountPercent); }
    if (updates.length === 0) return res.status(400).json({ error: "Žádná pole k aktualizaci" });
    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE promo_codes SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při aktualizaci promo kódu" });
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

app.get("/api/admin/email-templates", requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM email_templates ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání šablon" });
  }
});

app.patch("/api/admin/email-templates/:key", requireAdmin, async (req, res) => {
  try {
    const { subject, intro_text } = req.body;
    const result = await pool.query(
      "UPDATE email_templates SET subject = $1, intro_text = $2, updated_at = CURRENT_TIMESTAMP WHERE key = $3 RETURNING *",
      [subject, intro_text, req.params.key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Šablona nenalezena" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání šablony" });
  }
});

app.post("/api/admin/email-templates/:key/preview", requireAdmin, async (req, res) => {
  try {
    const { buildPreviewEmailHtml } = await import("./email.js");
    const { intro_text } = req.body;
    const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DEV_DOMAIN}` || "http://localhost:5000";
    const html = buildPreviewEmailHtml(req.params.key, intro_text || "", appUrl);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: "Chyba při generování náhledu" });
  }
});

app.get("/api/settings", async (_req, res) => {
  try {
    const result = await pool.query("SELECT key, value FROM settings");
    const settings = result.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=300");
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

// Audio proxy — lets the browser fetch B2 audio via the server to avoid CORS
app.get("/api/audio-proxy", async (req: any, res: any) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: "Missing url" });

  const b2Endpoint = process.env.B2_ENDPOINT || "";
  const b2PublicBase = process.env.B2_PUBLIC_BASE_URL || "";
  const isAllowed =
    url.includes("backblazeb2.com") ||
    (b2Endpoint && url.includes(b2Endpoint)) ||
    (b2PublicBase && url.startsWith(b2PublicBase));
  if (!isAllowed) return res.status(403).json({ error: "URL not allowed" });

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "VOODOO808-Server/1.0" },
    });
    if (!upstream.ok) return res.status(upstream.status).end();

    res.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    const cl = upstream.headers.get("content-length");
    if (cl) res.setHeader("Content-Length", cl);

    if (!upstream.body) return res.status(500).end();
    const reader = (upstream.body as any).getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    };
    await pump();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: "Proxy error", detail: String(err) });
  }
});

// Image proxy — lets the browser draw any external image on canvas (avoids CORS taint)
app.get("/api/image-proxy", async (req: any, res: any) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: "Missing url" });
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    return res.status(403).json({ error: "Only http/https URLs allowed" });
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "VOODOO808-Server/1.0" },
    });
    if (!upstream.ok) return res.status(upstream.status).end();

    const ct = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    const cl = upstream.headers.get("content-length");
    if (cl) res.setHeader("Content-Length", cl);

    const buf = await upstream.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: "Image proxy error", detail: String(err) });
  }
});

// JSON error handler — ensures API routes always return JSON, never HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express error on", req.method, req.path, ":", err.message);
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(err.status || 500).json({
      error: err.message || "Chyba serveru",
    });
  }
  next(err);
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

// Initialize DB once for Vercel (not on every request)
let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

async function ensureDbInitialized() {
  if (dbInitialized) return;
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    try {
      await initDatabase();
      await seedAdmin();
      // Configure B2 CORS so browsers can fetch audio directly (silent fail)
      if (STORAGE_BUCKETS.PREVIEWS) {
        configureBucketCors(STORAGE_BUCKETS.PREVIEWS).catch(() => {});
      }
      dbInitialized = true;
    } catch (err) {
      dbInitPromise = null;
      throw err;
    }
  })();
  return dbInitPromise;
}

// Standard Vercel Node handler export
export default async (req: any, res: any) => {
  try {
    await ensureDbInitialized();
    return await new Promise<void>((resolve, reject) => {
      app(req, res);
      res.on("finish", resolve);
      res.on("error", reject);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Serverless handler error:", message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error", details: message });
    }
  }
};

startServer().catch(console.error);
