import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/:beatId/comments", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT bc.id, bc.text, bc.created_at, bc.time_offset, bc.user_id, u.email, u.avatar_url, u.username
       FROM beat_comments bc
       JOIN users u ON bc.user_id = u.id
       WHERE bc.beat_id = $1
       ORDER BY bc.created_at DESC`,
      [req.params.beatId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání komentářů" });
  }
});

router.get("/:beatId/stats", async (req: Request, res: Response) => {
  try {
    const [commentsRes, savesRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM beat_comments WHERE beat_id = $1", [req.params.beatId]),
      pool.query("SELECT COUNT(*) FROM saved_items WHERE item_id = $1 AND item_type = 'beat'", [req.params.beatId]),
    ]);
    res.json({
      comments: parseInt(commentsRes.rows[0].count, 10),
      saves: parseInt(savesRes.rows[0].count, 10),
    });
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání statistik" });
  }
});

router.delete("/:beatId/comments/:commentId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const check = await pool.query(
      "SELECT user_id FROM beat_comments WHERE id = $1 AND beat_id = $2",
      [req.params.commentId, req.params.beatId]
    );
    if (!check.rows[0]) return res.status(404).json({ error: "Komentář nenalezen" });

    const userRes = await pool.query("SELECT is_admin FROM users WHERE id = $1", [userId]);
    const isAdmin = userRes.rows[0]?.is_admin;

    if (check.rows[0].user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: "Nemáš oprávnění smazat tento komentář" });
    }

    await pool.query("DELETE FROM beat_comments WHERE id = $1", [req.params.commentId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání komentáře" });
  }
});

router.patch("/:beatId/comments/:commentId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { time_offset } = req.body;

    const check = await pool.query(
      "SELECT user_id FROM beat_comments WHERE id = $1 AND beat_id = $2",
      [req.params.commentId, req.params.beatId]
    );
    if (!check.rows[0]) return res.status(404).json({ error: "Komentář nenalezen" });
    if (check.rows[0].user_id !== userId) return res.status(403).json({ error: "Nemáš oprávnění" });

    const offset = typeof time_offset === "number" && isFinite(time_offset) ? time_offset : 0;
    await pool.query(
      "UPDATE beat_comments SET time_offset = $1 WHERE id = $2",
      [offset, req.params.commentId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při přesunu komentáře" });
  }
});

router.get("/:beatId/my-last-comment", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const result = await pool.query(
      `SELECT bc.id, bc.text, bc.created_at, bc.time_offset, bc.user_id, u.email, u.avatar_url, u.username
       FROM beat_comments bc
       JOIN users u ON bc.user_id = u.id
       WHERE bc.beat_id = $1 AND bc.user_id = $2
       ORDER BY bc.created_at DESC
       LIMIT 1`,
      [req.params.beatId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Žádný komentář nenalezen" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání komentáře" });
  }
});

router.post("/:beatId/comments", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, time_offset } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Komentář nesmí být prázdný" });
    }
    const offset = typeof time_offset === "number" && isFinite(time_offset) ? time_offset : 0;
    const result = await pool.query(
      `INSERT INTO beat_comments (beat_id, user_id, text, time_offset)
       VALUES ($1, $2, $3, $4)
       RETURNING id, text, created_at, time_offset`,
      [req.params.beatId, req.session.userId, text.trim(), offset]
    );
    const userRes = await pool.query("SELECT id, email, avatar_url, username FROM users WHERE id = $1", [req.session.userId]);
    const comment = {
      ...result.rows[0],
      user_id: req.session.userId,
      email: userRes.rows[0]?.email,
      avatar_url: userRes.rows[0]?.avatar_url,
      username: userRes.rows[0]?.username,
    };
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: "Chyba při přidávání komentáře" });
  }
});

export default router;
