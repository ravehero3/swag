import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání objednávek" });
  }
});

router.get("/my", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání objednávek" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, items, total } = req.body;
    const userId = req.session.userId || null;
    
    const result = await pool.query(
      `INSERT INTO orders (user_id, email, items, total, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [userId, email, JSON.stringify(items), total]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Chyba při vytváření objednávky" });
  }
});

router.put("/:id/status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při aktualizaci objednávky" });
  }
});

export default router;
