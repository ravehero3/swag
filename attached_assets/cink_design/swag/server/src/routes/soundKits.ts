import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sound_kits WHERE is_published = true ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání zvukových kitů" });
  }
});

router.get("/all", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM sound_kits ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání zvukových kitů" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM sound_kits WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Kit nenalezen" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání kitu" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      title, description, type, price, isFree, numberOfSounds, 
      tags, previewUrl, fileUrl, artworkUrl, legalInfo, authorInfo, isPublished 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sound_kits (title, description, type, price, is_free, number_of_sounds, 
       tags, preview_url, file_url, artwork_url, legal_info, author_info, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [title, description, type, price || 0, isFree || false, numberOfSounds || 0, 
       tags || [], previewUrl, fileUrl, artworkUrl, legalInfo, authorInfo, isPublished || false]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating sound kit:", error);
    res.status(500).json({ error: "Chyba při vytváření kitu" });
  }
});

router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      title, description, type, price, isFree, numberOfSounds, 
      tags, previewUrl, fileUrl, artworkUrl, legalInfo, authorInfo, isPublished 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE sound_kits SET title = $1, description = $2, type = $3, price = $4, 
       is_free = $5, number_of_sounds = $6, tags = $7, preview_url = $8, file_url = $9, 
       artwork_url = $10, legal_info = $11, author_info = $12, is_published = $13
       WHERE id = $14 RETURNING *`,
      [title, description, type, price, isFree, numberOfSounds, tags, 
       previewUrl, fileUrl, artworkUrl, legalInfo, authorInfo, isPublished, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při aktualizaci kitu" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM sound_kits WHERE id = $1", [req.params.id]);
    res.json({ message: "Kit smazán" });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání kitu" });
  }
});

export default router;
