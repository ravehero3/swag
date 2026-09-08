import { pool } from "../../db.js";
import {
  getSubscriberById,
  isMarketingEligible,
  hasCompletedPurchase,
  subscriberHasTag,
  type Subscriber,
} from "./subscribers.js";
import { sendMarketingEmail } from "./sender.js";

// ─────────────────────────────────────────────────────────────────────────────
// Journey engine — enrollment, condition evaluation, and step advancement.
// Designed to be called from: (a) event hooks (freebie/purchase/signup) for
// enrollment, and (b) the scheduler tick (see scheduler.ts) for advancement.
// ─────────────────────────────────────────────────────────────────────────────

export interface JourneyStep {
  id: number;
  journey_id: number;
  position: number;
  step_type: "email" | "wait" | "condition" | "tag_add" | "tag_remove" | "end";
  delay_hours: number;
  template_id: number | null;
  configuration: any;
}

export interface Journey {
  id: number;
  name: string;
  trigger_type: string;
  trigger_value: string | null;
  status: "draft" | "active" | "paused";
  version: number;
}

export interface Enrollment {
  id: number;
  subscriber_id: number;
  journey_id: number;
  journey_version: number;
  current_step_id: number | null;
  status: "active" | "paused" | "completed" | "cancelled" | "failed";
  next_run_at: string | null;
  last_error: string | null;
}

/**
 * Enroll a subscriber into an active journey matching the given trigger.
 * Idempotent — the DB UNIQUE(subscriber_id, journey_id) constraint plus the
 * ON CONFLICT DO NOTHING guarantees a subscriber is never double-enrolled in
 * the same journey, even if the trigger fires twice (e.g. duplicate webhook,
 * re-download of the same freebie).
 */
export async function enrollByTrigger(
  triggerType: string,
  triggerValue: string | null,
  subscriberId: number
): Promise<void> {
  const journeys = await pool.query<Journey>(
    `SELECT * FROM marketing_journeys
     WHERE trigger_type = $1 AND status = 'active'
       AND (trigger_value IS NULL OR trigger_value = $2 OR $2 IS NULL)`,
    [triggerType, triggerValue]
  );

  for (const journey of journeys.rows) {
    await enrollSubscriberInJourney(subscriberId, journey.id);
  }
}

export async function enrollSubscriberInJourney(subscriberId: number, journeyId: number): Promise<Enrollment | null> {
  const journeyRes = await pool.query<Journey>("SELECT * FROM marketing_journeys WHERE id = $1", [journeyId]);
  const journey = journeyRes.rows[0];
  if (!journey || journey.status !== "active") return null;

  const firstStepRes = await pool.query<JourneyStep>(
    "SELECT * FROM marketing_journey_steps WHERE journey_id = $1 ORDER BY position ASC LIMIT 1",
    [journeyId]
  );
  const firstStep = firstStepRes.rows[0];
  if (!firstStep) {
    console.warn(`[Marketing] Journey ${journeyId} has no steps — skipping enrollment`);
    return null;
  }

  const nextRunAt = new Date(Date.now() + firstStep.delay_hours * 60 * 60 * 1000);

  try {
    const result = await pool.query<Enrollment>(
      `INSERT INTO marketing_enrollments (subscriber_id, journey_id, journey_version, current_step_id, status, next_run_at)
       VALUES ($1, $2, $3, $4, 'active', $5)
       ON CONFLICT (subscriber_id, journey_id) DO NOTHING
       RETURNING *`,
      [subscriberId, journeyId, journey.version, firstStep.id, nextRunAt]
    );
    if (result.rows.length > 0) {
      console.log(`[Marketing] journey.enrolled subscriber=${subscriberId} journey=${journeyId} step=${firstStep.id}`);
    }
    return result.rows[0] || null;
  } catch (err) {
    console.error(`[Marketing] Failed to enroll subscriber ${subscriberId} in journey ${journeyId}:`, err);
    return null;
  }
}

// ── Condition evaluation ─────────────────────────────────────────────────────

export interface ConditionConfig {
  condition: "has_purchased" | "has_tag" | "not_has_tag" | "has_freebie";
  tag?: string;
  onTrue: "end" | "continue";
  onFalse: "end" | "continue";
}

async function evaluateCondition(subscriber: Subscriber, config: ConditionConfig): Promise<boolean> {
  switch (config.condition) {
    case "has_purchased":
      return hasCompletedPurchase(subscriber.id);
    case "has_tag":
      return config.tag ? subscriberHasTag(subscriber.id, config.tag) : false;
    case "not_has_tag":
      return config.tag ? !(await subscriberHasTag(subscriber.id, config.tag)) : true;
    case "has_freebie": {
      const res = await pool.query("SELECT 1 FROM subscriber_freebies WHERE subscriber_id = $1 LIMIT 1", [subscriber.id]);
      return res.rows.length > 0;
    }
    default:
      return false;
  }
}

// ── Advancement (called by the scheduler for each due enrollment) ──────────

async function getNextStep(journeyId: number, position: number): Promise<JourneyStep | null> {
  const res = await pool.query<JourneyStep>(
    "SELECT * FROM marketing_journey_steps WHERE journey_id = $1 AND position > $2 ORDER BY position ASC LIMIT 1",
    [journeyId, position]
  );
  return res.rows[0] || null;
}

async function completeEnrollment(enrollmentId: number): Promise<void> {
  await pool.query(
    "UPDATE marketing_enrollments SET status = 'completed', completed_at = CURRENT_TIMESTAMP, next_run_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [enrollmentId]
  );
}

async function failEnrollment(enrollmentId: number, error: string): Promise<void> {
  await pool.query(
    "UPDATE marketing_enrollments SET status = 'failed', last_error = $2, next_run_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [enrollmentId, error.slice(0, 2000)]
  );
}

async function advanceToStep(enrollmentId: number, step: JourneyStep): Promise<void> {
  const nextRunAt = new Date(Date.now() + step.delay_hours * 60 * 60 * 1000);
  await pool.query(
    "UPDATE marketing_enrollments SET current_step_id = $2, next_run_at = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [enrollmentId, step.id, nextRunAt]
  );
}

/**
 * Process a single due enrollment: run its current step, then compute and
 * persist the next step + next_run_at (or complete/fail the enrollment).
 * Steps with zero delay chain synchronously in the same tick (e.g.
 * condition → email) up to a safety cap to avoid infinite loops.
 */
export async function processEnrollment(enrollment: Enrollment): Promise<void> {
  const MAX_CHAIN = 10;
  let currentEnrollment = enrollment;
  let iterations = 0;

  while (iterations++ < MAX_CHAIN) {
    const subscriber = await getSubscriberById(currentEnrollment.subscriber_id);
    if (!subscriber) {
      await failEnrollment(currentEnrollment.id, "subscriber_not_found");
      return;
    }

    if (!currentEnrollment.current_step_id) {
      await completeEnrollment(currentEnrollment.id);
      return;
    }

    const stepRes = await pool.query<JourneyStep>(
      "SELECT * FROM marketing_journey_steps WHERE id = $1",
      [currentEnrollment.current_step_id]
    );
    const step = stepRes.rows[0];
    if (!step) {
      await failEnrollment(currentEnrollment.id, "step_not_found");
      return;
    }

    let chainSynchronously = false;

    try {
      if (step.step_type === "email") {
        const eligibility = isMarketingEligible(subscriber);
        if (!eligibility.eligible) {
          console.log(`[Marketing] email.skipped subscriber=${subscriber.id} step=${step.id} reason=${eligibility.reason}`);
        } else if (!step.template_id) {
          console.warn(`[Marketing] journey step ${step.id} has no template_id — skipping send`);
        } else {
          await sendMarketingEmail({
            subscriber,
            templateId: step.template_id,
            journeyId: currentEnrollment.journey_id,
            journeyStepId: step.id,
            enrollmentId: currentEnrollment.id,
            idempotencyKey: `journey/${currentEnrollment.id}/step/${step.id}`,
          });
        }
      } else if (step.step_type === "condition") {
        const config = (step.configuration || {}) as ConditionConfig;
        const result = await evaluateCondition(subscriber, config);
        const action = result ? config.onTrue : config.onFalse;
        console.log(`[Marketing] condition.evaluated subscriber=${subscriber.id} step=${step.id} condition=${config.condition} result=${result} action=${action}`);
        if (action === "end") {
          await completeEnrollment(currentEnrollment.id);
          return;
        }
        chainSynchronously = true; // "continue" — fall through to next step immediately
      } else if (step.step_type === "tag_add" || step.step_type === "tag_remove") {
        const tagName = (step.configuration || {}).tag;
        if (tagName) {
          const { addTagToSubscriber, removeTagFromSubscriber } = await import("./subscribers.js");
          if (step.step_type === "tag_add") await addTagToSubscriber(subscriber.id, tagName);
          else await removeTagFromSubscriber(subscriber.id, tagName);
        }
        chainSynchronously = true;
      } else if (step.step_type === "wait") {
        // Wait steps just hold; the delay is applied via advanceToStep below on
        // the *next* step. A bare wait step with nothing after it just completes.
      } else if (step.step_type === "end") {
        await completeEnrollment(currentEnrollment.id);
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Marketing] journey step execution failed enrollment=${currentEnrollment.id} step=${step.id}:`, msg);
      await failEnrollment(currentEnrollment.id, msg);
      return;
    }

    const next = await getNextStep(currentEnrollment.journey_id, step.position);
    if (!next) {
      await completeEnrollment(currentEnrollment.id);
      return;
    }

    if (chainSynchronously && next.delay_hours === 0) {
      // Advance in-memory and loop again without waiting for the scheduler.
      await advanceToStep(currentEnrollment.id, next);
      currentEnrollment = { ...currentEnrollment, current_step_id: next.id };
      continue;
    }

    await advanceToStep(currentEnrollment.id, next);
    return;
  }

  console.warn(`[Marketing] enrollment ${enrollment.id} hit MAX_CHAIN — pausing to avoid an infinite loop`);
}

export async function pauseEnrollment(enrollmentId: number): Promise<void> {
  await pool.query("UPDATE marketing_enrollments SET status = 'paused', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [enrollmentId]);
}

export async function resumeEnrollment(enrollmentId: number): Promise<void> {
  await pool.query(
    "UPDATE marketing_enrollments SET status = 'active', next_run_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [enrollmentId]
  );
}

export async function cancelEnrollment(enrollmentId: number): Promise<void> {
  await pool.query(
    "UPDATE marketing_enrollments SET status = 'cancelled', next_run_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [enrollmentId]
  );
}
