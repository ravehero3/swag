import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { generateDownloadUrl, STORAGE_BUCKETS } from "../lib/storage.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, tag } = req.query;
    let query = "SELECT * FROM beats WHERE is_published = true";
    const params: any[] = [];
    
    if (tag) {
      query += ` AND $${params.length + 1} = ANY(tags)`;
      params.push(tag);
    }
    
    if (search) {
      query += ` AND title ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
    
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání beatů" });
  }
});

router.get("/highlighted", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM beats WHERE is_highlighted = true AND is_published = true LIMIT 1"
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání zvýrazněného beatu" });
  }
});

router.get("/all", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM beats ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání beatů" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM beats WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Beat nenalezen" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání beatu" });
  }
});

router.get("/:id/licenses", async (req: Request, res: Response) => {
  try {
    const beatId = req.params.id;
    
    const beatCheck = await pool.query("SELECT id FROM beats WHERE id = $1", [beatId]);
    if (beatCheck.rows.length === 0) {
      return res.status(404).json({ error: "Beat nenalezen" });
    }

    const result = await pool.query(
      `SELECT lt.*, blf.file_url, blf.uploaded_at as file_uploaded_at
       FROM license_types lt
       INNER JOIN beat_license_files blf ON lt.id = blf.license_type_id
       WHERE blf.beat_id = $1 AND lt.is_active = true
       ORDER BY lt.price ASC`,
      [beatId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching beat licenses:", error);
    res.status(500).json({ error: "Chyba při načítání licencí beatu" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, tags, isPublished, isHighlighted } = req.body;
    
    if (isHighlighted) {
      await pool.query("UPDATE beats SET is_highlighted = false WHERE is_highlighted = true");
    }
    
    const beatTags = Array.isArray(tags) ? tags.slice(0, 3) : [];
    const result = await pool.query(
      `INSERT INTO beats (title, artist, bpm, key, price, preview_url, file_url, artwork_url, tags, is_published, is_highlighted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [title, artist || "VOODOO808", bpm, key, price, previewUrl, fileUrl, artworkUrl, beatTags, isPublished || false, isHighlighted || false]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating beat:", error);
    res.status(500).json({ error: "Chyba při vytváření beatu" });
  }
});

router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, tags, isPublished, isHighlighted } = req.body;
    
    if (isHighlighted) {
      await pool.query("UPDATE beats SET is_highlighted = false WHERE is_highlighted = true");
    }
    
    const beatTags = Array.isArray(tags) ? tags.slice(0, 3) : [];
    const result = await pool.query(
      `UPDATE beats SET title = $1, artist = $2, bpm = $3, key = $4, price = $5, 
       preview_url = $6, file_url = $7, artwork_url = $8, tags = $9, is_published = $10, is_highlighted = $11
       WHERE id = $12 RETURNING *`,
      [title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, beatTags, isPublished, isHighlighted, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při aktualizaci beatu" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM beats WHERE id = $1", [req.params.id]);
    res.json({ message: "Beat smazán" });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání beatu" });
  }
});

router.get("/:id/download", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT file_url FROM beats WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Beat not found" });
    }
    
    // For now, this is a test route to generate a signed URL
    // In production, this would be triggered after payment
    const url = await generateDownloadUrl(STORAGE_BUCKETS.ZIPS, result.rows[0].file_url);
    res.json({ downloadUrl: url });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate download link" });
  }
});

export default router;
