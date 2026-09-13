import { pool } from "../../db.js";
import { processEnrollment, type Enrollment } from "./journeys.js";
import { compileBlocksToHtml } from "./blockCompiler.js";
import { sendMarketingEmail } from "./sender.js";

// ─────────────────────────────────────────────────────────────────────────────
// Scheduler tick. Plain setInterval on the single persistent process —
// no cron/Redis/BullMQ. Postgres advisory lock ensures only one instance
// processes rows even if the process is ever scaled to >1 replica.
// ─────────────────────────────────────────────────────────────────────────────

const SCHEDULER_LOCK_KEY = 918_233_001;
const BATCH_SIZE = 50;

async function withSchedulerLock<T>(fn: () => Promise<T>): Promise<T | null> {
  const client = await pool.connect();
  try {
    const lockRes = await client.query("SELECT pg_try_advisory_lock($1) AS locked", [SCHEDULER_LOCK_KEY]);
    if (!lockRes.rows[0].locked) return null;
    try {
      return await fn();
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [SCHEDULER_LOCK_KEY]);
    }
  } finally {
    client.release();
  }
}

// ── Journey enrollment processor ────────────────────────────────────────────
async function processDueEnrollments(): Promise<number> {
  let processedCount = 0;
  while (true) {
    const client = await pool.connect();
    let batch: Enrollment[] = [];
    try {
      await client.query("BEGIN");
      const dueRes = await client.query<Enrollment>(
        `SELECT * FROM marketing_enrollments
         WHERE status = 'active' AND next_run_at IS NOT NULL AND next_run_at <= NOW()
         ORDER BY next_run_at ASC LIMIT $1 FOR UPDATE SKIP LOCKED`,
        [BATCH_SIZE]
      );
      batch = dueRes.rows;
      if (batch.length > 0) {
        const ids = batch.map((e) => e.id);
        await client.query(
          "UPDATE marketing_enrollments SET next_run_at = NOW() + INTERVAL '5 minutes' WHERE id = ANY($1::int[])",
          [ids]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("[Marketing] scheduler.batch_fetch_error:", err);
      break;
    } finally {
      client.release();
    }
    if (batch.length === 0) break;
    for (const enrollment of batch) {
      try {
        await processEnrollment(enrollment);
        processedCount++;
      } catch (err) {
        console.error(`[Marketing] scheduler.enrollment_processing_error enrollment=${enrollment.id}:`, err);
      }
    }
    if (batch.length < BATCH_SIZE) break;
  }
  return processedCount;
}

// ── Scheduled campaign processor ────────────────────────────────────────────
async function processScheduledCampaigns(): Promise<number> {
  // Atomically claim campaigns whose scheduled time has arrived
  const claimRes = await pool.query(
    `UPDATE marketing_campaigns SET status = 'sending', updated_at = CURRENT_TIMESTAMP
     WHERE status = 'scheduled' AND scheduled_at <= NOW() RETURNING *`
  );
  if (claimRes.rows.length === 0) return 0;

  let fired = 0;
  for (const campaign of claimRes.rows) {
    try {
      let campaignHtml = campaign.html_content || "";
      if (!campaignHtml && Array.isArray(campaign.blocks) && campaign.blocks.length > 0) {
        campaignHtml = compileBlocksToHtml(campaign.blocks);
      }
      if (!campaignHtml && campaign.template_id) {
        const tplRes = await pool.query("SELECT html_content, blocks FROM marketing_templates WHERE id = $1", [campaign.template_id]);
        const tpl = tplRes.rows[0];
        if (tpl) campaignHtml = tpl.html_content || (Array.isArray(tpl.blocks) ? compileBlocksToHtml(tpl.blocks) : "");
      }

      const audience = await resolveSegmentAudience(campaign.segment_rules);
      await pool.query("UPDATE marketing_campaigns SET recipient_count = $2 WHERE id = $1", [campaign.id, audience.length]);

      const BATCH = 25;
      for (let idx = 0; idx < audience.length; idx += BATCH) {
        const chunk = audience.slice(idx, idx + BATCH);
        await Promise.all(
          chunk.map((subscriber: any) =>
            sendMarketingEmail({
              subscriber,
              templateId: campaign.template_id || undefined,
              campaignId: campaign.id,
              idempotencyKey: `campaign/${campaign.id}/subscriber/${subscriber.id}`,
              customSubject: campaign.subject || undefined,
              customPreheader: campaign.preheader || undefined,
              customHtml: campaignHtml || undefined,
            }).catch((err) => console.error(`[Marketing] scheduled send failed subscriber=${subscriber.id}:`, err))
          )
        );
      }

      await pool.query(
        "UPDATE marketing_campaigns SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [campaign.id]
      );
      console.log(`[Marketing] scheduled_campaign.sent campaign=${campaign.id} recipients=${audience.length}`);
      fired++;
    } catch (err) {
      console.error(`[Marketing] scheduled_campaign.failed campaign=${campaign.id}:`, err);
      // Roll back to draft so admin can retry
      await pool.query("UPDATE marketing_campaigns SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [campaign.id]);
    }
  }
  return fired;
}

/**
 * Resolve subscriber audience from segment_rules JSONB.
 * Rules: { type: "all"|"buyers"|"non_buyers"|"tag"|"no_tag"|"recent"|"non_openers", tag?, days?, parent_campaign_id? }
 */
export async function resolveSegmentAudience(segmentRules: any): Promise<any[]> {
  const rules = segmentRules && typeof segmentRules === "object" ? segmentRules : { type: "all" };
  const base = `
    SELECT s.* FROM subscribers s
    WHERE s.marketing_consent = TRUE AND s.unsubscribed_at IS NULL AND s.suppressed_at IS NULL
  `;
  switch (rules.type) {
    case "buyers":
      return (await pool.query(base + " AND s.is_buyer = TRUE ORDER BY s.id ASC")).rows;
    case "non_buyers":
      return (await pool.query(base + " AND s.is_buyer = FALSE ORDER BY s.id ASC")).rows;
    case "tag": {
      const slug = String(rules.tag || "");
      if (!slug) return (await pool.query(base + " ORDER BY s.id ASC")).rows;
      return (await pool.query(
        base + ` AND EXISTS (SELECT 1 FROM subscriber_tags st JOIN tags t ON t.id = st.tag_id WHERE st.subscriber_id = s.id AND t.slug = $1) ORDER BY s.id ASC`,
        [slug]
      )).rows;
    }
    case "no_tag": {
      const slug = String(rules.tag || "");
      if (!slug) return (await pool.query(base + " ORDER BY s.id ASC")).rows;
      return (await pool.query(
        base + ` AND NOT EXISTS (SELECT 1 FROM subscriber_tags st JOIN tags t ON t.id = st.tag_id WHERE st.subscriber_id = s.id AND t.slug = $1) ORDER BY s.id ASC`,
        [slug]
      )).rows;
    }
    case "recent": {
      const days = Math.max(1, parseInt(String(rules.days || "30"), 10) || 30);
      return (await pool.query(base + ` AND s.created_at >= NOW() - INTERVAL '${days} days' ORDER BY s.id ASC`)).rows;
    }
    case "non_openers": {
      const parentId = parseInt(String(rules.parent_campaign_id || "0"), 10);
      if (!parentId) return [];
      return (await pool.query(
        base + ` AND EXISTS (
          SELECT 1 FROM marketing_email_sends mes WHERE mes.subscriber_id = s.id AND mes.campaign_id = $1 AND mes.status IN ('sent','delivered')
        ) AND NOT EXISTS (
          SELECT 1 FROM marketing_email_sends mes WHERE mes.subscriber_id = s.id AND mes.campaign_id = $1 AND mes.opened_at IS NOT NULL
        ) ORDER BY s.id ASC`,
        [parentId]
      )).rows;
    }
    default:
      return (await pool.query(base + " ORDER BY s.id ASC")).rows;
  }
}

let tickInFlight = false;

export async function runSchedulerTick(): Promise<void> {
  if (tickInFlight) { console.log("[Marketing] scheduler.tick_skipped reason=already_running"); return; }
  tickInFlight = true;
  try {
    const result = await withSchedulerLock(async () => {
      const enrollmentsProcessed = await processDueEnrollments();
      const campaignsFired = await processScheduledCampaigns();
      return { enrollmentsProcessed, campaignsFired };
    });
    if (result === null) {
      console.log("[Marketing] scheduler.tick_skipped reason=lock_held_elsewhere");
    } else if (result.enrollmentsProcessed > 0 || result.campaignsFired > 0) {
      console.log(`[Marketing] scheduler.tick_completed enrollments=${result.enrollmentsProcessed} campaigns=${result.campaignsFired}`);
    }
  } catch (err) {
    console.error("[Marketing] scheduler.tick_error:", err);
  } finally {
    tickInFlight = false;
  }
}

export function startMarketingScheduler(intervalMs: number = 2 * 60 * 1000): NodeJS.Timeout {
  console.log(`[Marketing] scheduler.started interval_ms=${intervalMs}`);
  runSchedulerTick().catch((err) => console.error("[Marketing] initial scheduler tick failed:", err));
  return setInterval(() => {
    runSchedulerTick().catch((err) => console.error("[Marketing] scheduler tick failed:", err));
  }, intervalMs);
}
