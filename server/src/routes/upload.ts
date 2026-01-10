import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin } from "../middleware/auth.js";
import { uploadFile, STORAGE_BUCKETS } from "../lib/storage.js";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

const router = Router();

router.post("/", requireAdmin, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const type = req.query.type as string;
  const ext = req.file.originalname.split('.').pop();
  const key = `${uuidv4()}.${ext}`;
  const isPreview = type === "preview";
  const bucket = isPreview ? STORAGE_BUCKETS.PREVIEWS : STORAGE_BUCKETS.ZIPS;
  
  try {
    await uploadFile(
      bucket,
      key,
      req.file.buffer,
      req.file.mimetype,
      isPreview
    );
    
    res.json({ url: key, key: key });
  } catch (error) {
    console.error("B2 Upload error:", error);
    res.status(500).json({ error: "Failed to upload to cloud storage" });
  }
});

export default router;
