import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM beats WHERE is_published = true ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání beatů" });
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

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, isPublished } = req.body;
    const result = await pool.query(
      `INSERT INTO beats (title, artist, bpm, key, price, preview_url, file_url, artwork_url, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, artist || "VOODOO808", bpm, key, price, previewUrl, fileUrl, artworkUrl, isPublished || false]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating beat:", error);
    res.status(500).json({ error: "Chyba při vytváření beatu" });
  }
});

router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, isPublished } = req.body;
    const result = await pool.query(
      `UPDATE beats SET title = $1, artist = $2, bpm = $3, key = $4, price = $5, 
       preview_url = $6, file_url = $7, artwork_url = $8, is_published = $9
       WHERE id = $10 RETURNING *`,
      [title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, isPublished, req.params.id]
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

export default router;
