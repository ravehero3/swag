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

app.use(session({
  store: new PgStore({
    pool,
    tableName: "session",
  }),
  secret: process.env.SESSION_SECRET || "voodoo808-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

app.use("/uploads", express.static(path.join(__dirname, "../../public/uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/beats", beatsRoutes);
app.use("/api/sound-kits", soundKitsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/upload", uploadRoutes);

async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(__dirname, "../../client"),
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "../public")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
