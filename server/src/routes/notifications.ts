import { Request, Response, Router } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

/**
 * Get all notifications for admin (paginated, latest first)
 * Query params: limit (default 100), offset (default 0), unread_only (default false)
 */
router.get("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req.session as any).userId;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const unreadOnly = req.query.unread_only === "true";

    let query = "SELECT * FROM admin_notifications WHERE admin_id = $1";
    const params: any[] = [adminId];
    let paramCount = 1;

    if (unreadOnly) {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Chyba při načítání oznámení" });
  }
});

/**
 * Get unread notification count
 */
router.get("/count/unread", requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req.session as any).userId;
    const result = await pool.query(
      "SELECT COUNT(*) as unread_count FROM admin_notifications WHERE admin_id = $1 AND is_read = false",
      [adminId]
    );
    res.json({ unread_count: parseInt(result.rows[0]?.unread_count || 0) });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Chyba při načítání počtu oznámení" });
  }
});

/**
 * Mark notification as read
 */
router.patch("/:id/read", requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req.session as any).userId;
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE admin_notifications SET is_read = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND admin_id = $2 RETURNING *",
      [id, adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Oznámení nenalezeno" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Chyba při aktualizaci oznámení" });
  }
});

/**
 * Mark all notifications as read
 */
router.patch("/read-all", requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req.session as any).userId;

    await pool.query(
      "UPDATE admin_notifications SET is_read = true, updated_at = CURRENT_TIMESTAMP WHERE admin_id = $1 AND is_read = false",
      [adminId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Chyba při aktualizaci oznámení" });
  }
});

/**
 * Delete a notification
 */
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req.session as any).userId;
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM admin_notifications WHERE id = $1 AND admin_id = $2 RETURNING id",
      [id, adminId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Oznámení nenalezeno" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Chyba při mazání oznámení" });
  }
});

/**
 * Create a notification (internal use)
 * This function is called from other routes (orders, likes, comments)
 */
export async function createNotification(
  adminId: number,
  type: "purchase" | "like" | "comment" | "system",
  title: string,
  description: string,
  relatedData?: Record<string, any>
) {
  try {
    await pool.query(
      `INSERT INTO admin_notifications (admin_id, type, title, description, related_data)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, type, title, description, relatedData ? JSON.stringify(relatedData) : null]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

export default router;
