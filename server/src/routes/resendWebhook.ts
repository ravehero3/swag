import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { suppressSubscriber } from "../lib/marketing/subscribers.js";

// ─────────────────────────────────────────────────────────────────────────────
// Resend webhook receiver. Verifies the Svix signature headers Resend sends
// (svix-id / svix-timestamp / svix-signature) using the `svix` library that
// ships as a transitive dependency of `resend` — no new package required.
// See: https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests
//
// Idempotent by design: marketing_email_events has a UNIQUE index on
// event_id (the svix-id header) with NULLs excluded, so a redelivered webhook
// is a harmless no-op via ON CONFLICT DO NOTHING.
// ─────────────────────────────────────────────────────────────────────────────

const router = Router();

// IMPORTANT: this route must receive the RAW request body (not JSON-parsed)
// for signature verification to succeed. It's mounted in index.ts with
// express.raw() BEFORE the global express.json() middleware runs on it.
router.post("/resend", async (req: Request, res: Response) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

  if (!secret) {
    // No secret configured — accept nothing. Fail closed, not open.
    console.warn("[Marketing] RESEND_WEBHOOK_SECRET not configured — rejecting webhook");
    return res.status(503).json({ error: "Webhook not configured" });
  }

  const svixId = req.header("svix-id");
  const svixTimestamp = req.header("svix-timestamp");
  const svixSignature = req.header("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return res.status(400).json({ error: "Missing signature headers" });
  }

  let payload: any;
  try {
    const { Webhook } = await import("svix");
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("[Marketing] webhook.received signature verification failed:", err instanceof Error ? err.message : err);
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Always ack quickly — Resend/Svix retries on non-2xx, but we've already
  // verified the signature so we can safely process async-ish inline.
  res.status(200).json({ received: true });

  try {
    await processResendEvent(svixId, payload);
  } catch (err) {
    console.error("[Marketing] webhook.processing_error:", err);
  }
});

interface ResendWebhookPayload {
  type: string; // e.g. "email.sent", "email.delivered", "email.bounced", ...
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    [key: string]: any;
  };
}

const EVENT_TO_STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delivery_delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.failed": "failed",
};

async function processResendEvent(svixId: string, payload: ResendWebhookPayload): Promise<void> {
  console.log(`[Marketing] webhook.processed event=${payload.type} svix_id=${svixId}`);

  const resendEmailId = payload.data?.email_id;
  if (!resendEmailId) {
    console.warn("[Marketing] webhook event missing data.email_id — cannot correlate to a send", payload.type);
    return;
  }

  // Correlate to our own send record (may be null for transactional sends,
  // which don't go through marketing_email_sends — that's fine, we just skip).
  const sendRes = await pool.query(
    "SELECT id, subscriber_id FROM marketing_email_sends WHERE resend_email_id = $1",
    [resendEmailId]
  );
  const send = sendRes.rows[0];

  // Idempotent insert of the raw event — duplicate webhook deliveries are a no-op.
  await pool.query(
    `INSERT INTO marketing_email_events (email_send_id, subscriber_id, resend_email_id, event_type, event_id, event_timestamp, payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (event_id) DO NOTHING`,
    [
      send?.id || null,
      send?.subscriber_id || null,
      resendEmailId,
      payload.type,
      svixId,
      payload.created_at ? new Date(payload.created_at) : new Date(),
      JSON.stringify(payload),
    ]
  );

  const newStatus = EVENT_TO_STATUS[payload.type];
  if (newStatus && send?.id) {
    await pool.query("UPDATE marketing_email_sends SET status = $2 WHERE id = $1", [send.id, newStatus]);
  }

  // Bounce/complaint → suppress the subscriber from all future marketing sends.
  if ((payload.type === "email.bounced" || payload.type === "email.complained") && send?.subscriber_id) {
    await suppressSubscriber(send.subscriber_id, payload.type === "email.bounced" ? "hard_bounce" : "complaint");
    console.log(`[Marketing] subscriber ${send.subscriber_id} suppressed due to ${payload.type}`);
  }
}

export default router;
