import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { requireAdmin } from "../middleware/auth.js";
import { uploadFile, generatePresignedUploadUrl, listFiles, STORAGE_BUCKETS, VIDEO_PREFIX, getPublicUrl } from "../lib/storage.js";
import stream from "stream";
import sharp from "sharp";
import { pool } from "../db.js";
interface PendingUpload {
  id: number;
  key: string;
  bucket: string;
  filename: string;
  size: number;
  uploaded_at: string;
  linked: boolean;
}

const uploadDir = process.env.NODE_ENV === "production"
  ? "/tmp/uploads"
  : path.join(process.cwd(), "tmp/uploads");

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      ensureUploadDir();
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}-${file.originalname}`);
    }
  }),
  limits: { 
    fileSize: 512 * 1024 * 1024, // 512MB
    files: 1
  }
});

// Quickly verify that a public URL we just constructed is actually loadable
// by an unauthenticated client (i.e. real browser users). Tries HEAD first,
// falls back to a tiny ranged GET because some object stores (notably the
// R2 .r2.dev public dev domain) return 405 / 404 for HEAD even on objects
// that GET correctly.
async function verifyPublicUrl(url: string): Promise<{ ok: true } | { ok: false; detail: string }> {
  const tryFetch = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const r = await fetch(url, {
        method,
        // For GET we only need the first byte to confirm content is served.
        headers: method === "GET" ? { Range: "bytes=0-0" } : {},
        signal: controller.signal,
        redirect: "follow",
      });
      const ct = r.headers.get("content-type") || "";
      return { status: r.status, contentType: ct };
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const head = await tryFetch("HEAD");
    if (head.status >= 200 && head.status < 300) {
      return { ok: true };
    }
    // HEAD failed — many public CDNs (R2 .r2.dev) reject HEAD; verify with a
    // 1-byte ranged GET before declaring the URL broken.
    const get = await tryFetch("GET");
    if (get.status >= 200 && get.status < 300) {
      return { ok: true };
    }
    return {
      ok: false,
      detail: `HEAD ${head.status}, GET ${get.status} (content-type: ${get.contentType || "n/a"})`,
    };
  } catch (e: any) {
    return { ok: false, detail: e?.name === "AbortError" ? "verification timeout (8s)" : (e?.message || String(e)) };
  }
}

const router = Router();

// Admin diagnostic: uploads a 1×1 test JPEG to the artwork bucket and then
// fetches the resulting public URL back, returning the full picture of what's
// configured and what works. Use this to debug "upload says success but image
// won't render" issues without guessing.
router.get("/diag/artwork", requireAdmin, async (_req: Request, res: Response) => {
  const env = {
    R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET || null,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL || null,
    B2_PREVIEW_BUCKET: process.env.B2_PREVIEW_BUCKET || null,
    B2_PUBLIC_BASE_URL: process.env.B2_PUBLIC_BASE_URL || null,
    B2_ENDPOINT: process.env.B2_ENDPOINT || null,
  };

  const bucket = STORAGE_BUCKETS.ARTWORK;
  const testKey = `diag/test-${Date.now()}.jpg`;
  let publicUrl = "";
  let uploadOk = false;
  let uploadError: string | null = null;
  let verification: { ok: true } | { ok: false; detail: string } = { ok: false, detail: "not run" };

  try {
    // Smallest valid JPEG (~125 bytes) — a single black pixel.
    const tinyJpeg = await sharp({
      create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 0, b: 0 } },
    }).jpeg().toBuffer();

    await uploadFile(bucket, testKey, tinyJpeg, "image/jpeg");
    uploadOk = true;
    publicUrl = getPublicUrl(bucket, testKey);
    verification = await verifyPublicUrl(publicUrl);
  } catch (e: any) {
    uploadError = e?.message || String(e);
  }

  res.json({
    bucket,
    env,
    testKey,
    publicUrl,
    uploadOk,
    uploadError,
    publicFetch: verification,
    diagnosis:
      !uploadOk
        ? "Upload to bucket FAILED — check credentials (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) and bucket name (R2_BUCKET)."
        : verification.ok
        ? "OK — uploads work AND the public URL is loadable. Artwork should render in the browser."
        : "Upload works, but the public URL is NOT loadable. Likely causes: (1) Cloudflare R2 bucket public access is OFF — enable the R2.dev subdomain or attach a custom domain in the Cloudflare dashboard. (2) R2_PUBLIC_BASE_URL on Vercel does not match the bucket's actual public URL.",
  });
});

router.get("/b2-credentials", requireAdmin, (req: Request, res: Response) => {
  if (!process.env.B2_KEY_ID || !process.env.B2_KEY_SECRET || !process.env.B2_ENDPOINT) {
    return res.status(500).json({ error: "B2 config missing" });
  }
  res.json({
    keyId: process.env.B2_KEY_ID,
    applicationKey: process.env.B2_KEY_SECRET,
    endpoint: `https://${process.env.B2_ENDPOINT}`,
  });
});

// List files in the ZIP bucket (for B2 file picker)
router.get("/b2-files", requireAdmin, async (req: Request, res: Response) => {
  try {
    const files = await listFiles(STORAGE_BUCKETS.ZIPS);
    const sorted = files.sort((a, b) => {
      const aTime = a.lastModified ? a.lastModified.getTime() : 0;
      const bTime = b.lastModified ? b.lastModified.getTime() : 0;
      return bTime - aTime;
    });
    res.json(sorted);
  } catch (error) {
    console.error("B2 list error:", error);
    res.status(500).json({ error: "Failed to list B2 files", detail: String(error) });
  }
});

// List video files from B2
router.get("/b2-videos", requireAdmin, async (req: Request, res: Response) => {
  try {
    const files = await listFiles(STORAGE_BUCKETS.VIDEOS, VIDEO_PREFIX || undefined);
    const sorted = files
      .filter(f => /\.(mp4|mov|webm|avi|mkv)$/i.test(f.key))
      .sort((a, b) => {
        const aTime = a.lastModified ? a.lastModified.getTime() : 0;
        const bTime = b.lastModified ? b.lastModified.getTime() : 0;
        return bTime - aTime;
      })
      .map(f => ({
        ...f,
        url: getPublicUrl(STORAGE_BUCKETS.VIDEOS, f.key),
      }));
    res.json(sorted);
  } catch (error) {
    console.error("B2 video list error:", error);
    res.status(500).json({ error: "Failed to list videos", detail: String(error) });
  }
});

// Save pending uploads after client direct
router.post("/pending", requireAdmin, async (req: Request, res: Response) => {
  const { files }: { files: {key: string, bucket: string, filename: string, size: number}[] } = req.body;
  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: "No files" });
  }
  try {
    for (const f of files) {
      await pool.query(
        "INSERT INTO pending_uploads (key, bucket, filename, size) VALUES ($1, $2, $3, $4)",
        [f.key, f.bucket, f.filename, f.size]
      );
    }
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

// Return the full public URL for a given key + bucket type (preview or artwork)
router.get("/public-url", requireAdmin, (req: Request, res: Response) => {
  const { key, type } = req.query as { key: string; type: string };
  if (!key || !type) return res.status(400).json({ error: "Missing key or type" });
  const isPublic = type === "preview" || type === "artwork";
  if (!isPublic) return res.status(400).json({ error: "Only preview/artwork types have public URLs" });
  const bucket = STORAGE_BUCKETS.ARTWORK;
  res.json({ url: getPublicUrl(bucket, key) });
});

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
  let key = `${uuidv4()}.${ext}`;

  // Artwork: normalize to a 1500x1500 square JPEG so it always renders cleanly
  // regardless of source dimensions (no top/bottom cropping, predictable size).
  if (type === "artwork") {
    try {
      const bucket = STORAGE_BUCKETS.ARTWORK;
      const isImage = (req.file.mimetype || "").startsWith("image/");
      let bodyBuffer: Buffer;
      let contentType = req.file.mimetype || "application/octet-stream";

      if (isImage) {
        bodyBuffer = await sharp(req.file.path)
          .rotate() // honor EXIF orientation
          .resize(1500, 1500, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
          .jpeg({ quality: 88, mozjpeg: true })
          .toBuffer();
        contentType = "image/jpeg";
        key = `${uuidv4()}.jpg`;
      } else {
        bodyBuffer = fs.readFileSync(req.file.path);
      }

      await uploadFile(bucket, key, bodyBuffer, contentType);
      fs.unlinkSync(req.file.path);
      const url = getPublicUrl(bucket, key);

      // CRITICAL: verify the uploaded artwork is actually publicly fetchable
      // BEFORE returning success. Otherwise we get the silent-failure mode
      // where the storage PUT succeeds but the public URL is dead (R2 bucket
      // not public, R2_PUBLIC_BASE_URL pointing at the wrong domain, B2
      // bucket private, etc.) — the admin sees "✓ Nahráno" but the image
      // never renders. Fail loudly with an actionable message instead.
      const verification = await verifyPublicUrl(url);
      if (!verification.ok) {
        console.error(`❌ artwork uploaded but public URL is not loadable: ${url} — ${verification.detail}`);
        res.status(502).json({
          error:
            "Soubor se nahrál, ale veřejná URL nefunguje. Nejčastější příčina: " +
            "Cloudflare R2 bucket nemá zapnutý veřejný přístup, nebo proměnná " +
            "R2_PUBLIC_BASE_URL na Vercelu je špatně nastavená.",
          detail: verification.detail,
          attemptedUrl: url,
          bucket,
          key,
        });
        return;
      }

      res.json({ url, key, bucket, size: bodyBuffer.length });
      console.log(`✅ artwork uploaded + verified loadable: ${url}`);
      return;
    } catch (error) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error("artwork upload failed:", error);
      res.status(500).json({ error: "artwork upload failed", detail: String(error) });
      return;
    }
  }

  // Preview: upload to ARTWORK bucket (Cloudflare R2 when configured, B2 fallback)
  if (type === "preview") {
    try {
      const bucket = STORAGE_BUCKETS.ARTWORK;
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFile(bucket, key, fileStream, req.file.mimetype);
      fs.unlinkSync(req.file.path);
      const url = getPublicUrl(bucket, key);
      res.json({ url, key, bucket, size: req.file.size });
      console.log(`✅ preview uploaded: ${url}`);
      return;
    } catch (error) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error("preview upload failed:", error);
      res.status(500).json({ error: "preview upload failed", detail: String(error) });
      return;
    }
  }

  // Video: upload to B2 videos bucket with prefix
  if (type === "video") {
    try {
      const bucket = STORAGE_BUCKETS.VIDEOS;
      const videoKey = VIDEO_PREFIX + key;
      const fileStream = fs.createReadStream(req.file.path);
      await uploadFile(bucket, videoKey, fileStream, req.file.mimetype || "video/mp4");
      fs.unlinkSync(req.file.path);
      const url = getPublicUrl(bucket, videoKey);
      res.json({ url, key: videoKey, bucket, size: req.file.size });
      console.log(`✅ video uploaded to B2: ${url}`);
      return;
    } catch (error) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error("Video B2 upload failed:", error);
      res.status(500).json({ error: "Video upload failed", detail: String(error) });
      return;
    }
  }

  const isPublic = type === "preview";
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
