import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const type = req.query.type as string;
    let folder = "uploads";
    if (type === "beat") folder = "uploads/beats";
    else if (type === "kit") folder = "uploads/kits";
    else if (type === "artwork") folder = "uploads/artwork";
    else if (type === "preview") folder = "uploads/previews";
    
    cb(null, path.join(__dirname, "../../../public", folder));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
});

const router = Router();

router.post("/", requireAdmin, upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const type = req.query.type as string;
  let folder = "uploads";
  if (type === "beat") folder = "uploads/beats";
  else if (type === "kit") folder = "uploads/kits";
  else if (type === "artwork") folder = "uploads/artwork";
  else if (type === "preview") folder = "uploads/previews";
  
  const fileUrl = `/${folder}/${req.file.filename}`;
  res.json({ url: fileUrl });
});

export default router;
