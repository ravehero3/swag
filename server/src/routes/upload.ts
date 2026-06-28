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

// Translate the raw R2 SignatureDoesNotMatch / InvalidAccessKey error plus
// length/whitespace observations into a step-by-step instruction the operator
// can act on, in Czech (the user's language).
function buildCredsDiagnosis(env: any, uploadError: string | null): string {
  const lines: string[] = [];
  lines.push(`Nahrávání selhalo: ${uploadError || "neznámá chyba"}`);

  const whitespaceProblem =
    env.R2_ACCOUNT_ID_LEN !== env.R2_ACCOUNT_ID_TRIMMED_LEN ||
    env.R2_ACCESS_KEY_ID_LEN !== env.R2_ACCESS_KEY_ID_TRIMMED_LEN ||
    env.R2_SECRET_ACCESS_KEY_LEN !== env.R2_SECRET_ACCESS_KEY_TRIMMED_LEN;

  if (whitespaceProblem) {
    lines.push(
      "PROBLÉM: Aspoň jedna z proměnných má mezeru/nový řádek na konci nebo začátku. " +
      "Server je nyní automaticky odstřihává, ale i tak doporučuji v Renderu " +
      "proměnnou smazat a pečlivě vložit znovu (bez Enteru na konci)."
    );
  }

  // Cloudflare R2: account ID = 32 hex chars, access key ID = 32 hex chars,
  // secret access key = 64 hex chars. If anything is way off, the wrong field
  // was probably pasted.
  if (env.R2_ACCOUNT_ID_TRIMMED_LEN && env.R2_ACCOUNT_ID_TRIMMED_LEN !== 32) {
    lines.push(
      `R2_ACCOUNT_ID má ${env.R2_ACCOUNT_ID_TRIMMED_LEN} znaků, ale Cloudflare account ID má vždy 32. ` +
      `Najdete ho v Cloudflare → R2 → vpravo nahoře pod "Account ID".`
    );
  }
  if (env.R2_ACCESS_KEY_ID_TRIMMED_LEN && env.R2_ACCESS_KEY_ID_TRIMMED_LEN !== 32) {
    lines.push(
      `R2_ACCESS_KEY_ID má ${env.R2_ACCESS_KEY_ID_TRIMMED_LEN} znaků, ale R2 Access Key ID má vždy 32. ` +
      `Vytvořte/zkopírujte v Cloudflare → R2 → "Manage R2 API Tokens" → pole "Access Key ID".`
    );
  }
  if (env.R2_SECRET_ACCESS_KEY_TRIMMED_LEN && env.R2_SECRET_ACCESS_KEY_TRIMMED_LEN !== 64) {
    lines.push(
      `R2_SECRET_ACCESS_KEY má ${env.R2_SECRET_ACCESS_KEY_TRIMMED_LEN} znaků, ale R2 Secret Access Key má vždy 64. ` +
      `Pravděpodobně jste zkopíroval(a) jiné pole — potřebujete pole "Secret Access Key" (NE "Token Value" ani "API Token").`
    );
  }

  if (lines.length === 1) {
    // Délky sedí, whitespace OK → tajný klíč prostě nepatří k access key ID.
    lines.push(
      "Délky kláves sedí, ale R2 podpis nesouhlasí. To znamená, že R2_ACCESS_KEY_ID a R2_SECRET_ACCESS_KEY " +
      "nejsou ze stejné dvojice — typicky jste vygeneroval(a) nový API token v Cloudflare a zkopíroval(a) " +
      "jen jedno z polí. Vytvořte v R2 → Manage R2 API Tokens nový token, zkopírujte ZÁROVEŇ Access Key ID " +
      "i Secret Access Key (zobrazí se jen jednou) a oba aktualizujte v Renderu."
    );
  }

  lines.push("Po úpravě proměnných v Renderu nezapomeňte spustit nový deploy.");
  return lines.join(" • ");
}

// Admin diagnostic: uploads a 1×1 test JPEG to the artwork bucket and then
// fetches the resulting public URL back, returning the full picture of what's
// configured and what works. Use this to debug "upload says success but image
// won't render" issues without guessing.
router.get("/diag/artwork", requireAdmin, async (_req: Request, res: Response) => {
  // Compute lengths (and trimmed-length deltas) of credentials so the operator
  // can spot wrong-field-pasted (e.g. R2 access key IDs are 32 hex chars,
  // secrets are 64) or stray-whitespace problems WITHOUT ever leaking values.
  const rawSecret = process.env.R2_SECRET_ACCESS_KEY || "";
  const rawAccessId = process.env.R2_ACCESS_KEY_ID || "";
  const rawAccountId = process.env.R2_ACCOUNT_ID || "";
  const env = {
    R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET || null,
    R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL || null,
    B2_PREVIEW_BUCKET: process.env.B2_PREVIEW_BUCKET || null,
    B2_PUBLIC_BASE_URL: process.env.B2_PUBLIC_BASE_URL || null,
    B2_ENDPOINT: process.env.B2_ENDPOINT || null,
    R2_ACCOUNT_ID_LEN: rawAccountId.length,
    R2_ACCESS_KEY_ID_LEN: rawAccessId.length,
    R2_SECRET_ACCESS_KEY_LEN: rawSecret.length,
    R2_ACCOUNT_ID_TRIMMED_LEN: rawAccountId.trim().length,
    R2_ACCESS_KEY_ID_TRIMMED_LEN: rawAccessId.trim().length,
    R2_SECRET_ACCESS_KEY_TRIMMED_LEN: rawSecret.trim().length,
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
        ? buildCredsDiagnosis(env, uploadError)
        : verification.ok
        ? "OK — uploads work AND the public URL is loadable. Artwork should render in the browser."
        : "Upload works, but the public URL is NOT loadable. Likely causes: (1) Cloudflare R2 bucket public access is OFF — enable the R2.dev subdomain or attach a custom domain in the Cloudflare dashboard. (2) R2_PUBLIC_BASE_URL on Render does not match the bucket's actual public URL.",
  });
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

  // Artwork: resize/normalise with Sharp then upload to R2
  if (type === "artwork") {
    try {
      const isImage = (req.file.mimetype || "").startsWith("image/");
      let bodyBuffer: Buffer;
      let outExt = "jpg";
      let contentType = "image/jpeg";

      if (isImage) {
        const src = sharp(req.file.path).rotate();
        const meta = await src.metadata();
        const hasAlpha = !!meta.hasAlpha;

        const resized = src.resize(1500, 1500, {
          fit: "contain",
          background: hasAlpha ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 0, g: 0, b: 0, alpha: 1 },
        });

        if (hasAlpha) {
          bodyBuffer = await resized.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
          outExt = "png";
          contentType = "image/png";
        } else {
          bodyBuffer = await resized.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
          outExt = "jpg";
          contentType = "image/jpeg";
        }
      } else {
        bodyBuffer = fs.readFileSync(req.file.path);
        outExt = ext;
        contentType = req.file.mimetype || "application/octet-stream";
      }

      fs.unlinkSync(req.file.path);
      const filename = `artwork/${uuidv4()}.${outExt}`;

      await uploadFile(STORAGE_BUCKETS.ARTWORK, filename, bodyBuffer, contentType);
      const url = getPublicUrl(STORAGE_BUCKETS.ARTWORK, filename);

      res.json({ url, filename, size: bodyBuffer.length });
      console.log(`✅ artwork uploaded to R2: ${url}`);
      return;
    } catch (error) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error("artwork upload failed:", error);
      res.status(500).json({ error: "artwork upload failed", detail: String(error) });
      return;
    }
  }

  // Preview audio: upload to R2 (previews bucket)
  if (type === "preview") {
    try {
      const origExt = path.extname(req.file.originalname).toLowerCase() || `.${ext}`;
      const base = path.basename(req.file.originalname, origExt)
        .toLowerCase().replace(/[^a-z0-9_.-]/g, "-").substring(0, 80);
      const filename = `previews/${base}-${uuidv4().substring(0, 8)}${origExt}`;

      const fileBuffer = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path);

      const mimeType = req.file.mimetype || "audio/mpeg";
      await uploadFile(STORAGE_BUCKETS.PREVIEWS, filename, fileBuffer, mimeType);
      const url = getPublicUrl(STORAGE_BUCKETS.PREVIEWS, filename);

      res.json({ url, filename, size: req.file.size });
      console.log(`✅ preview uploaded to R2: ${url}`);
      return;
    } catch (error) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error("preview upload failed:", error);
      res.status(500).json({ error: "preview upload failed", detail: String(error) });
      return;
    }
  }

  // Beat-local: save audio file directly to public/uploads/beats/ (no B2 bandwidth)
  if (type === "beat-local") {
    try {
      const beatsDir = path.join(process.cwd(), "public/uploads/beats");
      if (!fs.existsSync(beatsDir)) fs.mkdirSync(beatsDir, { recursive: true });

      const ext = path.extname(req.file.originalname).toLowerCase() || ".wav";
      const base = path.basename(req.file.originalname, ext)
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, "-")
        .substring(0, 80);
      const filename = `${base}-${uuidv4().substring(0, 8)}${ext}`;
      const dest = path.join(beatsDir, filename);

      fs.copyFileSync(req.file.path, dest);
      fs.unlinkSync(req.file.path);

      const url = `/uploads/beats/${filename}`;
      res.json({ url, filename, size: req.file.size });
      console.log(`✅ beat-local saved: ${dest}`);
      return;
    } catch (error) {
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error("beat-local upload failed:", error);
      res.status(500).json({ error: "Nahrávání beatu selhalo", detail: String(error) });
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

  // Kit / trackout / any other type: save to public/uploads/kits/
  // No cloud storage — files committed to git, served by Express.
  try {
    const kitsDir = path.join(process.cwd(), "public/uploads/kits");
    if (!fs.existsSync(kitsDir)) fs.mkdirSync(kitsDir, { recursive: true });

    const origExt = path.extname(req.file.originalname).toLowerCase() || `.${ext}`;
    const base = path.basename(req.file.originalname, origExt)
      .toLowerCase().replace(/[^a-z0-9_.-]/g, "-").substring(0, 80);
    const filename = `${base}-${uuidv4().substring(0, 8)}${origExt}`;
    const dest = path.join(kitsDir, filename);

    fs.copyFileSync(req.file.path, dest);
    fs.unlinkSync(req.file.path);

    const url = `/uploads/kits/${filename}`;
    res.json({ url, filename, size: req.file.size });
    console.log(`✅ ${type} saved locally: ${dest}`);
  } catch (error) {
    if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed", detail: String(error) });
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
