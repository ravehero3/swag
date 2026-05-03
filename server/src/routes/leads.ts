import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendFreeDownloadEmail } from "../email.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, items } = req.body;
    const userId = req.session.userId || null;

    if (!email || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Chybí email nebo položky" });
    }

    const result = await pool.query(
      `INSERT INTO leads (email, user_id, items) VALUES ($1, $2, $3) RETURNING *`,
      [email, userId, JSON.stringify(items)]
    );

    const lead = result.rows[0];

    try {
      await sendFreeDownloadEmail(lead);
    } catch (err) {
      console.error("[Email] Free download email error:", err);
    }

    return res.json({ success: true, id: lead.id });
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({ error: "Chyba při zpracování" });
  }
});

router.get("/admin", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM leads ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání zájemců" });
  }
});

router.get("/admin/customers", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (email) email, id, total, status, created_at, items
       FROM orders
       WHERE status IN ('completed', 'paid') AND total > 0
       ORDER BY email, created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání zákazníků" });
  }
});

export default router;
