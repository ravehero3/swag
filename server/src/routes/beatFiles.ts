import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

const BEATS_DIR = path.join(process.cwd(), "public/uploads/beats");

const ALLOWED_EXTS = new Set([".wav", ".mp3", ".flac", ".aif", ".aiff", ".zip", ".rar", ".m4a", ".ogg"]);

function ensureDir() {
  if (!fs.existsSync(BEATS_DIR)) fs.mkdirSync(BEATS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDir();
    cb(null, BEATS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".wav";
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, "-")
      .substring(0, 80);
    const ts = Date.now();
    cb(null, `${base}-${ts}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 }, // 512 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTS.has(ext)) cb(null, true);
    else cb(new Error("Nepodporovaný formát — povoleno: WAV, MP3, FLAC, AIF, ZIP, RAR"));
  },
});

// GET /api/beat-files — list all files in the beats folder
router.get("/", requireAdmin, (_req: Request, res: Response) => {
  try {
    ensureDir();
    const files = fs.readdirSync(BEATS_DIR)
      .filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ALLOWED_EXTS.has(ext) && !f.startsWith(".");
      })
      .map(filename => {
        const stats = fs.statSync(path.join(BEATS_DIR, filename));
        return {
          filename,
          url: `/uploads/beats/${filename}`,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
    res.json(files);
  } catch (err) {
    console.error("Error listing beat files:", err);
    res.status(500).json({ error: "Nepodařilo se načíst složku" });
  }
});

// POST /api/beat-files/upload — upload a single beat file to VPS storage
router.post("/upload", requireAdmin, upload.single("file"), (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Žádný soubor" });
    const url = `/uploads/beats/${req.file.filename}`;
    console.log(`✅ beat-file saved to VPS: ${req.file.path}`);
    res.json({ filename: req.file.filename, url, size: req.file.size });
  } catch (err) {
    console.error("Error uploading beat file:", err);
    res.status(500).json({ error: "Nepodařilo se nahrát soubor" });
  }
});

// DELETE /api/beat-files/:filename — delete a beat file from VPS storage
router.delete("/:filename", requireAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ error: "Neplatné jméno souboru" });
    }
    const filePath = path.join(BEATS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Soubor nenalezen" });
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting beat file:", err);
    res.status(500).json({ error: "Nepodařilo se smazat soubor" });
  }
});

export default router;
