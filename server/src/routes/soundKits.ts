import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { generateDownloadUrl, STORAGE_BUCKETS } from "../lib/storage.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, title, description, type, price, is_free, number_of_sounds, tags, preview_url, preview_urls, file_url, artwork_url, legal_info, author_info, is_published, order_index, created_at FROM sound_kits WHERE is_published = true ORDER BY order_index ASC, created_at DESC"
    );
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sound kits:", error);
    res.status(500).json({ error: "Chyba při načítání zvukových kitů" });
  }
});

router.get("/all", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM sound_kits ORDER BY order_index ASC, created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání zvukových kitů" });
  }
});

router.patch("/reorder", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { swaps } = req.body as { swaps: { id: number; orderIndex: number }[] };
    if (!Array.isArray(swaps) || swaps.length === 0) {
      return res.status(400).json({ error: "Neplatná data pro přeřazení" });
    }
    for (const swap of swaps) {
      await pool.query("UPDATE sound_kits SET order_index = $1 WHERE id = $2", [swap.orderIndex, swap.id]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při změně pořadí kitů" });
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
      tags, previewUrl, previewUrls, fileUrl, artworkUrl, legalInfo, authorInfo, isPublished 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sound_kits (title, description, type, price, is_free, number_of_sounds, 
       tags, preview_url, preview_urls, file_url, artwork_url, legal_info, author_info, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [title, description, type, price || 0, isFree || false, numberOfSounds || 0, 
       tags || [], previewUrl || (previewUrls?.[0] || null), previewUrls || [], fileUrl, artworkUrl, legalInfo, authorInfo, isPublished || false]
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
      tags, previewUrl, previewUrls, fileUrl, artworkUrl, legalInfo, authorInfo, isPublished 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE sound_kits SET title = $1, description = $2, type = $3, price = $4, 
       is_free = $5, number_of_sounds = $6, tags = $7, preview_url = $8, preview_urls = $9,
       file_url = $10, artwork_url = $11, legal_info = $12, author_info = $13, is_published = $14
       WHERE id = $15 RETURNING *`,
      [title, description, type, price, isFree, numberOfSounds, tags, 
       previewUrl || (previewUrls?.[0] || null), previewUrls || [],
       fileUrl, artworkUrl, legalInfo, authorInfo, isPublished, req.params.id]
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

router.post("/bulk-delete", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Musíte vybrat alespoň jeden kit" });
    }
    await pool.query("DELETE FROM sound_kits WHERE id = ANY($1)", [ids]);
    res.json({ message: `${ids.length} kitů smazáno` });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání kitů" });
  }
});

router.get("/:id/download", requireAuth, async (req: Request, res: Response) => {
  try {
    const kitId = req.params.id;
    const userId = req.session.userId;
    const isAdmin = req.session.isAdmin;

    // Only admins or users with a completed purchase can download the asset.
    if (!isAdmin) {
      const purchaseCheck = await pool.query(
        `SELECT 1
         FROM orders o
         WHERE o.user_id = $1
           AND o.status = 'completed'
           AND EXISTS (
             SELECT 1
             FROM jsonb_array_elements(o.items) AS item
             WHERE item->>'productType' = 'sound_kit'
               AND item->>'productId' = $2
           )
         LIMIT 1`,
        [userId, kitId]
      );

      if (purchaseCheck.rows.length === 0) {
        return res.status(403).json({ error: "Produkt nebyl zakoupen nebo objednávka není dokončena" });
      }
    }

    const result = await pool.query("SELECT file_url FROM sound_kits WHERE id = $1", [kitId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sound kit nenalezen" });
    }
    const fileUrl: string = result.rows[0].file_url;
    if (!fileUrl) {
      return res.status(404).json({ error: "Soubor není dostupný" });
    }
    // If it's already a full URL (Google Drive, etc.) return it directly
    if (fileUrl.startsWith("https://") || fileUrl.startsWith("http://")) {
      return res.json({ downloadUrl: fileUrl });
    }
    // Otherwise it's a B2 object key — generate a signed download URL
    const url = await generateDownloadUrl(STORAGE_BUCKETS.ZIPS, fileUrl);
    res.json({ downloadUrl: url });
  } catch (error) {
    res.status(500).json({ error: "Chyba při generování odkazu ke stažení" });
  }
});

export default router;
