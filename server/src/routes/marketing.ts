import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { pool } from "../db.js";
import {
  verifyUnsubscribeToken,
} from "../lib/marketing/tokens.js";
import {
  getSubscriberById,
  unsubscribeSubscriber,
  resubscribeSubscriber,
  addTagToSubscriber,
  removeTagFromSubscriber,
  getSubscriberTags,
  logMarketingAction,
} from "../lib/marketing/subscribers.js";
import {
  enrollSubscriberInJourney,
  pauseEnrollment,
  resumeEnrollment,
  cancelEnrollment,
} from "../lib/marketing/journeys.js";

const router = Router();

// ── Public: unsubscribe (token-based, no auth) ──────────────────────────────

const unsubscribeLimiter = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "unsubscribe" });

router.get("/unsubscribe/verify", unsubscribeLimiter, async (req: Request, res: Response) => {
  const token = String(req.query.token || "");
  const result = verifyUnsubscribeToken(token);
  if (!result) return res.status(400).json({ error: "Neplatný nebo vypršelý odkaz." });

  const subscriber = await getSubscriberById(result.subscriberId);
  if (!subscriber) return res.status(404).json({ error: "Odběratel nenalezen." });

  res.json({
    email: subscriber.email,
    alreadyUnsubscribed: !!subscriber.unsubscribed_at,
  });
});

router.post("/unsubscribe", unsubscribeLimiter, async (req: Request, res: Response) => {
  const token = String(req.body.token || "");
  const result = verifyUnsubscribeToken(token);
  if (!result) return res.status(400).json({ error: "Neplatný nebo vypršelý odkaz." });

  const subscriber = await getSubscriberById(result.subscriberId);
  if (!subscriber) return res.status(404).json({ error: "Odběratel nenalezen." });

  await unsubscribeSubscriber(subscriber.id, "user_requested");
  await logMarketingAction("subscriber.unsubscribed", null, { type: "subscriber", id: subscriber.id });

  res.json({ success: true, email: subscriber.email });
});

// ── Admin: subscribers list/detail ──────────────────────────────────────────

router.get("/subscribers", requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "50"), 10) || 50));
    const offset = (page - 1) * pageSize;
    const search = String(req.query.search || "").trim();
    const filter = String(req.query.filter || "all");

    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (search) {
      conditions.push(`(email_normalized ILIKE $${i} OR name ILIKE $${i})`);
      params.push(`%${search.toLowerCase()}%`);
      i++;
    }
    if (filter === "subscribed") conditions.push("marketing_consent = TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL");
    else if (filter === "unsubscribed") conditions.push("unsubscribed_at IS NOT NULL");
    else if (filter === "suppressed") conditions.push("suppressed_at IS NOT NULL");
    else if (filter === "buyers") conditions.push("is_buyer = TRUE");
    else if (filter === "non_buyers") conditions.push("is_buyer = FALSE");

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRes = await pool.query(`SELECT COUNT(*) FROM subscribers ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(pageSize, offset);
    const rowsRes = await pool.query(
      `SELECT * FROM subscribers ${whereClause} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      params
    );

    res.json({ subscribers: rowsRes.rows, total, page, pageSize });
  } catch (error) {
    console.error("Subscribers list error:", error);
    res.status(500).json({ error: "Chyba při načítání odběratelů" });
  }
});

router.get("/subscribers/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const subscriber = await getSubscriberById(id);
    if (!subscriber) return res.status(404).json({ error: "Odběratel nenalezen" });

    const tags = await getSubscriberTags(id);
    const freebiesRes = await pool.query("SELECT * FROM subscriber_freebies WHERE subscriber_id = $1 ORDER BY created_at DESC", [id]);
    const enrollmentsRes = await pool.query(
      `SELECT me.*, mj.name AS journey_name FROM marketing_enrollments me
       JOIN marketing_journeys mj ON mj.id = me.journey_id
       WHERE me.subscriber_id = $1 ORDER BY me.created_at DESC`,
      [id]
    );
    const sendsRes = await pool.query(
      "SELECT id, subject, recipient, status, sent_at, created_at FROM marketing_email_sends WHERE subscriber_id = $1 ORDER BY created_at DESC LIMIT 50",
      [id]
    );
    const ordersRes = await pool.query(
      "SELECT id, total, status, created_at FROM orders WHERE email = $1 ORDER BY created_at DESC",
      [subscriber.email]
    );

    res.json({
      subscriber,
      tags,
      freebies: freebiesRes.rows,
      enrollments: enrollmentsRes.rows,
      emailSends: sendsRes.rows,
      orders: ordersRes.rows,
    });
  } catch (error) {
    console.error("Subscriber detail error:", error);
    res.status(500).json({ error: "Chyba při načítání odběratele" });
  }
});

router.post("/subscribers/:id/tags", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: "Chybí název tagu" });
    await addTagToSubscriber(id, tag);
    await logMarketingAction("tag.added", req.session.userId || null, { type: "subscriber", id }, { tag });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při přidávání tagu" });
  }
});

router.delete("/subscribers/:id/tags/:tag", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await removeTagFromSubscriber(id, req.params.tag);
    await logMarketingAction("tag.removed", req.session.userId || null, { type: "subscriber", id }, { tag: req.params.tag });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při odebírání tagu" });
  }
});

router.post("/subscribers/:id/unsubscribe", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await unsubscribeSubscriber(id, "admin_action");
    await logMarketingAction("subscriber.unsubscribed", req.session.userId || null, { type: "subscriber", id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při odhlašování" });
  }
});

router.post("/subscribers/:id/resubscribe", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await resubscribeSubscriber(id, "admin_action");
    await logMarketingAction("subscriber.resubscribed", req.session.userId || null, { type: "subscriber", id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při přihlašování" });
  }
});

// ── Admin: overview stats ───────────────────────────────────────────────────

router.get("/overview", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [subs, marketingSubs, unsub, suppressed, activeJourneys, sends7d, events7d] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM subscribers"),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE marketing_consent = TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL"),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE unsubscribed_at IS NOT NULL"),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE suppressed_at IS NOT NULL"),
      pool.query("SELECT COUNT(*) FROM marketing_enrollments WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM marketing_email_sends WHERE created_at > NOW() - INTERVAL '7 days'"),
      pool.query(
        `SELECT event_type, COUNT(*) FROM marketing_email_events WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY event_type`
      ),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE created_at > NOW() - INTERVAL '7 days'"),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE created_at > NOW() - INTERVAL '30 days'"),
    ]);

    const eventCounts: Record<string, number> = {};
    for (const row of events7d.rows) eventCounts[row.event_type] = parseInt(row.count, 10);

    res.json({
      totalSubscribers: parseInt(subs.rows[0].count, 10),
      marketingSubscribers: parseInt(marketingSubs.rows[0].count, 10),
      unsubscribed: parseInt(unsub.rows[0].count, 10),
      suppressed: parseInt(suppressed.rows[0].count, 10),
      activeJourneys: parseInt(activeJourneys.rows[0].count, 10),
      emailsSent7d: parseInt(sends7d.rows[0].count, 10),
      eventCounts7d: eventCounts,
    });
  } catch (error) {
    console.error("Marketing overview error:", error);
    res.status(500).json({ error: "Chyba při načítání přehledu" });
  }
});

// ── Admin: tags ──────────────────────────────────────────────────────────────

router.get("/tags", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const res2 = await pool.query(
      `SELECT t.*, COUNT(st.subscriber_id) AS subscriber_count
       FROM tags t LEFT JOIN subscriber_tags st ON st.tag_id = t.id
       GROUP BY t.id ORDER BY t.name ASC`
    );
    res.json(res2.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání tagů" });
  }
});

// ── Admin: import existing contacts (Zákazníci tab → Odběratelé) ─────────────
//
// Pulls from the 3 existing customer sources — paid orders, free-download
// leads, and registered users — and upserts each into `subscribers`.
// CRITICAL: marketing_consent is ALWAYS left FALSE for imported contacts.
// These people never explicitly opted into marketing email; importing them
// only makes them visible/taggable in the marketing system (source tracking,
// segmentation, manual re-engagement campaign later) — it does NOT make them
// eligible to receive journey/campaign email. An admin must run a deliberate,
// separate re-engagement opt-in flow before any of these receive marketing
// email (per spec §53 — never auto-enroll historical contacts).
router.get("/import/preview", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [customers, leads, users] = await Promise.all([
      pool.query(
        `SELECT DISTINCT ON (email) email FROM orders WHERE status IN ('completed','paid') AND total > 0`
      ),
      pool.query(`SELECT DISTINCT ON (email) email FROM leads`),
      pool.query(`SELECT DISTINCT ON (email) email FROM users`),
    ]);
    const allEmails = new Set<string>();
    for (const r of [...customers.rows, ...leads.rows, ...users.rows]) {
      if (r.email) allEmails.add(String(r.email).trim().toLowerCase());
    }
    const existingRes = await pool.query("SELECT email_normalized FROM subscribers WHERE email_normalized = ANY($1::text[])", [Array.from(allEmails)]);
    const alreadyImported = new Set(existingRes.rows.map((r: any) => r.email_normalized));
    res.json({
      customers: customers.rows.length,
      leads: leads.rows.length,
      registeredUsers: users.rows.length,
      uniqueTotal: allEmails.size,
      alreadyImported: alreadyImported.size,
      newToImport: allEmails.size - alreadyImported.size,
    });
  } catch (error) {
    console.error("Import preview error:", error);
    res.status(500).json({ error: "Chyba při počítání kontaktů" });
  }
});

router.post("/import/run", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { addTagToSubscriber, markBuyer } = await import("../lib/marketing/subscribers.js");

    // 1) Paying customers
    const customers = await pool.query(
      `SELECT DISTINCT ON (email) email, user_id FROM orders WHERE status IN ('completed','paid') AND total > 0 ORDER BY email, created_at DESC`
    );
    let imported = 0;
    for (const row of customers.rows) {
      if (!row.email) continue;
      const sub = await upsertSubscriberSafe(row.email, row.user_id, "import_customer");
      if (sub) {
        await markBuyer(sub.id);
        await addTagToSubscriber(sub.id, "buyer");
        await addTagToSubscriber(sub.id, "imported");
        imported++;
      }
    }

    // 2) Free-download leads (zájemci o free)
    const leads = await pool.query(`SELECT DISTINCT ON (email) email, user_id FROM leads ORDER BY email, created_at DESC`);
    for (const row of leads.rows) {
      if (!row.email) continue;
      const sub = await upsertSubscriberSafe(row.email, row.user_id, "import_lead");
      if (sub) {
        await addTagToSubscriber(sub.id, "freebie");
        await addTagToSubscriber(sub.id, "imported");
        imported++;
      }
    }

    // 3) Registered users (registrovaní uživatelé)
    const users = await pool.query(`SELECT id, email FROM users`);
    for (const row of users.rows) {
      if (!row.email) continue;
      const sub = await upsertSubscriberSafe(row.email, row.id, "import_registered");
      if (sub) {
        await addTagToSubscriber(sub.id, "registered");
        await addTagToSubscriber(sub.id, "imported");
        imported++;
      }
    }

    await logMarketingAction("subscribers.imported", req.session.userId || null, undefined, { imported });
    res.json({ success: true, processed: imported });
  } catch (error) {
    console.error("Import run error:", error);
    res.status(500).json({ error: "Chyba při importu kontaktů" });
  }
});

async function upsertSubscriberSafe(email: string, userId: number | null, source: string) {
  try {
    const { upsertSubscriber } = await import("../lib/marketing/subscribers.js");
    // marketingConsent intentionally omitted/undefined — upsertSubscriber never
    // sets consent unless explicitly passed true, and defaults to FALSE on
    // first insert. Imported contacts are NEVER marketing-eligible by default.
    return await upsertSubscriber({ email, userId, source });
  } catch (err) {
    console.error(`[Marketing] import upsert failed for ${email}:`, err);
    return null;
  }
}

// ── Admin: templates ─────────────────────────────────────────────────────────

router.get("/templates", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM marketing_templates ORDER BY updated_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání šablon" });
  }
});

router.post("/templates", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, key, subject, preheader, htmlContent, textContent } = req.body;
    if (!name || !subject || !htmlContent) {
      return res.status(400).json({ error: "Chybí povinná pole (název, předmět, obsah)" });
    }
    const result = await pool.query(
      `INSERT INTO marketing_templates (name, key, subject, preheader, html_content, text_content)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, key || null, subject, preheader || null, htmlContent, textContent || null]
    );
    await logMarketingAction("template.created", req.session.userId || null, { type: "template", id: result.rows[0].id });
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === "23505") return res.status(409).json({ error: "Šablona s tímto klíčem již existuje" });
    res.status(500).json({ error: "Chyba při vytváření šablony" });
  }
});

router.patch("/templates/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, subject, preheader, htmlContent, textContent } = req.body;
    const result = await pool.query(
      `UPDATE marketing_templates SET name = $1, subject = $2, preheader = $3, html_content = $4,
       text_content = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
      [name, subject, preheader || null, htmlContent, textContent || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Šablona nenalezena" });
    await logMarketingAction("template.edited", req.session.userId || null, { type: "template", id: parseInt(req.params.id, 10) });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání šablony" });
  }
});

router.delete("/templates/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const inUse = await pool.query(
      "SELECT 1 FROM marketing_journey_steps WHERE template_id = $1 LIMIT 1",
      [req.params.id]
    );
    if (inUse.rows.length > 0) {
      return res.status(409).json({ error: "Šablona je použita v aktivní journey — nejprve ji odeberte ze všech kroků." });
    }
    await pool.query("DELETE FROM marketing_templates WHERE id = $1", [req.params.id]);
    await logMarketingAction("template.deleted", req.session.userId || null, { type: "template", id: parseInt(req.params.id, 10) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání šablony" });
  }
});

// Render a template with sample data for the admin preview iframe. Never sends anything.
router.get("/templates/:id/preview", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT subject, html_content FROM marketing_templates WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Šablona nenalezena.</p>");
    const { renderTemplatePreview } = await import("../lib/marketing/sender.js");
    const { html } = renderTemplatePreview(result.rows[0]);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Chyba při generování náhledu.</p>");
  }
});

// Send a real test email for this template to an admin-specified address.
// Bypasses subscriber eligibility/test-mode redirect entirely — this call IS
// the test. Rate-limited lightly since it costs a real Resend send.
const testSendLimiter = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "marketing_test_send" });
router.post("/templates/:id/send-test", requireAdmin, testSendLimiter, async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    const toEmail = String(req.body.email || "").trim();
    if (!toEmail || !toEmail.includes("@")) {
      return res.status(400).json({ error: "Zadejte platnou e-mailovou adresu pro test." });
    }
    const { sendTestMarketingEmail } = await import("../lib/marketing/sender.js");
    const result = await sendTestMarketingEmail(templateId, toEmail);
    if (!result.ok) return res.status(500).json({ error: result.error || "Odeslání testovacího e-mailu selhalo" });
    await logMarketingAction("template.test_sent", req.session.userId || null, { type: "template", id: templateId }, { to: toEmail });
    res.json({ success: true });
  } catch (error) {
    console.error("Template test send error:", error);
    res.status(500).json({ error: "Chyba při odesílání testovacího e-mailu" });
  }
});

// ── Admin: journeys ──────────────────────────────────────────────────────────

router.get("/journeys", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const journeysRes = await pool.query("SELECT * FROM marketing_journeys ORDER BY created_at DESC");
    const journeys = journeysRes.rows;
    for (const j of journeys) {
      const [stepsRes, activeRes, completedRes, sentRes] = await Promise.all([
        pool.query("SELECT COUNT(*) FROM marketing_journey_steps WHERE journey_id = $1", [j.id]),
        pool.query("SELECT COUNT(*) FROM marketing_enrollments WHERE journey_id = $1 AND status = 'active'", [j.id]),
        pool.query("SELECT COUNT(*) FROM marketing_enrollments WHERE journey_id = $1 AND status = 'completed'", [j.id]),
        pool.query("SELECT COUNT(*) FROM marketing_email_sends WHERE journey_id = $1 AND status IN ('sent','delivered','opened','clicked')", [j.id]),
      ]);
      j.stepCount = parseInt(stepsRes.rows[0].count, 10);
      j.activeEnrollments = parseInt(activeRes.rows[0].count, 10);
      j.completedEnrollments = parseInt(completedRes.rows[0].count, 10);
      j.emailsSent = parseInt(sentRes.rows[0].count, 10);
    }
    res.json(journeys);
  } catch (error) {
    console.error("Journeys list error:", error);
    res.status(500).json({ error: "Chyba při načítání journeys" });
  }
});

router.get("/journeys/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const journeyRes = await pool.query("SELECT * FROM marketing_journeys WHERE id = $1", [req.params.id]);
    if (journeyRes.rows.length === 0) return res.status(404).json({ error: "Journey nenalezena" });
    const stepsRes = await pool.query(
      "SELECT * FROM marketing_journey_steps WHERE journey_id = $1 ORDER BY position ASC",
      [req.params.id]
    );
    res.json({ journey: journeyRes.rows[0], steps: stepsRes.rows });
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání journey" });
  }
});

router.post("/journeys", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, triggerType, triggerValue } = req.body;
    if (!name || !triggerType) return res.status(400).json({ error: "Chybí název nebo typ triggeru" });
    const result = await pool.query(
      `INSERT INTO marketing_journeys (name, description, trigger_type, trigger_value, status)
       VALUES ($1,$2,$3,$4,'draft') RETURNING *`,
      [name, description || null, triggerType, triggerValue || null]
    );
    await logMarketingAction("journey.created", req.session.userId || null, { type: "journey", id: result.rows[0].id });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při vytváření journey" });
  }
});

router.patch("/journeys/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, triggerType, triggerValue, status } = req.body;
    const current = await pool.query("SELECT * FROM marketing_journeys WHERE id = $1", [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ error: "Journey nenalezena" });

    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (name !== undefined) { updates.push(`name = $${i++}`); params.push(name); }
    if (description !== undefined) { updates.push(`description = $${i++}`); params.push(description); }
    if (triggerType !== undefined) { updates.push(`trigger_type = $${i++}`); params.push(triggerType); }
    if (triggerValue !== undefined) { updates.push(`trigger_value = $${i++}`); params.push(triggerValue); }
    if (status !== undefined) { updates.push(`status = $${i++}`); params.push(status); }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE marketing_journeys SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );
    await logMarketingAction(
      status !== undefined ? `journey.${status}` : "journey.edited",
      req.session.userId || null,
      { type: "journey", id: parseInt(req.params.id, 10) }
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání journey" });
  }
});

router.delete("/journeys/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const activeRes = await pool.query(
      "SELECT COUNT(*) FROM marketing_enrollments WHERE journey_id = $1 AND status = 'active'",
      [req.params.id]
    );
    if (parseInt(activeRes.rows[0].count, 10) > 0) {
      return res.status(409).json({ error: "Journey má aktivní odběratele — nejprve ji pozastavte." });
    }
    await pool.query("DELETE FROM marketing_journeys WHERE id = $1", [req.params.id]);
    await logMarketingAction("journey.deleted", req.session.userId || null, { type: "journey", id: parseInt(req.params.id, 10) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání journey" });
  }
});

// ── Admin: journey steps ─────────────────────────────────────────────────────

router.post("/journeys/:id/steps", requireAdmin, async (req: Request, res: Response) => {
  try {
    const journeyId = parseInt(req.params.id, 10);
    const { stepType, delayHours, templateId, configuration } = req.body;
    if (!stepType) return res.status(400).json({ error: "Chybí typ kroku" });

    const maxPosRes = await pool.query(
      "SELECT COALESCE(MAX(position), 0) AS max_pos FROM marketing_journey_steps WHERE journey_id = $1",
      [journeyId]
    );
    const position = parseInt(maxPosRes.rows[0].max_pos, 10) + 1;

    const result = await pool.query(
      `INSERT INTO marketing_journey_steps (journey_id, position, step_type, delay_hours, template_id, configuration)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [journeyId, position, stepType, delayHours || 0, templateId || null, JSON.stringify(configuration || {})]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při vytváření kroku" });
  }
});

router.patch("/journeys/:id/steps/:stepId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { stepType, delayHours, templateId, configuration, position } = req.body;
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (stepType !== undefined) { updates.push(`step_type = $${i++}`); params.push(stepType); }
    if (delayHours !== undefined) { updates.push(`delay_hours = $${i++}`); params.push(delayHours); }
    if (templateId !== undefined) { updates.push(`template_id = $${i++}`); params.push(templateId); }
    if (configuration !== undefined) { updates.push(`configuration = $${i++}`); params.push(JSON.stringify(configuration)); }
    if (position !== undefined) { updates.push(`position = $${i++}`); params.push(position); }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.params.stepId);

    const result = await pool.query(
      `UPDATE marketing_journey_steps SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Krok nenalezen" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání kroku" });
  }
});

router.delete("/journeys/:id/steps/:stepId", requireAdmin, async (req: Request, res: Response) => {
  try {
    await pool.query("DELETE FROM marketing_journey_steps WHERE id = $1", [req.params.stepId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání kroku" });
  }
});

// Preview / test-send for a specific journey step's assigned template —
// same underlying logic as /templates/:id/preview and /send-test, just
// resolved via the step so the Journeys tab can offer "Preview"/"Send test"
// buttons directly next to each email step.
router.get("/journeys/:id/steps/:stepId/preview", requireAdmin, async (req: Request, res: Response) => {
  try {
    const stepRes = await pool.query("SELECT template_id FROM marketing_journey_steps WHERE id = $1", [req.params.stepId]);
    const templateId = stepRes.rows[0]?.template_id;
    if (!templateId) return res.status(404).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Tento krok nemá přiřazenou šablonu.</p>");
    const tplRes = await pool.query("SELECT subject, html_content FROM marketing_templates WHERE id = $1", [templateId]);
    if (tplRes.rows.length === 0) return res.status(404).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Šablona nenalezena.</p>");
    const { renderTemplatePreview } = await import("../lib/marketing/sender.js");
    const { html } = renderTemplatePreview(tplRes.rows[0]);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Chyba při generování náhledu.</p>");
  }
});

router.post("/journeys/:id/steps/:stepId/send-test", requireAdmin, testSendLimiter, async (req: Request, res: Response) => {
  try {
    const toEmail = String(req.body.email || "").trim();
    if (!toEmail || !toEmail.includes("@")) {
      return res.status(400).json({ error: "Zadejte platnou e-mailovou adresu pro test." });
    }
    const stepRes = await pool.query("SELECT template_id FROM marketing_journey_steps WHERE id = $1", [req.params.stepId]);
    const templateId = stepRes.rows[0]?.template_id;
    if (!templateId) return res.status(400).json({ error: "Tento krok nemá přiřazenou šablonu." });
    const { sendTestMarketingEmail } = await import("../lib/marketing/sender.js");
    const result = await sendTestMarketingEmail(templateId, toEmail);
    if (!result.ok) return res.status(500).json({ error: result.error || "Odeslání testovacího e-mailu selhalo" });
    await logMarketingAction("journey_step.test_sent", req.session.userId || null, { type: "journey_step", id: parseInt(req.params.stepId, 10) }, { to: toEmail });
    res.json({ success: true });
  } catch (error) {
    console.error("Journey step test send error:", error);
    res.status(500).json({ error: "Chyba při odesílání testovacího e-mailu" });
  }
});

// ── Admin: enrollments (pause/resume/cancel) ────────────────────────────────

router.post("/enrollments/:id/pause", requireAdmin, async (req: Request, res: Response) => {
  try {
    await pauseEnrollment(parseInt(req.params.id, 10));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při pozastavování" });
  }
});

router.post("/enrollments/:id/resume", requireAdmin, async (req: Request, res: Response) => {
  try {
    await resumeEnrollment(parseInt(req.params.id, 10));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při obnovování" });
  }
});

router.post("/enrollments/:id/cancel", requireAdmin, async (req: Request, res: Response) => {
  try {
    await cancelEnrollment(parseInt(req.params.id, 10));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při rušení" });
  }
});

// ── Admin: manually enroll a subscriber (testing / dry-run helper) ─────────

router.post("/subscribers/:id/enroll", requireAdmin, async (req: Request, res: Response) => {
  try {
    const subscriberId = parseInt(req.params.id, 10);
    const { journeyId } = req.body;
    if (!journeyId) return res.status(400).json({ error: "Chybí journeyId" });
    const enrollment = await enrollSubscriberInJourney(subscriberId, journeyId);
    if (!enrollment) return res.status(400).json({ error: "Nepodařilo se zapsat (journey neaktivní, žádné kroky, nebo již zapsán)" });
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ error: "Chyba při zápisu do journey" });
  }
});

// ── Admin: settings (test mode / test recipients) ───────────────────────────

router.get("/settings", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('marketing_email_mode', 'marketing_test_recipients')"
    );
    const settings = result.rows.reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání nastavení" });
  }
});

router.post("/settings", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { marketingEmailMode, marketingTestRecipients } = req.body;
    if (marketingEmailMode !== undefined) {
      const mode = marketingEmailMode === "production" ? "production" : "test";
      await pool.query(
        "INSERT INTO settings (key, value, updated_at) VALUES ('marketing_email_mode', $1, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP",
        [mode]
      );
      await logMarketingAction("settings.email_mode_changed", req.session.userId || null, undefined, { mode });
    }
    if (marketingTestRecipients !== undefined) {
      await pool.query(
        "INSERT INTO settings (key, value, updated_at) VALUES ('marketing_test_recipients', $1, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP",
        [String(marketingTestRecipients || "")]
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při ukládání nastavení" });
  }
});

// ── Admin: campaigns (V1 — draft/preview/send to segment) ──────────────────

router.get("/campaigns", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*, t.name AS template_name FROM marketing_campaigns c
       LEFT JOIN marketing_templates t ON t.id = c.template_id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání kampaní" });
  }
});

router.post("/campaigns", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, subject, templateId } = req.body;
    if (!name) return res.status(400).json({ error: "Chybí název kampaně" });
    const result = await pool.query(
      `INSERT INTO marketing_campaigns (name, subject, template_id, status) VALUES ($1,$2,$3,'draft') RETURNING *`,
      [name, subject || null, templateId || null]
    );
    await logMarketingAction("campaign.created", req.session.userId || null, { type: "campaign", id: result.rows[0].id });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při vytváření kampaně" });
  }
});

// Estimate recipient count for a campaign's audience (all eligible marketing subscribers today — V1 has one implicit segment: "All marketing subscribers").
router.get("/campaigns/:id/audience-count", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM subscribers WHERE marketing_consent = TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL"
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (error) {
    res.status(500).json({ error: "Chyba při počítání příjemců" });
  }
});

router.post("/campaigns/:id/cancel", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "UPDATE marketing_campaigns SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status IN ('draft','scheduled') RETURNING *",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: "Kampaň nelze zrušit v tomto stavu" });
    await logMarketingAction("campaign.cancelled", req.session.userId || null, { type: "campaign", id: parseInt(req.params.id, 10) });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při rušení kampaně" });
  }
});

// Send a campaign now, to all currently-eligible marketing subscribers.
// Requires explicit confirmation (confirmedCount must match the current
// audience size at send time) so an admin can never accidentally blast an
// audience they didn't just review in the UI.
router.post("/campaigns/:id/send", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const { confirmedCount } = req.body;

    const campaignRes = await pool.query("SELECT * FROM marketing_campaigns WHERE id = $1", [campaignId]);
    const campaign = campaignRes.rows[0];
    if (!campaign) return res.status(404).json({ error: "Kampaň nenalezena" });
    if (campaign.status !== "draft") return res.status(400).json({ error: "Kampaň již byla odeslána nebo zrušena" });
    if (!campaign.template_id) return res.status(400).json({ error: "Kampaň nemá přiřazenou šablonu" });

    const audienceRes = await pool.query(
      "SELECT * FROM subscribers WHERE marketing_consent = TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL ORDER BY id ASC"
    );
    const audience = audienceRes.rows;

    if (typeof confirmedCount !== "number" || confirmedCount !== audience.length) {
      return res.status(409).json({
        error: "Počet příjemců se změnil od posledního náhledu. Zkontrolujte znovu před odesláním.",
        currentCount: audience.length,
      });
    }

    await pool.query(
      "UPDATE marketing_campaigns SET status = 'sending', recipient_count = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [campaignId, audience.length]
    );
    await logMarketingAction("campaign.sending", req.session.userId || null, { type: "campaign", id: campaignId }, { recipientCount: audience.length });

    // Fire-and-forget in controlled batches so this HTTP request returns
    // immediately; the scheduler-style batching avoids sending thousands of
    // emails synchronously within one request.
    (async () => {
      const { sendMarketingEmail } = await import("../lib/marketing/sender.js");
      const BATCH_SIZE = 25;
      for (let idx = 0; idx < audience.length; idx += BATCH_SIZE) {
        const batch = audience.slice(idx, idx + BATCH_SIZE);
        await Promise.all(
          batch.map((subscriber: any) =>
            sendMarketingEmail({
              subscriber,
              templateId: campaign.template_id,
              campaignId,
              idempotencyKey: `campaign/${campaignId}/subscriber/${subscriber.id}`,
            }).catch((err) => console.error(`[Marketing] campaign send failed for subscriber ${subscriber.id}:`, err))
          )
        );
      }
      await pool.query(
        "UPDATE marketing_campaigns SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [campaignId]
      );
      console.log(`[Marketing] campaign.sent campaign=${campaignId} recipients=${audience.length}`);
    })().catch((err) => console.error(`[Marketing] campaign send batch failed for campaign ${campaignId}:`, err));

    res.json({ success: true, recipientCount: audience.length, status: "sending" });
  } catch (error) {
    console.error("Campaign send error:", error);
    res.status(500).json({ error: "Chyba při odesílání kampaně" });
  }
});

export default router;
