import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
const KIT_ARTWORKS_DIR = path.join(process.cwd(), "public/kit-artworks");

function ensureDir() {
  if (!fs.existsSync(KIT_ARTWORKS_DIR)) {
    fs.mkdirSync(KIT_ARTWORKS_DIR, { recursive: true });
  }
}

const ALLOWED_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Pouze obrázky jsou povoleny"));
    }
  },
});

router.get("/", requireAdmin, (_req: Request, res: Response) => {
  try {
    ensureDir();
    const files = fs.readdirSync(KIT_ARTWORKS_DIR)
      .filter(f => {
        const ext = path.extname(f).toLowerCase();
        return ALLOWED_EXTS.has(ext) && !f.startsWith(".");
      })
      .map(filename => {
        const stats = fs.statSync(path.join(KIT_ARTWORKS_DIR, filename));
        return {
          filename,
          url: `/kit-artworks/${filename}`,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
    res.json(files);
  } catch (err) {
    console.error("Error listing kit artworks:", err);
    res.status(500).json({ error: "Nepodařilo se načíst galerii" });
  }
});

async function processAndSave(file: Express.Multer.File): Promise<{ filename: string; url: string }> {
  ensureDir();
  const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
  const base = path.basename(file.originalname, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .substring(0, 60);
  const ts = Date.now() + Math.floor(Math.random() * 1000);
  const filename = `${base}-${ts}.webp`;
  const dest = path.join(KIT_ARTWORKS_DIR, filename);
  
  await sharp(file.buffer)
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(dest);
  
  return { filename, url: `/kit-artworks/${filename}` };
}

router.post("/upload", requireAdmin, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Žádný soubor" });
    }
    const result = await processAndSave(req.file);
    res.json(result);
  } catch (err) {
    console.error("Error uploading kit artwork:", err);
    res.status(500).json({ error: "Nepodařilo se nahrát obrázek" });
  }
});

const uploadMany = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 30 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Pouze obrázky jsou povoleny"));
    }
  },
});

router.post("/upload-batch", requireAdmin, uploadMany.array("files", 30), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Žádné soubory" });
    }
    const results = await Promise.all(files.map(f => processAndSave(f)));
    res.json(results);
  } catch (err) {
    console.error("Error batch uploading kit artworks:", err);
    res.status(500).json({ error: "Nepodařilo se nahrát obrázky" });
  }
});

router.delete("/:filename", requireAdmin, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ error: "Neplatné jméno souboru" });
    }
    const filePath = path.join(KIT_ARTWORKS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Soubor nenalezen" });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting kit artwork:", err);
    res.status(500).json({ error: "Nepodařilo se smazat obrázek" });
  }
});

export default router;
