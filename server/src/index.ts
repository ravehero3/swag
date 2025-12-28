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
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

const PgStore = pgSession(session);

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

// Temporarily use memory store for sessions (development only)
const sessionSecret = process.env.SESSION_SECRET || "temp_secret_for_vercel";

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

app.use("/uploads", express.static(path.join(__dirname, "../../public/uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/beats", beatsRoutes);
app.use("/api/sound-kits", soundKitsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/licenses", licensesRoutes);
app.use("/api/admin", adminLicensesRoutes);

async function startServer() {
  // Initialize database tables
  await initDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: "spa",
      root: path.join(__dirname, "../../client"),
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "../../dist/public")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "../../dist/public/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
