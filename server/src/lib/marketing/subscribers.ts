import { pool } from "../db.js";
import type { PoolClient } from "pg";

// ─────────────────────────────────────────────────────────────────────────────
// Subscriber model — the single marketing-identity record for an email address.
// Deliberately additive/independent from the existing `leads` table (which is
// left untouched for backward compatibility). One subscriber per normalized
// email, regardless of how many freebies/purchases/signups they generate.
// ─────────────────────────────────────────────────────────────────────────────

export interface Subscriber {
  id: number;
  email: string;
  email_normalized: string;
  user_id: number | null;
  name: string | null;
  first_source: string;
  first_freebie: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  marketing_consent_source: string | null;
  unsubscribed_at: string | null;
  unsubscribe_reason: string | null;
  suppressed_at: string | null;
  suppressed_reason: string | null;
  is_buyer: boolean;
  created_at: string;
  updated_at: string;
}

export function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

export interface UpsertSubscriberInput {
  email: string;
  userId?: number | null;
  name?: string | null;
  source?: string; // e.g. "freebie_popup", "checkout", "signup"
  freebieTitle?: string | null;
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
  };
  /**
   * Only set marketing consent on first creation / explicit opt-in actions.
   * Passing `undefined` never overwrites an existing subscriber's consent
   * state — this is essential so re-triggering a freebie download doesn't
   * silently re-consent someone who previously unsubscribed.
   */
  marketingConsent?: boolean;
  consentSource?: string;
}

/**
 * Upsert a subscriber by normalized email. Safe to call repeatedly — never
 * duplicates a marketing identity, never resurrects consent/unsubscribe state
 * unless explicitly asked to (marketingConsent must be passed to change it).
 */
export async function upsertSubscriber(input: UpsertSubscriberInput, client?: PoolClient): Promise<Subscriber> {
  const db = client || pool;
  const emailNormalized = normalizeEmail(input.email);
  if (!emailNormalized || !emailNormalized.includes("@")) {
    throw new Error("Invalid email for subscriber upsert");
  }

  const existing = await db.query<Subscriber>(
    "SELECT * FROM subscribers WHERE email_normalized = $1",
    [emailNormalized]
  );

  if (existing.rows.length > 0) {
    const sub = existing.rows[0];
    // Fill in only missing/blank fields — never clobber existing data.
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (!sub.user_id && input.userId) { updates.push(`user_id = $${i++}`); params.push(input.userId); }
    if (!sub.name && input.name) { updates.push(`name = $${i++}`); params.push(input.name); }
    if (!sub.first_freebie && input.freebieTitle) { updates.push(`first_freebie = $${i++}`); params.push(input.freebieTitle); }
    if (input.marketingConsent === true && !sub.marketing_consent) {
      updates.push(`marketing_consent = TRUE`);
      updates.push(`marketing_consent_at = CURRENT_TIMESTAMP`);
      updates.push(`marketing_consent_source = $${i++}`);
      params.push(input.consentSource || input.source || "unknown");
      // Re-opting-in explicitly clears a prior unsubscribe.
      updates.push(`unsubscribed_at = NULL`);
      updates.push(`unsubscribe_reason = NULL`);
    }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length > 1) {
      params.push(sub.id);
      const result = await db.query<Subscriber>(
        `UPDATE subscribers SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
        params
      );
      return result.rows[0];
    }
    return sub;
  }

  const result = await db.query<Subscriber>(
    `INSERT INTO subscribers (
       email, email_normalized, user_id, name, first_source, first_freebie,
       utm_source, utm_medium, utm_campaign, utm_content, utm_term,
       marketing_consent, marketing_consent_at, marketing_consent_source
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      input.email.trim(),
      emailNormalized,
      input.userId || null,
      input.name || null,
      input.source || "unknown",
      input.freebieTitle || null,
      input.utm?.source || null,
      input.utm?.medium || null,
      input.utm?.campaign || null,
      input.utm?.content || null,
      input.utm?.term || null,
      !!input.marketingConsent,
      input.marketingConsent ? new Date() : null,
      input.marketingConsent ? (input.consentSource || input.source || "unknown") : null,
    ]
  );
  return result.rows[0];
}

export async function getSubscriberById(id: number): Promise<Subscriber | null> {
  const res = await pool.query<Subscriber>("SELECT * FROM subscribers WHERE id = $1", [id]);
  return res.rows[0] || null;
}

export async function getSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const res = await pool.query<Subscriber>(
    "SELECT * FROM subscribers WHERE email_normalized = $1",
    [normalizeEmail(email)]
  );
  return res.rows[0] || null;
}

export async function recordFreebie(
  subscriberId: number,
  freebie: { productTitle?: string | null; productType?: string | null; productId?: number | null; source?: string }
): Promise<void> {
  await pool.query(
    `INSERT INTO subscriber_freebies (subscriber_id, product_title, product_type, product_id, source)
     VALUES ($1, $2, $3, $4, $5)`,
    [subscriberId, freebie.productTitle || null, freebie.productType || null, freebie.productId || null, freebie.source || "unknown"]
  );
}

export async function markBuyer(subscriberId: number): Promise<void> {
  await pool.query(
    "UPDATE subscribers SET is_buyer = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_buyer = FALSE",
    [subscriberId]
  );
}

export async function hasCompletedPurchase(subscriberId: number): Promise<boolean> {
  const sub = await getSubscriberById(subscriberId);
  if (!sub) return false;
  if (sub.is_buyer) return true;
  // Fallback: cross-check against orders table directly by email, in case
  // is_buyer hasn't been backfilled for a historical purchase.
  const res = await pool.query(
    "SELECT 1 FROM orders WHERE email = $1 AND status IN ('completed','paid') LIMIT 1",
    [sub.email]
  );
  return res.rows.length > 0;
}

// ── Tags ─────────────────────────────────────────────────────────────────────

export async function ensureTag(name: string): Promise<{ id: number; name: string; slug: string }> {
  const slug = slugify(name);
  const existing = await pool.query("SELECT * FROM tags WHERE slug = $1", [slug]);
  if (existing.rows.length > 0) return existing.rows[0];
  const inserted = await pool.query(
    "INSERT INTO tags (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING *",
    [name, slug]
  );
  return inserted.rows[0];
}

export function slugify(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100) || "tag";
}

export async function addTagToSubscriber(subscriberId: number, tagNameOrSlug: string): Promise<void> {
  const tag = await ensureTag(tagNameOrSlug);
  await pool.query(
    "INSERT INTO subscriber_tags (subscriber_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [subscriberId, tag.id]
  );
}

export async function removeTagFromSubscriber(subscriberId: number, tagSlug: string): Promise<void> {
  await pool.query(
    `DELETE FROM subscriber_tags WHERE subscriber_id = $1 AND tag_id = (SELECT id FROM tags WHERE slug = $2)`,
    [subscriberId, slugify(tagSlug)]
  );
}

export async function subscriberHasTag(subscriberId: number, tagSlug: string): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM subscriber_tags st JOIN tags t ON t.id = st.tag_id
     WHERE st.subscriber_id = $1 AND t.slug = $2 LIMIT 1`,
    [subscriberId, slugify(tagSlug)]
  );
  return res.rows.length > 0;
}

export async function getSubscriberTags(subscriberId: number): Promise<{ id: number; name: string; slug: string }[]> {
  const res = await pool.query(
    `SELECT t.id, t.name, t.slug FROM subscriber_tags st JOIN tags t ON t.id = st.tag_id
     WHERE st.subscriber_id = $1 ORDER BY t.name ASC`,
    [subscriberId]
  );
  return res.rows;
}

// ── Consent / unsubscribe / suppression ─────────────────────────────────────

export async function setMarketingConsent(subscriberId: number, consent: boolean, source: string): Promise<void> {
  if (consent) {
    await pool.query(
      `UPDATE subscribers SET marketing_consent = TRUE, marketing_consent_at = CURRENT_TIMESTAMP,
       marketing_consent_source = $2, unsubscribed_at = NULL, unsubscribe_reason = NULL,
       updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [subscriberId, source]
    );
  } else {
    await unsubscribeSubscriber(subscriberId, source);
  }
}

export async function unsubscribeSubscriber(subscriberId: number, reason?: string): Promise<void> {
  await pool.query(
    `UPDATE subscribers SET marketing_consent = FALSE, unsubscribed_at = CURRENT_TIMESTAMP,
     unsubscribe_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [subscriberId, reason || "user_requested"]
  );
}

export async function resubscribeSubscriber(subscriberId: number, source?: string): Promise<void> {
  await pool.query(
    `UPDATE subscribers SET marketing_consent = TRUE, marketing_consent_at = CURRENT_TIMESTAMP,
     marketing_consent_source = $2, unsubscribed_at = NULL, unsubscribe_reason = NULL,
     updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [subscriberId, source || "manual_resubscribe"]
  );
}

export async function suppressSubscriber(subscriberId: number, reason: string): Promise<void> {
  await pool.query(
    `UPDATE subscribers SET suppressed_at = CURRENT_TIMESTAMP, suppressed_reason = $2,
     updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [subscriberId, reason]
  );
}

/**
 * The single gate every marketing send must pass. Transactional email is
 * NEVER subject to this check — only journey/campaign marketing sends call this.
 */
export function isMarketingEligible(sub: Subscriber): { eligible: boolean; reason?: string } {
  if (!sub) return { eligible: false, reason: "subscriber_not_found" };
  if (!sub.marketing_consent) return { eligible: false, reason: "no_consent" };
  if (sub.unsubscribed_at) return { eligible: false, reason: "unsubscribed" };
  if (sub.suppressed_at) return { eligible: false, reason: "suppressed" };
  if (!sub.email_normalized || !sub.email_normalized.includes("@")) return { eligible: false, reason: "invalid_email" };
  return { eligible: true };
}

// ── Audit log ────────────────────────────────────────────────────────────────

export async function logMarketingAction(
  action: string,
  actorUserId: number | null,
  target?: { type: string; id: number },
  details?: Record<string, any>
): Promise<void> {
  try {
    await pool.query(
      "INSERT INTO marketing_audit_log (action, actor_user_id, target_type, target_id, details) VALUES ($1,$2,$3,$4,$5)",
      [action, actorUserId, target?.type || null, target?.id || null, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error("[Marketing] Failed to write audit log:", err);
  }
}
