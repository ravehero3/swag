import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM license_types WHERE is_active = true ORDER BY price ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching licenses:", error);
    res.status(500).json({ error: "Chyba při načítání licencí" });
  }
});

router.get("/all", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM license_types ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching all licenses:", error);
    res.status(500).json({ error: "Chyba při načítání licencí" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM license_types WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Licence nenalezena" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching license:", error);
    res.status(500).json({ error: "Chyba při načítání licence" });
  }
});

export default router;
