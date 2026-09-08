import { Resend } from "resend";
import { pool } from "../../db.js";
import type { Subscriber } from "./subscribers.js";
import { isMarketingEligible } from "./subscribers.js";
import { createUnsubscribeToken } from "./tokens.js";

// ─────────────────────────────────────────────────────────────────────────────
// Marketing email sender. Distinct from server/src/email.ts (transactional
// only) by design — see spec §55 "Email categories". Every send here:
//  1. Re-checks marketing eligibility (belt-and-suspenders vs. the caller).
//  2. Uses a deterministic idempotency key so retries never double-send.
//  3. Writes a marketing_email_sends row BEFORE calling Resend, so a crash
//     between "queued" and "sent" is visible/recoverable rather than silent.
//  4. Substitutes a small, safe set of {{variables}} — no code execution.
// ─────────────────────────────────────────────────────────────────────────────

function getAppUrl(): string {
  return (
    process.env.APP_URL ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://voodoo808.com")
  ).replace(/\/$/, "");
}

async function getEmailMode(): Promise<"production" | "test"> {
  try {
    const res = await pool.query("SELECT value FROM settings WHERE key = 'marketing_email_mode'");
    return res.rows[0]?.value === "production" ? "production" : "test";
  } catch {
    return "test";
  }
}

async function getTestRecipients(): Promise<string[]> {
  try {
    const res = await pool.query("SELECT value FROM settings WHERE key = 'marketing_test_recipients'");
    const raw = res.rows[0]?.value || "";
    return raw.split(",").map((s: string) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/** Controlled variable substitution — no arbitrary code execution. */
function fillVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (match, key) => {
    return key in vars ? vars[key] : match; // leave unknown placeholders as-is (fail gracefully, don't crash)
  });
}

interface SendMarketingEmailInput {
  subscriber: Subscriber;
  templateId: number;
  journeyId?: number | null;
  journeyStepId?: number | null;
  enrollmentId?: number | null;
  campaignId?: number | null;
  idempotencyKey: string;
}

interface MarketingTemplate {
  id: number;
  name: string;
  subject: string;
  preheader: string | null;
  html_content: string;
  text_content: string | null;
}

export async function sendMarketingEmail(input: SendMarketingEmailInput): Promise<{ skipped: boolean; reason?: string }> {
  const { subscriber, templateId, idempotencyKey } = input;

  // Re-check eligibility right before send (belt-and-suspenders).
  const eligibility = isMarketingEligible(subscriber);
  if (!eligibility.eligible) {
    await recordSkippedSend(input, subscriber.email, eligibility.reason || "not_eligible");
    return { skipped: true, reason: eligibility.reason };
  }

  // If a send with this idempotency key already exists and succeeded, do
  // nothing — this is what actually prevents duplicate sends on retry.
  const existing = await pool.query(
    "SELECT id, status FROM marketing_email_sends WHERE idempotency_key = $1",
    [idempotencyKey]
  );
  if (existing.rows.length > 0 && ["sent", "delivered", "opened", "clicked"].includes(existing.rows[0].status)) {
    return { skipped: true, reason: "already_sent" };
  }

  const templateRes = await pool.query<MarketingTemplate>(
    "SELECT * FROM marketing_templates WHERE id = $1",
    [templateId]
  );
  const template = templateRes.rows[0];
  if (!template) {
    await recordSkippedSend(input, subscriber.email, "template_not_found");
    return { skipped: true, reason: "template_not_found" };
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;
  if (!apiKey) {
    console.log("[Marketing] RESEND_API_KEY not configured, skipping marketing send");
    await recordSkippedSend(input, subscriber.email, "resend_not_configured");
    return { skipped: true, reason: "resend_not_configured" };
  }

  const appUrl = getAppUrl();
  const unsubscribeToken = createUnsubscribeToken(subscriber.id);
  const unsubscribeUrl = `${appUrl}/odhlasit-marketing?token=${unsubscribeToken}`;

  const vars: Record<string, string> = {
    first_name: subscriber.name || "",
    email: subscriber.email,
    unsubscribe_url: unsubscribeUrl,
    site_url: appUrl,
  };

  const subject = fillVariables(template.subject, vars);
  const html = appendFooter(fillVariables(template.html_content, vars), unsubscribeUrl);

  const mode = await getEmailMode();
  let recipient = subscriber.email;
  if (mode === "test") {
    const testRecipients = await getTestRecipients();
    if (testRecipients.length === 0) {
      console.log("[Marketing] Test mode active but no marketing_test_recipients configured — skipping send");
      await recordSkippedSend(input, subscriber.email, "test_mode_no_recipients");
      return { skipped: true, reason: "test_mode_no_recipients" };
    }
    recipient = testRecipients[0];
  }

  // Insert the send record as "queued" BEFORE calling Resend. On conflict
  // (retry with the same idempotency key) just return the existing row's id
  // — we already checked above whether it was a terminal success, so
  // reaching here means it's safe to retry (e.g. previous attempt failed).
  const insertRes = await pool.query(
    `INSERT INTO marketing_email_sends
       (subscriber_id, journey_id, journey_step_id, enrollment_id, campaign_id, template_id,
        idempotency_key, email_type, subject, recipient, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'marketing',$8,$9,'queued')
     ON CONFLICT (idempotency_key) DO UPDATE SET status = 'queued', error = NULL
     RETURNING id`,
    [
      subscriber.id,
      input.journeyId || null,
      input.journeyStepId || null,
      input.enrollmentId || null,
      input.campaignId || null,
      templateId,
      idempotencyKey,
      subject,
      recipient,
    ]
  );
  const sendId = insertRes.rows[0].id;

  const fromAddress = process.env.RESEND_FROM || "VOODOO808 <info@voodoo808.com>";
  const resend = new Resend(apiKey);

  try {
    console.log(`[Marketing] email.sending send_id=${sendId} subscriber=${subscriber.id} mode=${mode} recipient=${recipient}`);
    const { data, error } = await resend.emails.send(
      { from: fromAddress, to: [recipient], subject, html },
      { idempotencyKey }
    );

    if (error) {
      await pool.query(
        "UPDATE marketing_email_sends SET status = 'failed', error = $2 WHERE id = $1",
        [sendId, String(error.message || error)]
      );
      console.error(`[Marketing] email.failed send_id=${sendId}:`, error);
      return { skipped: false };
    }

    await pool.query(
      "UPDATE marketing_email_sends SET status = 'sent', resend_email_id = $2, sent_at = CURRENT_TIMESTAMP WHERE id = $1",
      [sendId, data?.id || null]
    );
    console.log(`[Marketing] email.sent send_id=${sendId} resend_id=${data?.id}`);
    return { skipped: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await pool.query("UPDATE marketing_email_sends SET status = 'failed', error = $2 WHERE id = $1", [sendId, msg]);
    console.error(`[Marketing] email.failed (exception) send_id=${sendId}:`, msg);
    return { skipped: false };
  }
}

async function recordSkippedSend(input: SendMarketingEmailInput, recipient: string, reason: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO marketing_email_sends
         (subscriber_id, journey_id, journey_step_id, enrollment_id, campaign_id, template_id,
          idempotency_key, email_type, subject, recipient, status, error)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'marketing','(skipped)',$8,'suppressed',$9)
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        input.subscriber.id,
        input.journeyId || null,
        input.journeyStepId || null,
        input.enrollmentId || null,
        input.campaignId || null,
        input.templateId,
        input.idempotencyKey,
        recipient,
        reason,
      ]
    );
  } catch (err) {
    console.error("[Marketing] Failed to record skipped send:", err);
  }
}

function appendFooter(html: string, unsubscribeUrl: string): string {
  const footer = `
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:24px auto 0;">
      <tr><td style="padding:24px 0 0;border-top:1px solid #222;text-align:center;">
        <p style="margin:0;font-size:11px;color:#555;line-height:1.7;">
          VOODOO808 &bull; Vojtěch Vojkovský<br/>
          <a href="${unsubscribeUrl}" style="color:#666;text-decoration:underline;">Odhlásit se z marketingových e-mailů</a>
        </p>
      </td></tr>
    </table>`;
  // If the template already has a </body>, inject before it; otherwise append.
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${footer}</body>`);
  }
  return html + footer;
}
