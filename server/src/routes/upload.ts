import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin } from "../middleware/auth.js";
import { uploadFile, generatePresignedUploadUrl, STORAGE_BUCKETS } from "../lib/storage.js";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const router = Router();

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

// Server-side upload endpoint (PRIMARY METHOD - more reliable)
router.post("/", requireAdmin, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const type = req.query.type as string;
  if (!type) {
    return res.status(400).json({ error: "Missing type parameter" });
  }

  const ext = req.file.originalname.split('.').pop() || '';
  const key = `${uuidv4()}.${ext}`;

  const isPublic = type === "preview" || type === "artwork";
  const bucket = isPublic ? STORAGE_BUCKETS.PREVIEWS : STORAGE_BUCKETS.ZIPS;
  
  try {
    console.log(`Starting upload: file=${req.file.originalname}, type=${type}, size=${req.file.size} bytes, bucket=${bucket}`);
    
    await uploadFile(bucket, key, req.file.buffer, req.file.mimetype);
    
    const url = isPublic ? getPublicUrl(bucket, key) : key;
    console.log(`Upload successful: ${bucket}/${key}`);
    res.json({ url, key, bucket });
  } catch (error) {
    console.error("B2 Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      error: "Failed to upload to cloud storage", 
      detail: errorMessage,
      hint: "Make sure the Backblaze bucket is public and credentials are correct"
    });
  }
});

export default router;
