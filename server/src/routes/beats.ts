import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { generateDownloadUrl, STORAGE_BUCKETS } from "../lib/storage.js";
import { computeWaveformFromUrl } from "../lib/waveform.js";

async function triggerWaveformComputation(beatId: number, previewUrl: string) {
  try {
    const existing = await pool.query("SELECT waveform_data FROM beats WHERE id = $1", [beatId]);
    if (existing.rows[0]?.waveform_data) return;
    const data = await computeWaveformFromUrl(previewUrl);
    if (data) {
      await pool.query("UPDATE beats SET waveform_data = $1 WHERE id = $2", [JSON.stringify(data), beatId]);
      console.log(`Waveform computed for beat ${beatId}`);
    }
  } catch (e) {
    console.error(`Waveform computation failed for beat ${beatId}:`, e);
  }
}

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { search, tag } = req.query;
    let query = "SELECT id, title, artist, bpm, key, price, preview_url, artwork_url, trackout_url, tags, is_highlighted, waveform_data, play_count, exclusive_sold, created_at FROM beats WHERE is_published = true";
    const params: any[] = [];
    
    if (tag) {
      query += ` AND $${params.length + 1} = ANY(tags)`;
      params.push(tag);
    }
    
    if (search) {
      query += ` AND title ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }
    
    query += " ORDER BY order_index ASC NULLS LAST, created_at DESC";
    const result = await pool.query(query, params);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání beatů" });
  }
});

router.get("/highlighted", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, title, artist, bpm, key, price, preview_url, file_url, artwork_url, trackout_url, tags, is_highlighted, is_published, waveform_data, created_at FROM beats WHERE is_highlighted = true AND is_published = true LIMIT 1"
    );
    // No caching — highlighted status must always be fresh so admin changes are visible immediately
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání zvýrazněného beatu" });
  }
});

router.put("/reorder", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { swaps } = req.body;
    if (!Array.isArray(swaps) || swaps.length === 0) {
      return res.status(400).json({ error: "Swaps are required" });
    }
    for (const { id, orderIndex } of swaps) {
      await pool.query("UPDATE beats SET order_index = $1 WHERE id = $2", [orderIndex, id]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error reordering beats:", error);
    res.status(500).json({ error: "Chyba při přeřazení beatů" });
  }
});

router.get("/all", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM beats ORDER BY order_index ASC NULLS LAST, created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání beatů" });
  }
});

router.get("/ffmpeg-health", requireAdmin, async (_req: Request, res: Response) => {
  const { spawn } = await import("child_process");
  const { createRequire } = await import("module");

  function getFfmpegPath(): string {
    try {
      const require = createRequire(import.meta.url);
      const p = require("ffmpeg-static");
      if (p && typeof p === "string") return p;
    } catch { /* fall through */ }
    return "ffmpeg";
  }

  const ffmpegPath = getFfmpegPath();
  const isBundle = ffmpegPath !== "ffmpeg";
  const startMs = Date.now();

  try {
    const result = await new Promise<{ ok: boolean; version: string; durationMs: number }>((resolve) => {
      const lines: string[] = [];
      const proc = spawn(ffmpegPath, ["-version"], { stdio: ["ignore", "pipe", "pipe"] });
      const collect = (chunk: Buffer) => lines.push(chunk.toString());
      proc.stdout?.on("data", collect);
      proc.stderr?.on("data", collect);
      const timer = setTimeout(() => {
        proc.kill();
        resolve({ ok: false, version: "timeout", durationMs: Date.now() - startMs });
      }, 8000);
      proc.on("close", (code) => {
        clearTimeout(timer);
        const output = lines.join("");
        const match = output.match(/ffmpeg version ([^\s]+)/);
        resolve({ ok: code === 0, version: match ? match[1] : (code === 0 ? "ok" : "not found"), durationMs: Date.now() - startMs });
      });
      proc.on("error", () => {
        clearTimeout(timer);
        resolve({ ok: false, version: "spawn error — ffmpeg not found in PATH or bundle", durationMs: Date.now() - startMs });
      });
    });
    res.json({
      ok: result.ok,
      version: result.version,
      durationMs: result.durationMs,
      source: isBundle ? `bundled (${ffmpegPath.split("/").slice(-3).join("/")})` : "system PATH",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
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

router.get("/:id/licenses", async (req: Request, res: Response) => {
  try {
    const beatId = req.params.id;
    
    const beatCheck = await pool.query("SELECT id FROM beats WHERE id = $1", [beatId]);
    if (beatCheck.rows.length === 0) {
      return res.status(404).json({ error: "Beat nenalezen" });
    }

    const result = await pool.query(
      `SELECT lt.*, blf.file_url, blf.uploaded_at as file_uploaded_at
       FROM license_types lt
       INNER JOIN beat_license_files blf ON lt.id = blf.license_type_id
       WHERE blf.beat_id = $1 AND lt.is_active = true
       ORDER BY lt.price ASC`,
      [beatId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching beat licenses:", error);
    res.status(500).json({ error: "Chyba při načítání licencí beatu" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, trackoutUrl, tags, isPublished, isHighlighted } = req.body;
    
    if (isHighlighted) {
      await pool.query("UPDATE beats SET is_highlighted = false WHERE is_highlighted = true");
    }
    
    const beatTags = Array.isArray(tags) ? tags.slice(0, 3) : [];
    const result = await pool.query(
      `INSERT INTO beats (title, artist, bpm, key, price, preview_url, file_url, artwork_url, trackout_url, tags, is_published, is_highlighted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [title, artist || "VOODOO808", bpm, key, price, previewUrl, fileUrl, artworkUrl, trackoutUrl || null, beatTags, isPublished || false, isHighlighted || false]
    );
    const beat = result.rows[0];
    res.json(beat);
    if (beat.id && previewUrl) {
      triggerWaveformComputation(beat.id, previewUrl).catch(() => {});
    }
  } catch (error) {
    console.error("Error creating beat:", error);
    res.status(500).json({ error: "Chyba při vytváření beatu" });
  }
});

router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, trackoutUrl, tags, isPublished, isHighlighted } = req.body;
    
    if (isHighlighted) {
      await pool.query("UPDATE beats SET is_highlighted = false WHERE is_highlighted = true");
    }
    
    const beatTags = Array.isArray(tags) ? tags.slice(0, 3) : [];
    // $14 is previewUrl again — avoids PostgreSQL "inconsistent types" error when $6
    // appears in both a SET position and a CASE comparison in the same query.
    const result = await pool.query(
      `UPDATE beats SET title = $1, artist = $2, bpm = $3, key = $4, price = $5,
       preview_url = $6, file_url = $7, artwork_url = $8, trackout_url = $9, tags = $10, is_published = $11, is_highlighted = $12,
       waveform_data = CASE WHEN $14::varchar IS DISTINCT FROM preview_url THEN NULL ELSE waveform_data END
       WHERE id = $13 RETURNING *`,
      [title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, trackoutUrl || null, beatTags, isPublished, isHighlighted, req.params.id, previewUrl]
    );
    const beat = result.rows[0];
    res.json(beat);
    if (beat.id && previewUrl) {
      triggerWaveformComputation(beat.id, previewUrl).catch(() => {});
    }
  } catch (error) {
    console.error("Error updating beat:", error);
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

router.post("/:id/recompute-waveform", requireAdmin, async (req: Request, res: Response) => {
  try {
    const beatId = parseInt(req.params.id, 10);
    if (isNaN(beatId)) return res.status(400).json({ error: "Invalid beat id" });
    const beatRes = await pool.query("SELECT preview_url FROM beats WHERE id = $1", [beatId]);
    if (beatRes.rows.length === 0) return res.status(404).json({ error: "Beat not found" });
    const { preview_url } = beatRes.rows[0];
    if (!preview_url) return res.status(400).json({ error: "Beat has no preview URL" });
    await pool.query("UPDATE beats SET waveform_data = NULL WHERE id = $1", [beatId]);
    const data = await computeWaveformFromUrl(preview_url);
    if (data && data.length > 0) {
      await pool.query("UPDATE beats SET waveform_data = $1 WHERE id = $2", [JSON.stringify(data), beatId]);
      console.log(`Waveform recomputed for beat ${beatId} — ${data.length} bars`);
      res.json({ success: true, status: "done", bars: data.length });
    } else {
      console.error(`Waveform recompute returned null for beat ${beatId}`);
      res.status(500).json({ error: "Waveform computation failed — ffmpeg returned no data. Check that the preview URL is reachable." });
    }
  } catch (error) {
    console.error("Recompute waveform error:", error);
    res.status(500).json({ error: "Chyba při přepočtu waveformu" });
  }
});

router.post("/:id/waveform", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid waveform data" });
    }
    await pool.query(
      "UPDATE beats SET waveform_data = $1 WHERE id = $2",
      [JSON.stringify(data), req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání waveform dat" });
  }
});

router.post("/bulk-create", requireAdmin, async (req: Request, res: Response) => {
  try {
    const beats = req.body;
    if (!Array.isArray(beats) || beats.length === 0) {
      return res.status(400).json({ error: "Žádné beaty k vytvoření" });
    }
    const results = [];
    for (const b of beats) {
      const { title, artist, bpm, key, price, previewUrl, fileUrl, artworkUrl, tags, isPublished } = b;
      const beatTags = Array.isArray(tags) ? tags.slice(0, 3) : [];
      const result = await pool.query(
        `INSERT INTO beats (title, artist, bpm, key, price, preview_url, file_url, artwork_url, tags, is_published, is_highlighted)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false) RETURNING *`,
        [title, artist || "VOODOO808", bpm || null, key || null, price || 0, previewUrl || null, fileUrl || null, artworkUrl || null, beatTags, isPublished ?? false]
      );
      const beat = result.rows[0];
      results.push(beat);
      if (beat.id && previewUrl) {
        triggerWaveformComputation(beat.id, previewUrl).catch(() => {});
      }
    }
    res.json(results);
  } catch (error) {
    console.error("Error bulk creating beats:", error);
    res.status(500).json({ error: "Chyba při hromadném vytváření beatů" });
  }
});

router.post("/bulk-delete", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Musíte vybrat alespoň jeden beat" });
    }
    await pool.query("DELETE FROM beats WHERE id = ANY($1)", [ids]);
    res.json({ message: `${ids.length} beatů smazáno` });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání beatů" });
  }
});

router.post("/bulk-publish", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Musíte vybrat alespoň jeden beat" });
    }
    await pool.query("UPDATE beats SET is_published = true WHERE id = ANY($1)", [ids]);
    res.json({ message: `${ids.length} beatů zveřejněno` });
  } catch (error) {
    res.status(500).json({ error: "Chyba při zveřejňování beatů" });
  }
});

router.post("/publish-all", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("UPDATE beats SET is_published = true WHERE is_published = false RETURNING id");
    res.json({ updated: result.rowCount, message: `${result.rowCount} beatů bylo zveřejněno` });
  } catch (error) {
    res.status(500).json({ error: "Chyba při zveřejňování všech beatů" });
  }
});

router.post("/:id/play", async (req: Request, res: Response) => {
  try {
    const beatId = parseInt(req.params.id, 10);
    if (isNaN(beatId)) return res.status(400).json({ error: "Invalid beat id" });
    await pool.query("UPDATE beats SET play_count = COALESCE(play_count, 0) + 1 WHERE id = $1", [beatId]);
    const result = await pool.query("SELECT play_count FROM beats WHERE id = $1", [beatId]);
    res.json({ play_count: result.rows[0]?.play_count ?? 0 });
  } catch (error) {
    res.status(500).json({ error: "Chyba při aktualizaci počtu přehrání" });
  }
});

router.get("/:id/download", requireAuth, async (req: Request, res: Response) => {
  try {
    const beatId = req.params.id;

    const result = await pool.query("SELECT file_url, preview_url FROM beats WHERE id = $1", [beatId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Beat nenalezen" });
    }

    const { file_url, preview_url } = result.rows[0];
    const fileUrl: string | null = file_url || preview_url;

    if (!fileUrl) {
      return res.status(404).json({ error: "Soubor není dostupný" });
    }

    // If it's already a full URL (Google Drive, etc.) return it directly
    if (fileUrl.startsWith("https://") || fileUrl.startsWith("http://")) {
      return res.json({ downloadUrl: fileUrl });
    }

    // Locally stored beat file (saved in public/uploads/beats/)
    if (fileUrl.startsWith("/uploads/")) {
      const { getAppBaseUrl } = await import("../lib/appUrl.js");
      return res.json({ downloadUrl: `${getAppBaseUrl()}${fileUrl}` });
    }

    const url = await generateDownloadUrl(STORAGE_BUCKETS.ZIPS, fileUrl);
    res.json({ downloadUrl: url });
  } catch (error) {
    res.status(500).json({ error: "Chyba při generování odkazu ke stažení" });
  }
});

export default router;
