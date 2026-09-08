import { pool } from "../db.js";
import { processEnrollment, type Enrollment } from "./journeys.js";

// ─────────────────────────────────────────────────────────────────────────────
// Scheduler tick. Reuses the exact same pattern already established in
// server/src/index.ts for `sendOverdueBankTransferReminders` /
// `sendAbandonedCheckoutReminders` — a plain setInterval on the single
// persistent Docker process (confirmed safe during the Phase 1 audit; this
// is NOT a serverless deployment). No cron/Redis/BullMQ introduced.
//
// Concurrency safety: a Postgres advisory lock ensures that even if this
// process were ever scaled to >1 replica, only one instance's tick actually
// processes due enrollments at a time — the second replica's pg_try_advisory_lock
// call simply returns false and that tick becomes a no-op.
// ─────────────────────────────────────────────────────────────────────────────

const SCHEDULER_LOCK_KEY = 918_233_001; // arbitrary fixed int for pg_try_advisory_lock
const BATCH_SIZE = 50;

async function withSchedulerLock<T>(fn: () => Promise<T>): Promise<T | null> {
  const client = await pool.connect();
  try {
    const lockRes = await client.query("SELECT pg_try_advisory_lock($1) AS locked", [SCHEDULER_LOCK_KEY]);
    if (!lockRes.rows[0].locked) {
      return null; // another process/tick already holds the lock
    }
    try {
      return await fn();
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [SCHEDULER_LOCK_KEY]);
    }
  } finally {
    client.release();
  }
}

/**
 * Find due enrollments and process each, one batch at a time. Uses
 * `FOR UPDATE SKIP LOCKED` so a slow/stuck row never blocks the batch, and
 * so a second concurrent tick (belt-and-suspenders on top of the advisory
 * lock) can never grab the same row twice.
 */
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
         ORDER BY next_run_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [BATCH_SIZE]
      );
      batch = dueRes.rows;
      if (batch.length > 0) {
        // Immediately push next_run_at forward by a short grace window so a
        // slow processEnrollment() call can't cause the same row to be
        // picked up again by an overlapping tick before it finishes.
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

    if (batch.length < BATCH_SIZE) break; // no more due rows right now
  }

  return processedCount;
}

let tickInFlight = false;

export async function runSchedulerTick(): Promise<void> {
  if (tickInFlight) {
    console.log("[Marketing] scheduler.tick_skipped reason=already_running");
    return;
  }
  tickInFlight = true;
  try {
    const result = await withSchedulerLock(processDueEnrollments);
    if (result === null) {
      console.log("[Marketing] scheduler.tick_skipped reason=lock_held_elsewhere");
    } else if (result > 0) {
      console.log(`[Marketing] scheduler.tick_completed processed=${result}`);
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
