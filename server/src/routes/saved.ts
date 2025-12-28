import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await pool.query(
      `SELECT si.*, 
        CASE 
          WHEN si.item_type = 'beat' THEN (SELECT row_to_json(b.*) FROM beats b WHERE b.id = si.item_id)
          WHEN si.item_type = 'sound_kit' THEN (SELECT row_to_json(sk.*) FROM sound_kits sk WHERE sk.id = si.item_id)
        END as item_data
       FROM saved_items si 
       WHERE si.user_id = $1 
       ORDER BY si.created_at DESC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching saved items:", error);
    res.status(500).json({ error: "Failed to fetch saved items" });
  }
});

router.post("/", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { itemId, itemType } = req.body;

  if (!itemId || !itemType) {
    return res.status(400).json({ error: "Missing itemId or itemType" });
  }

  try {
    await pool.query(
      `INSERT INTO saved_items (user_id, item_id, item_type) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, item_id, item_type) DO NOTHING`,
      [req.session.userId, itemId, itemType]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).json({ error: "Failed to save item" });
  }
});

router.delete("/:itemType/:itemId", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { itemId, itemType } = req.params;

  try {
    await pool.query(
      `DELETE FROM saved_items WHERE user_id = $1 AND item_id = $2 AND item_type = $3`,
      [req.session.userId, itemId, itemType]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error removing saved item:", error);
    res.status(500).json({ error: "Failed to remove saved item" });
  }
});

router.get("/check/:itemType/:itemId", async (req, res) => {
  if (!req.session.userId) {
    return res.json({ saved: false });
  }

  const { itemId, itemType } = req.params;

  try {
    const result = await pool.query(
      `SELECT id FROM saved_items WHERE user_id = $1 AND item_id = $2 AND item_type = $3`,
      [req.session.userId, itemId, itemType]
    );
    res.json({ saved: result.rows.length > 0 });
  } catch (error) {
    res.json({ saved: false });
  }
});

export default router;
