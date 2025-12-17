import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/licenses", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, price, fileTypes, termsText, isNegotiable, isActive } = req.body;
    
    if (!name || price === undefined || !fileTypes || !Array.isArray(fileTypes)) {
      return res.status(400).json({ error: "Název, cena a typy souborů jsou povinné" });
    }

    const result = await pool.query(
      `INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description || null, price, fileTypes, termsText || null, isNegotiable || false, isActive !== false]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating license:", error);
    res.status(500).json({ error: "Chyba při vytváření licence" });
  }
});

router.put("/licenses/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, price, fileTypes, termsText, isNegotiable, isActive } = req.body;
    
    if (!name || price === undefined || !fileTypes || !Array.isArray(fileTypes)) {
      return res.status(400).json({ error: "Název, cena a typy souborů jsou povinné" });
    }

    const result = await pool.query(
      `UPDATE license_types 
       SET name = $1, description = $2, price = $3, file_types = $4, terms_text = $5, is_negotiable = $6, is_active = $7
       WHERE id = $8 RETURNING *`,
      [name, description || null, price, fileTypes, termsText || null, isNegotiable || false, isActive !== false, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Licence nenalezena" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating license:", error);
    res.status(500).json({ error: "Chyba při aktualizaci licence" });
  }
});

router.delete("/licenses/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "DELETE FROM license_types WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Licence nenalezena" });
    }
    
    res.json({ message: "Licence smazána" });
  } catch (error) {
    console.error("Error deleting license:", error);
    res.status(500).json({ error: "Chyba při mazání licence" });
  }
});

router.post("/beats/:id/license-files", requireAdmin, async (req: Request, res: Response) => {
  try {
    const beatId = req.params.id;
    const { licenseTypeId, fileUrl } = req.body;
    
    if (!licenseTypeId || !fileUrl) {
      return res.status(400).json({ error: "ID licence a URL souboru jsou povinné" });
    }

    const beatCheck = await pool.query("SELECT id FROM beats WHERE id = $1", [beatId]);
    if (beatCheck.rows.length === 0) {
      return res.status(404).json({ error: "Beat nenalezen" });
    }

    const licenseCheck = await pool.query("SELECT id FROM license_types WHERE id = $1", [licenseTypeId]);
    if (licenseCheck.rows.length === 0) {
      return res.status(404).json({ error: "Licence nenalezena" });
    }

    const result = await pool.query(
      `INSERT INTO beat_license_files (beat_id, license_type_id, file_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (beat_id, license_type_id) 
       DO UPDATE SET file_url = $3, uploaded_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [beatId, licenseTypeId, fileUrl]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error uploading license file:", error);
    res.status(500).json({ error: "Chyba při nahrávání souboru licence" });
  }
});

router.get("/beats/:id/license-files", requireAdmin, async (req: Request, res: Response) => {
  try {
    const beatId = req.params.id;
    const result = await pool.query(
      `SELECT blf.*, lt.name as license_name, lt.description as license_description
       FROM beat_license_files blf
       JOIN license_types lt ON blf.license_type_id = lt.id
       WHERE blf.beat_id = $1
       ORDER BY lt.price ASC`,
      [beatId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching license files:", error);
    res.status(500).json({ error: "Chyba při načítání souborů licence" });
  }
});

router.delete("/beats/:beatId/license-files/:licenseTypeId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { beatId, licenseTypeId } = req.params;
    const result = await pool.query(
      "DELETE FROM beat_license_files WHERE beat_id = $1 AND license_type_id = $2 RETURNING *",
      [beatId, licenseTypeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Soubor licence nenalezen" });
    }
    
    res.json({ message: "Soubor licence smazán" });
  } catch (error) {
    console.error("Error deleting license file:", error);
    res.status(500).json({ error: "Chyba při mazání souboru licence" });
  }
});

export default router;
