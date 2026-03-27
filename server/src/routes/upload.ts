import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { requireAdmin } from "../middleware/auth.js";
import { uploadFile, generatePresignedUploadUrl, STORAGE_BUCKETS } from "../lib/storage.js";
import stream from "stream";
import { pool } from "../db.js";
import type { PendingUpload } from "../../shared/types";

const uploadDir = path.join(process.cwd(), "tmp/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ 
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}-${file.originalname}`);
    }
  }),
  limits: { 
    fileSize: 512 * 1024 * 1024, // 512MB
    files: 1
  }
});


  if (!process.env.B2_KEY_ID || !process.env.B2_KEY_SECRET || !process.env.B2_ENDPOINT) {
    return res.status(500).json({ error: "B2 config missing" });
  }
  res.json({
    keyId: process.env.B2_KEY_ID,
    applicationKey: process.env.B2_KEY_SECRET,
    endpoint: `https://${process.env.B2_ENDPOINT}`,
  });
});

// Save pending uploads after client direct
router.post("/pending", requireAdmin, async (req: Request, res: Response) => {
  const { files }: { files: {key: string, bucket: string, filename: string, size: number}[] } = req.body;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files" });
  }
  try {
    const values = files.map(f => `('${f.key}', '${f.bucket}', '${f.filename}', ${f.size})`).join(',');
    await pool.query(`
      INSERT INTO pending_uploads (key, bucket, filename, size) VALUES ${values}
    `);
    res.json({ success: true, count: files.length });
  } catch (error) {
    console.error("Pending save error:", error);
    res.status(500).json({ error: "DB error" });
  }
});

// List pending
router.get("/pending", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM pending_uploads WHERE NOT linked ORDER BY uploaded_at DESC");
    res.json(result.rows as PendingUpload[]);
  } catch (error) {
    res.status(500).json({ error: "DB error" });
  }
});

// Delete pending (after link)
router.delete("/pending/:id", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE pending_uploads SET linked = true WHERE id = $1", [Number(id)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "DB error" });
  }
});

function getPublicUrl(bucket: string, key: string): string {
  if (process.env.B2_PUBLIC_BASE_URL) {
    return `${process.env.B2_PUBLIC_BASE_URL}/${key}`;
  }
  const endpoint = process.env.B2_ENDPOINT || "";
  return `https://${bucket}.${endpoint}/${key}`;
}

// Generate presigned URL for direct browser uploads (fallback)
router.get("/presign", requireAdmin, async (req: Request, res: Response) => {
  const type = req.query.type as string;
  const ext = req.query.ext as string;
  // contentType is optional; see storage.ts note about signing ContentType
  const contentType = (req.query.contentType as string) || "";

  if (!type || !ext) {
    return res.status(400).json({ error: "Missing type or ext" });
  }

  const key = `${uuidv4()}.${ext}`;
  const isPublic = type === "preview" || type === "artwork";
  const bucket = isPublic ? STORAGE_BUCKETS.PREVIEWS : STORAGE_BUCKETS.ZIPS;

  try {
    const presignedUrl = await generatePresignedUploadUrl(bucket, key, contentType || undefined);
    const publicUrl = isPublic ? getPublicUrl(bucket, key) : key;
    res.json({ presignedUrl, publicUrl, key });
  } catch (error) {
    console.error("Presign error:", error);
    res.status(500).json({ error: "Failed to generate upload URL", detail: String(error) });
  }
});

// Server-side streaming upload (handles 500MB+ files)
router.post("/", requireAdmin, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    // Cleanup temp dir on error
    await cleanupTempFiles();
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const type = req.query.type as string;
  if (!type) {
    await cleanupTempFiles(req.file.path);
    return res.status(400).json({ error: "Missing type parameter" });
  }

  const ext = req.file.originalname.split('.').pop()?.toLowerCase() || 'zip';
  const key = `${uuidv4()}.${ext}`;

  const isPublic = type === "preview" || type === "artwork";
  const bucket = isPublic ? STORAGE_BUCKETS.PREVIEWS : STORAGE_BUCKETS.ZIPS;
  
  try {
    console.log(`Streaming upload: ${req.file.originalname} (${req.file.size}B) → ${bucket}/${key}`);
    
    // Stream temp file to B2 (low memory)
    const fileStream = fs.createReadStream(req.file.path);
    await uploadFile(bucket, key, fileStream, req.file.mimetype);
    
    // Cleanup temp file
    fs.unlinkSync(req.file.path);
    
    const url = isPublic ? getPublicUrl(bucket, key) : key;
    res.json({ url, key, bucket, size: req.file.size });
    console.log(`✅ ${bucket}/${key} uploaded`);
  } catch (error) {
    // Cleanup on error
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Upload failed:", error);
    res.status(500).json({ 
      error: "Upload failed", 
      detail: String(error)
    });
  }
});

// Helper: Cleanup old temp files
async function cleanupTempFiles(tempPath?: string) {
  try {
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    // Cleanup old files (>1h)
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    for (const file of files) {
      const filepath = path.join(uploadDir, file);
      const stats = fs.statSync(filepath);
      if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
        fs.unlinkSync(filepath);
      }
    }
  } catch {}
}

export default router;
