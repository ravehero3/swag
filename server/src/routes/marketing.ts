import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { pool } from "../db.js";
import { compileBlocksToHtml } from "../lib/marketing/blockCompiler.js";
import { randomBytes } from "crypto";
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
  normalizeEmail,
  upsertSubscriber,
} from "../lib/marketing/subscribers.js";
import {
  enrollSubscriberInJourney,
  pauseEnrollment,
  resumeEnrollment,
  cancelEnrollment,
} from "../lib/marketing/journeys.js";
import { resolveSegmentAudience } from "../lib/marketing/scheduler.js";

const router = Router();


// ── Public: unsubscribe (token-based, no auth) ──────────────────────────────

const unsubscribeLimiter = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "unsubscribe" });
const testSendLimiter = rateLimit({ windowMs: 60_000, max: 60, keyPrefix: "test_send" });

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
    const [subs, marketingSubs, unsub, suppressed, activeJourneys, sends7d, events7d, paidBuyers, freebies, sendAgg7d] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM subscribers"),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE marketing_consent = TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL"),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE unsubscribed_at IS NOT NULL"),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE suppressed_at IS NOT NULL"),
      pool.query("SELECT COUNT(*) FROM marketing_enrollments WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM marketing_email_sends WHERE created_at > NOW() - INTERVAL '7 days'"),
      pool.query(
        `SELECT event_type, COUNT(*) FROM marketing_email_events WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY event_type`
      ),
      pool.query(`
        SELECT COUNT(DISTINCT s.id) 
        FROM subscribers s
        WHERE s.is_buyer = TRUE 
           OR EXISTS (SELECT 1 FROM orders o WHERE LOWER(o.email) = s.email_normalized AND o.status IN ('completed', 'paid') AND o.total > 0)
      `),
      pool.query(`
        SELECT COUNT(DISTINCT s.id)
        FROM subscribers s
        WHERE s.first_source IN ('freebie_download', 'beatstars_free_download', 'checkout_free_item')
           OR EXISTS (SELECT 1 FROM subscriber_tags st JOIN tags t ON t.id = st.tag_id WHERE st.subscriber_id = s.id AND t.slug IN ('freebie', 'beatstars'))
           OR EXISTS (SELECT 1 FROM subscriber_freebies sf WHERE sf.subscriber_id = s.id)
           OR EXISTS (SELECT 1 FROM leads l WHERE LOWER(l.email) = s.email_normalized)
      `),
      pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status IN ('sent', 'delivered', 'opened', 'clicked')) as sent,
          COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
          COUNT(*) FILTER (WHERE opened_at IS NOT NULL OR status = 'opened') as opened,
          COUNT(*) FILTER (WHERE first_clicked_at IS NOT NULL OR status = 'clicked') as clicked,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM marketing_email_sends
        WHERE created_at > NOW() - INTERVAL '7 days'
      `),
    ]);

    const eventCounts: Record<string, number> = {};
    for (const row of events7d.rows) eventCounts[row.event_type] = parseInt(row.count, 10);

    const agg = sendAgg7d.rows[0] || {};
    const sentCount = Math.max(parseInt(agg.sent || "0", 10), eventCounts["email.sent"] || 0, parseInt(sends7d.rows[0].count, 10));
    const failedCount = Math.max(parseInt(agg.failed || "0", 10), eventCounts["email.bounced"] || eventCounts["email.failed"] || 0);
    const deliveredCount = Math.max(parseInt(agg.delivered || "0", 10), eventCounts["email.delivered"] || Math.max(0, sentCount - failedCount));
    const openedCount = Math.max(parseInt(agg.opened || "0", 10), eventCounts["email.opened"] || eventCounts["open"] || 0);
    const clickedCount = Math.max(parseInt(agg.clicked || "0", 10), eventCounts["email.clicked"] || eventCounts["click"] || 0);

    eventCounts["email.sent"] = sentCount;
    eventCounts["email.delivered"] = deliveredCount;
    eventCounts["email.opened"] = openedCount;
    eventCounts["email.clicked"] = clickedCount;
    eventCounts["email.bounced"] = failedCount;

    res.json({
      totalSubscribers: parseInt(subs.rows[0].count, 10),
      marketingSubscribers: parseInt(marketingSubs.rows[0].count, 10),
      paidCustomers: parseInt(paidBuyers.rows[0].count, 10),
      freeDownloaders: parseInt(freebies.rows[0].count, 10),
      unsubscribed: parseInt(unsub.rows[0].count, 10),
      suppressed: parseInt(suppressed.rows[0].count, 10),
      activeJourneys: parseInt(activeJourneys.rows[0].count, 10),
      emailsSent7d: sentCount,
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

// Get single template by ID
router.get("/templates/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM marketing_templates WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Šablona nenalezena" });
    }
    
    const template = result.rows[0];
    
    // Parse blocks if stored as string
    let blocks = template.blocks || template.design_blocks;
    if (typeof blocks === "string") {
      try {
        blocks = JSON.parse(blocks);
      } catch {
        blocks = [];
      }
    }
    
    // Parse header options if stored as string
    let headerOptions = template.header_options || template.header_config;
    if (typeof headerOptions === "string") {
      try {
        headerOptions = JSON.parse(headerOptions);
      } catch {
        headerOptions = {};
      }
    }
    
    res.json({
      ...template,
      blocks,
      headerOptions,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ error: "Chyba při načítání šablony" });
  }
});

// Get recommended templates for a specific journey step
router.get("/templates/recommend/:journeyId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { journeyId } = req.params;
    const { stepPosition, stepType } = req.query;
    
    if (!journeyId || !stepType) {
      return res.status(400).json({ error: "Chybí journeyId nebo stepType" });
    }
    
    // Get the journey name
    const journeyResult = await pool.query(
      "SELECT name FROM marketing_journeys WHERE id = $1",
      [journeyId]
    );
    
    if (journeyResult.rows.length === 0) {
      return res.json([]); // Journey not found, return empty
    }
    
    const journeyName = journeyResult.rows[0].name;
    
    // Find templates matching this journey
    const templatesResult = await pool.query(
      `SELECT * FROM marketing_templates 
       WHERE journey_name = $1 AND step_type = $2 AND is_recommended = true
       ORDER BY step_position ASC, sort_order ASC`,
      [journeyName, stepType]
    );
    
    res.json(templatesResult.rows);
  } catch (error) {
    console.error("Template recommendation error:", error);
    res.status(500).json({ error: "Chyba při načítání doporučených šablon" });
  }
});

router.post("/templates", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, key, subject, preheader, htmlContent, textContent, blocks, headerOptions } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ error: "Chybí povinná pole (název, předmět)" });
    }
    const blocksJson = Array.isArray(blocks) ? JSON.stringify(blocks) : (blocks ? JSON.stringify(blocks) : "[]");
    const headerOptionsJson = headerOptions ? JSON.stringify(headerOptions) : "{}";
    let finalHtml = htmlContent || "";
    if (!finalHtml && Array.isArray(blocks) && blocks.length > 0) {
      finalHtml = compileBlocksToHtml(blocks);
    }
    if (!finalHtml) {
      return res.status(400).json({ error: "Chybí obsah šablony (HTML nebo bloky)" });
    }
    const result = await pool.query(
      `INSERT INTO marketing_templates (name, key, subject, preheader, html_content, text_content, blocks, header_options)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb) RETURNING *`,
      [name, key || null, subject, preheader || null, finalHtml, textContent || null, blocksJson, headerOptionsJson]
    );
    await logMarketingAction("template.created", req.session.userId || null, { type: "template", id: result.rows[0].id });
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === "23505") return res.status(409).json({ error: "Šablona s tímto klíčem již existuje" });
    res.status(500).json({ error: "Chyba při vytváření šablony" });
  }
});

router.post("/templates/seed", requireAdmin, async (req: Request, res: Response) => {
  try {
    const defaultTemplates = [
      {
        name: "Welcome Series - 1",
        description: "Úvodní uvítací e-mail s videem a slevovým kódem.",
        subject: "Vítej ve Voodoo808, tady je tvůj dárek!",
        preheader: "Díky za přihlášení. Uvnitř najdeš exkluzivní bonus.",
        design_blocks: [
          { id: "h1", type: "heading", headingText: "VÍTEJ V KLUBU", headingLevel: "h1", headingAlign: "center" },
          { id: "p1", type: "paragraph", paragraphText: "Jsme rádi, že jsi se k nám přidal. Sleduj toto video pro krátké uvítání." },
          { id: "v1", type: "video", videoUrl: "https://youtube.com", videoTitle: "Uvítací zpráva od Voodoo808", videoThumbnailUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80" },
          { id: "cb1", type: "coupon_box", couponCode: "WELCOME20", couponDiscount: "20% SLEVA" },
          { id: "sl1", type: "social_links" }
        ],
        header_config: { logoType: "white", logoSize: "md" }
      },
      {
        name: "New Release - Video & Columns",
        description: "Oznámení nového tracku nebo beatu se dvěma sloupci ukázek.",
        subject: "Nový release: Poslechni si ukázku!",
        preheader: "Právě jsme vydali nový banger.",
        design_blocks: [
          { id: "hero1", type: "hero", heroTitle: "NOVÝ RELEASE", heroButtonText: "PŘEHRÁT" },
          { id: "div1", type: "divider" },
          { id: "tc1", type: "two_column", col1Title: "Trackout", col1Text: "Plná verze s vrstvami", col1ButtonText: "Koupit", col2Title: "WAV Lease", col2Text: "Standardní licence", col2ButtonText: "Koupit" },
          { id: "q1", type: "quote", quoteText: "Nejlepší beat roku, neskutečný zvuk.", quoteAuthor: "Producent XYZ", quoteRole: "Spokojený klient" }
        ],
        header_config: { logoType: "metallic", logoSize: "lg" }
      },
      {
        name: "Flash Sale Countdown",
        description: "Bleskový výprodej s odpočtem.",
        subject: "BLESKOVÝ VÝPRODEJ končí o půlnoci!",
        preheader: "Ušetři až 50 % na všech beatech.",
        design_blocks: [
          { id: "h1", type: "heading", headingText: "FLASH SALE", headingColor: "#ff2d55", headingAlign: "center" },
          { id: "cd1", type: "countdown", countdownTitle: "SLEVA KONČÍ ZA:", countdownHours: "12", countdownButtonText: "DO KOŠÍKU" },
          { id: "g1", type: "multi_beat_grid" }
        ],
        header_config: { logoType: "white", logoSize: "sm" }
      },
      {
        name: "Testimonial & Quote",
        description: "Zvýšení důvěry pomocí recenzí od zákazníků.",
        subject: "Co říkají ostatní producenti?",
        preheader: "Neber nás za slovo, poslechni si je.",
        design_blocks: [
          { id: "h1", type: "heading", headingText: "PŘÍBĚHY ÚSPĚCHU" },
          { id: "q1", type: "quote", quoteText: "Od té doby co používám Voodoo808 packy, se můj zvuk posunul na další level.", quoteAuthor: "Beatmaker Pro" },
          { id: "q2", type: "quote", quoteText: "Neuvěřitelná kvalita mixu a masteru.", quoteAuthor: "DJ XYZ" },
          { id: "btn1", type: "button", buttonText: "PŘIDEJ SE K NIM" }
        ],
        header_config: { logoType: "metallic", logoSize: "md" }
      },
      {
        name: "Newsletter Digest",
        description: "Měsíční shrnutí novinek, beatů a slev.",
        subject: "Tvoje měsíční nálož z Voodoo808",
        preheader: "To nejlepší za poslední měsíc.",
        design_blocks: [
          { id: "h1", type: "heading", headingText: "MĚSÍČNÍ SHRNUTÍ" },
          { id: "tc1", type: "two_column", col1Title: "Top Beat", col1Text: "Nejprodávanější beat tohoto měsíce", col2Title: "Top Kit", col2Text: "Nejoblíbenější sound kit" },
          { id: "v1", type: "video", videoTitle: "Studio Vlog #5" },
          { id: "cb1", type: "coupon_box", couponCode: "MONTHLY10", couponDiscount: "10% SLEVA" }
        ],
        header_config: { logoType: "white", logoSize: "md" }
      }
    ];

    const inserted = [];
    for (const tpl of defaultTemplates) {
      const result = await pool.query(
        `INSERT INTO marketing_templates (name, description, subject, preheader, design_blocks, header_config)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tpl.name, tpl.description, tpl.subject, tpl.preheader, JSON.stringify(tpl.design_blocks), JSON.stringify(tpl.header_config)]
      );
      inserted.push(result.rows[0]);
    }
    res.json({ message: "Šablony úspěšně vytvořeny.", templates: inserted });
  } catch (error) {
    res.status(500).json({ error: "Chyba při vytváření šablon." });
  }
});

router.patch("/templates/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, subject, preheader, htmlContent, textContent, blocks, headerOptions } = req.body;
    let finalHtml = htmlContent !== undefined ? htmlContent : null;
    if (Array.isArray(blocks) && blocks.length > 0) {
      finalHtml = compileBlocksToHtml(blocks);
    }
    const blocksJson = Array.isArray(blocks) ? JSON.stringify(blocks) : (blocks ? JSON.stringify(blocks) : null);
    const headerOptionsJson = headerOptions ? JSON.stringify(headerOptions) : null;

    const result = await pool.query(
      `UPDATE marketing_templates SET
         name = COALESCE($1, name),
         subject = COALESCE($2, subject),
         preheader = COALESCE($3, preheader),
         html_content = COALESCE($4, html_content),
         text_content = COALESCE($5, text_content),
         blocks = COALESCE($6::jsonb, blocks),
         header_options = COALESCE($7::jsonb, header_options),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [
        name || null,
        subject || null,
        preheader !== undefined ? preheader : null,
        finalHtml,
        textContent !== undefined ? textContent : null,
        blocksJson,
        headerOptionsJson,
        req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Šablona nenalezena" });
    await logMarketingAction("template.edited", req.session.userId || null, { type: "template", id: parseInt(req.params.id, 10) });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Template update error:", error);
    res.status(500).json({ error: "Chyba při ukládání šablony: " + (error instanceof Error ? error.message : String(error)) });
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


// Update template audience/category
router.patch("/templates/:id/audience", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { audience } = req.body;
    const validAudiences = ["rapper", "producer", "general", null];
    
    if (!validAudiences.includes(audience)) {
      return res.status(400).json({ error: "Neplatná kategorie. Použijte: 'rapper', 'producer', 'general' nebo null" });
    }
    
    const result = await pool.query(
      "UPDATE marketing_templates SET audience = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [audience, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Šablona nenalezena" });
    }
    
    await logMarketingAction("template.audience_updated", req.session.userId || null, { type: "template", id: parseInt(req.params.id, 10) }, { audience: audience || "general" });
    res.json({ success: true, template: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Chyba při aktualizaci kategorie šablony" });
  }
});

// Render a template with sample data for the admin preview iframe. Never sends anything.
router.get("/templates/:id/preview", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT subject, html_content, preheader, blocks, header_options FROM marketing_templates WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Šablona nenalezena.</p>");
    const { renderTemplatePreview } = await import("../lib/marketing/sender.js");
    const { html } = renderTemplatePreview({
      ...result.rows[0],
      headerOptions: result.rows[0].header_options,
    });
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Chyba při generování náhledu.</p>");
  }
});

// Send a real test email for this template to an admin-specified address.
// Bypasses subscriber eligibility/test-mode redirect entirely — this call IS
// the test. Rate-limited lightly since it costs a real Resend send.
// Generic test-email endpoint: send from raw blocks/HTML without needing a saved template.
// Used by visual editors when there is no template ID yet.
router.post("/test-email", requireAdmin, testSendLimiter, async (req: Request, res: Response) => {
  try {
    const toEmail = String(req.body.to || req.body.email || "").trim();
    if (!toEmail || !toEmail.includes("@")) {
      return res.status(400).json({ error: "Zadejte platnou e-mailovou adresu pro test." });
    }
    const { sendTestCustomEmail } = await import("../lib/marketing/sender.js");
    const { compileBlocksToHtml } = await import("../lib/marketing/blockCompiler.js");
    let htmlContent = req.body.htmlContent || "";
    if (!htmlContent && Array.isArray(req.body.blocks) && req.body.blocks.length > 0) {
      htmlContent = compileBlocksToHtml(req.body.blocks);
    }
    const result = await sendTestCustomEmail(
      {
        subject: req.body.subject || "Test e-mail",
        preheader: req.body.preheader || req.body.previewText || null,
        htmlContent,
        headerOptions: req.body.headerOptions,
      },
      toEmail
    );
    if (!result.ok) return res.status(500).json({ error: result.error || "Odeslání testovacího e-mailu selhalo" });
    await logMarketingAction("template.test_sent", req.session.userId || null, { type: "template", id: 0 }, { to: toEmail });
    res.json({ success: true });
  } catch (error) {
    console.error("Generic test send error:", error);
    res.status(500).json({ error: "Chyba při odesílání testovacího e-mailu: " + (error instanceof Error ? error.message : String(error)) });
  }
});

router.post("/templates/:id/send-test", requireAdmin, testSendLimiter, async (req: Request, res: Response) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    const toEmail = String(req.body.email || "").trim();
    if (!toEmail || !toEmail.includes("@")) {
      return res.status(400).json({ error: "Zadejte platnou e-mailovou adresu pro test." });
    }
    const { sendTestMarketingEmail } = await import("../lib/marketing/sender.js");
    const result = await sendTestMarketingEmail(templateId, toEmail, {
      subject: req.body.subject,
      preheader: req.body.preheader,
      blocks: req.body.blocks,
      headerOptions: req.body.headerOptions,
      htmlContent: req.body.htmlContent,
    });
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
    // Auto-seed templates if they don't exist
    try {
      const { TEMPLATE_SEEDS } = await import("../lib/templateSeeds.js");
      let seeded = 0;
      for (const tpl of TEMPLATE_SEEDS) {
        const existing = await pool.query(
          "SELECT id FROM marketing_templates WHERE key = $1",
          [tpl.key]
        );
        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO marketing_templates 
             (name, key, category, audience, journey_name, step_position, step_type, is_recommended, sort_order, subject, preheader, html_content, blocks, header_options)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb)`,
            [
              tpl.name, tpl.key, tpl.category, tpl.audience || 'general', tpl.journey_name, tpl.step_position,
              tpl.step_type, tpl.is_recommended, tpl.sort_order, tpl.subject, tpl.preheader, tpl.html_content,
              tpl.blocks ? JSON.stringify(tpl.blocks) : null,
              tpl.header_options ? JSON.stringify(tpl.header_options) : null
            ]
          );
          seeded++;
        }
      }
      if (seeded > 0) {
        console.log(`✅ Auto-seeded ${seeded} email templates`);
      }
    } catch (seedErr) {
      console.error("Auto-seed templates failed:", seedErr);
    }

    // Auto-seed transactional journeys and ensure they have steps
    try {
      const { JOURNEY_CONFIGS } = await import("../lib/journeySeeds.js");
      // Get only transactional journeys (first 3)
      const transactionalJourneys = JOURNEY_CONFIGS.filter((j) => j.trigger_value && j.trigger_value in { order_created: true, digital_license_ready: true, invoice_ready: true });
      
      for (const journeyConfig of transactionalJourneys) {
        // Check if journey already exists
        const existing = await pool.query(
          "SELECT id FROM marketing_journeys WHERE trigger_value = $1",
          [journeyConfig.trigger_value]
        );
        
        let journeyId: number;
        
        if (existing.rows.length === 0) {
          // Create journey if it doesn't exist
          const journeyRes = await pool.query(
            `INSERT INTO marketing_journeys 
             (name, description, trigger_type, trigger_value, status)
             VALUES ($1, $2, $3, $4, 'active')
             RETURNING id`,
            [
              journeyConfig.name,
              journeyConfig.description,
              journeyConfig.trigger_type,
              journeyConfig.trigger_value || null,
            ]
          );
          journeyId = journeyRes.rows[0].id;
        } else {
          journeyId = existing.rows[0].id;
        }
        
        // Check if journey has any steps
        const stepsCount = await pool.query(
          "SELECT COUNT(*) FROM marketing_journey_steps WHERE journey_id = $1",
          [journeyId]
        );
        
        if (parseInt(stepsCount.rows[0].count || 0, 10) === 0) {
          // Create missing steps
          let stepIndex = 1;
          console.log(`[Marketing] Creating steps for journey: ${journeyConfig.name}`);
          for (const step of journeyConfig.steps) {
            const templateRes = await pool.query(
              "SELECT id FROM marketing_templates WHERE key = $1",
              [step.template_key]
            );
            
            if (templateRes.rows.length === 0) {
              console.warn(`[Marketing] Template not found: ${step.template_key} for journey: ${journeyConfig.name}`);
              continue;
            }
            
            const templateId = templateRes.rows[0].id;
            console.log(`[Marketing] Inserting step for ${journeyConfig.name}: template ${step.template_key} (id: ${templateId})`);
            
            await pool.query(
              `INSERT INTO marketing_journey_steps
               (journey_id, position, step_type, template_id, delay_hours, configuration)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                journeyId,
                stepIndex,
                "email",
                templateId,
                step.delay_hours,
                JSON.stringify({ description: step.description })
              ]
            );
            console.log(`[Marketing] Step inserted successfully`);
            stepIndex++;
          }
          console.log(`✅ Auto-seeded steps for journey: ${journeyConfig.name}`);
        }
      }
    } catch (seedErr) {
      console.error("Auto-seed journeys failed:", seedErr);
    }

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
  const client = await pool.connect();
  try {
    const journeyId = parseInt(req.params.id, 10);
    const { stepType, delayHours, templateId, configuration, insertAtIdx } = req.body;
    if (!stepType) return res.status(400).json({ error: "Chybí typ kroku" });

    await client.query("BEGIN");
    
    // Fetch current steps to rebalance positions
    const stepsRes = await client.query(
      "SELECT id, position FROM marketing_journey_steps WHERE journey_id = $1 ORDER BY position ASC",
      [journeyId]
    );
    const steps = stepsRes.rows;
    
    // Determine the target position for the new step
    let targetPosition: number;
    if (insertAtIdx !== undefined && insertAtIdx >= 0 && insertAtIdx <= steps.length) {
      targetPosition = insertAtIdx + 1;
      // Shift subsequent steps to make room
      for (let i = insertAtIdx; i < steps.length; i++) {
        await client.query(
          "UPDATE marketing_journey_steps SET position = $1 WHERE id = $2",
          [i + 2, steps[i].id]
        );
      }
    } else {
      // Append to the end
      targetPosition = steps.length > 0 ? steps[steps.length - 1].position + 1 : 1;
    }

    const result = await client.query(
      `INSERT INTO marketing_journey_steps (journey_id, position, step_type, delay_hours, template_id, configuration)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [journeyId, targetPosition, stepType, delayHours || 0, templateId || null, JSON.stringify(configuration || {})]
    );
    
    await client.query("COMMIT");
    res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Chyba při vytváření kroku" });
  } finally {
    client.release();
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
    const tplRes = await pool.query("SELECT subject, html_content, preheader, blocks, header_options FROM marketing_templates WHERE id = $1", [templateId]);
    if (tplRes.rows.length === 0) return res.status(404).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Šablona nenalezena.</p>");
    const { renderTemplatePreview } = await import("../lib/marketing/sender.js");
    const { html } = renderTemplatePreview({
      ...tplRes.rows[0],
      headerOptions: tplRes.rows[0].header_options,
    });
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Chyba při generování náhledu.</p>");
  }
});

router.post("/journeys/:id/steps/:stepId/send-test", requireAdmin, testSendLimiter, async (req: Request, res: Response) => {
  try {
    const toEmail = String(req.body.email || req.body.to || "").trim();
    if (!toEmail || !toEmail.includes("@")) {
      return res.status(400).json({ error: "Zadejte platnou e-mailovou adresu pro test." });
    }
    const stepRes = await pool.query("SELECT * FROM marketing_journey_steps WHERE id = $1", [req.params.stepId]);
    const step = stepRes.rows[0];
    const templateId = step?.template_id;
    
    let sent = false;
    let lastError = "";

    if (templateId) {
      const { sendTestMarketingEmail } = await import("../lib/marketing/sender.js");
      const result = await sendTestMarketingEmail(templateId, toEmail, {
        subject: req.body.subject,
        preheader: req.body.preheader,
        blocks: req.body.blocks,
        headerOptions: req.body.headerOptions,
        htmlContent: req.body.htmlContent,
      });
      if (result.ok) {
        sent = true;
      } else {
        lastError = result.error || "";
      }
    }

    if (!sent) {
      // Step does not have a valid template_id or sending failed - send custom email from provided blocks / step configuration
      const { sendTestCustomEmail } = await import("../lib/marketing/sender.js");
      const { compileBlocksToHtml } = await import("../lib/marketing/blockCompiler.js");
      let htmlContent = req.body.htmlContent || "";
      if (!htmlContent && Array.isArray(req.body.blocks) && req.body.blocks.length > 0) {
        htmlContent = compileBlocksToHtml(req.body.blocks);
      }
      const result = await sendTestCustomEmail(
        {
          subject: req.body.subject || step?.subject || "Test e-mail kroku",
          preheader: req.body.preheader || step?.preheader || null,
          htmlContent,
          headerOptions: req.body.headerOptions || step?.header_options,
        },
        toEmail
      );
      if (!result.ok) return res.status(500).json({ error: result.error || lastError || "Odeslání testovacího e-mailu selhalo" });
    }

    await logMarketingAction("journey_step.test_sent", req.session.userId || null, { type: "journey_step", id: parseInt(req.params.stepId, 10) }, { to: toEmail });
    res.json({ success: true });
  } catch (error) {
    console.error("Journey step test send error:", error);
    res.status(500).json({ error: "Chyba při odesílání testovacího e-mailu: " + (error instanceof Error ? error.message : String(error)) });
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
      `SELECT c.*, t.name AS template_name,
        COALESCE((SELECT COUNT(*) FROM marketing_campaign_emails ce WHERE ce.campaign_id = c.id), 0) AS email_count,
        CASE
          WHEN c.total_recipients > 0 AND c.status IN ('active', 'completed', 'paused') THEN c.total_recipients
          WHEN (c.segment_rules->>'type') = 'buyers' OR c.audience_segment = 'paid'
            THEN (SELECT COUNT(*) FROM subscribers WHERE marketing_consent=TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL AND is_buyer=TRUE)
          WHEN (c.segment_rules->>'type') = 'non_buyers' OR (c.segment_rules->>'type') = 'free_downloads' OR c.audience_segment = 'free'
            THEN (SELECT COUNT(*) FROM subscribers WHERE marketing_consent=TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL AND is_buyer=FALSE)
          ELSE
            (SELECT COUNT(*) FROM subscribers WHERE marketing_consent=TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL)
        END AS recipient_count
       FROM marketing_campaigns c
       LEFT JOIN marketing_templates t ON t.id = c.template_id
       ORDER BY c.created_at DESC`
    );
    const campaigns = result.rows.map((camp: any) => ({
      ...camp,
      emailCount: parseInt(camp.email_count || "0", 10),
      recipient_count: parseInt(camp.recipient_count || "0", 10),
      total_recipients: parseInt(camp.recipient_count || camp.total_recipients || "0", 10),
    }));
    res.json(campaigns);
  } catch (error) {
    console.error("Error listing campaigns:", error);
    res.status(500).json({ error: "Chyba při načítání kampaní" });
  }
});



router.post("/campaigns", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, subject, preheader, templateId, blocks, htmlContent, headerOptions, segmentRules, scheduledAt, audience } = req.body;
    if (!name) return res.status(400).json({ error: "Chybí název kampaně" });

    let audienceSegment = req.body.audience_segment || "mixed";
    let resolvedSegmentRules = segmentRules;
    if (audience === "buyers") {
      audienceSegment = "paid";
      resolvedSegmentRules = resolvedSegmentRules || { type: "buyers" };
    } else if (audience === "free_downloads") {
      audienceSegment = "free";
      resolvedSegmentRules = resolvedSegmentRules || { type: "non_buyers" };
    } else if (!resolvedSegmentRules) {
      resolvedSegmentRules = { type: "all" };
    }

    let finalHtml = htmlContent || "";
    if (Array.isArray(blocks) && blocks.length > 0) finalHtml = compileBlocksToHtml(blocks);
    const blocksJson = Array.isArray(blocks) ? JSON.stringify(blocks) : (blocks ? JSON.stringify(blocks) : "[]");
    const headerOptionsJson = headerOptions ? JSON.stringify(headerOptions) : "{}";
    const segmentJson = JSON.stringify(resolvedSegmentRules);
    const status = scheduledAt ? "scheduled" : "draft";

    let recipientCount = 0;
    try {
      const baseWhere = `marketing_consent = TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL`;
      let countRes;
      if (audienceSegment === "paid") {
        countRes = await pool.query(`SELECT COUNT(*) FROM subscribers WHERE ${baseWhere} AND is_buyer = TRUE`);
      } else if (audienceSegment === "free") {
        countRes = await pool.query(`SELECT COUNT(*) FROM subscribers WHERE ${baseWhere} AND is_buyer = FALSE`);
      } else {
        countRes = await pool.query(`SELECT COUNT(*) FROM subscribers WHERE ${baseWhere}`);
      }
      recipientCount = parseInt(countRes.rows[0].count, 10);
    } catch (e) {
      console.warn("Could not calculate initial recipient count:", e);
    }

    const result = await pool.query(
      `INSERT INTO marketing_campaigns (name, subject, preheader, template_id, status, blocks, html_content, header_options, segment_rules, scheduled_at, audience_segment, total_recipients)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9::jsonb,$10,$11,$12) RETURNING *`,
      [name, subject || null, preheader || null, templateId || null, status, blocksJson, finalHtml || null, headerOptionsJson, segmentJson, scheduledAt || null, audienceSegment, recipientCount]
    );
    await logMarketingAction("campaign.created", req.session.userId || null, { type: "campaign", id: result.rows[0].id });
    res.json({
      ...result.rows[0],
      emailCount: 0,
      recipient_count: recipientCount,
      total_recipients: recipientCount,
      audience: audience || (audienceSegment === "paid" ? "buyers" : "free_downloads"),
    });
  } catch (error) {
    console.error("Campaign create error:", error);
    res.status(500).json({ error: "Chyba při vytváření kampaně" });
  }
});


router.patch("/campaigns/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, subject, preheader, templateId, blocks, htmlContent, headerOptions, segmentRules, scheduledAt } = req.body;
    let finalHtml = htmlContent || "";
    if (Array.isArray(blocks) && blocks.length > 0) finalHtml = compileBlocksToHtml(blocks);
    const blocksJson = Array.isArray(blocks) ? JSON.stringify(blocks) : (blocks ? JSON.stringify(blocks) : "[]");
    const headerOptionsJson = headerOptions ? JSON.stringify(headerOptions) : null;
    const segmentJson = segmentRules ? JSON.stringify(segmentRules) : null;

    const result = await pool.query(
      `UPDATE marketing_campaigns SET name = $1, subject = $2, preheader = $3, template_id = $4,
       blocks = $5::jsonb, html_content = $6, header_options = COALESCE($7::jsonb, header_options),
       segment_rules = COALESCE($8::jsonb, segment_rules),
       scheduled_at = $9,
       status = CASE WHEN $9 IS NOT NULL AND status = 'draft' THEN 'scheduled'
                     WHEN $9 IS NULL AND status = 'scheduled' THEN 'draft'
                     ELSE status END,
       updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING *`,
      [name, subject || null, preheader || null, templateId || null, blocksJson, finalHtml || null, headerOptionsJson, segmentJson, scheduledAt || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Kampaně nenalezena" });
    await logMarketingAction("campaign.edited", req.session.userId || null, { type: "campaign", id: parseInt(req.params.id, 10) });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Campaign update error:", error);
    res.status(500).json({ error: "Chyba při ukládání kampaně" });
  }
});


router.get("/campaigns/:id/preview", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignRes = await pool.query("SELECT * FROM marketing_campaigns WHERE id = $1", [req.params.id]);
    const campaign = campaignRes.rows[0];
    if (!campaign) return res.status(404).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Kampaň nenalezena.</p>");

    let subject = campaign.subject || "Náhled kampaně";
    let htmlContent = campaign.html_content || "";

    if (!htmlContent && Array.isArray(campaign.blocks) && campaign.blocks.length > 0) {
      htmlContent = compileBlocksToHtml(campaign.blocks);
    }

    if (!htmlContent && campaign.template_id) {
      const templateRes = await pool.query("SELECT subject, html_content, preheader, blocks, header_options FROM marketing_templates WHERE id = $1", [campaign.template_id]);
      const template = templateRes.rows[0];
      if (template) {
        if (!subject) subject = template.subject;
        htmlContent = template.html_content || (Array.isArray(template.blocks) ? compileBlocksToHtml(template.blocks) : "");
        if (!campaign.header_options) campaign.header_options = template.header_options;
      }
    }

    const { renderTemplatePreview } = await import("../lib/marketing/sender.js");
    const { html } = renderTemplatePreview({
      subject,
      preheader: campaign.preheader,
      html_content: htmlContent,
      headerOptions: campaign.header_options,
    });
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    res.status(500).send("<p style='padding:40px;color:#666;font-family:sans-serif'>Chyba při generování náhledu kampaně.</p>");
  }
});

router.post("/campaigns/:id/send-test", requireAdmin, testSendLimiter, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const toEmail = String(req.body.email || "").trim();
    if (!toEmail || !toEmail.includes("@")) {
      return res.status(400).json({ error: "Zadejte platnou e-mailovou adresu pro test." });
    }

    const campaignRes = await pool.query("SELECT * FROM marketing_campaigns WHERE id = $1", [campaignId]);
    const campaign = campaignRes.rows[0];
    if (!campaign) return res.status(404).json({ error: "Kampaň nenalezena" });

    // Prefer live blocks/subject passed from the editor UI (unsaved state), fall back to DB
    const overrideBlocks = Array.isArray(req.body.blocks) && req.body.blocks.length > 0 ? req.body.blocks : null;
    const overrideSubject = req.body.subject || null;
    const overridePreheader = req.body.preheader !== undefined ? req.body.preheader : null;
    const overrideHeaderOptions = req.body.headerOptions || null;

    let subject = overrideSubject || campaign.subject || "Test kampaň";
    let preheader = overridePreheader !== null ? overridePreheader : campaign.preheader;
    let headerOptions = overrideHeaderOptions || campaign.header_options;
    let htmlContent = "";

    if (overrideBlocks) {
      htmlContent = compileBlocksToHtml(overrideBlocks);
    } else if (Array.isArray(campaign.blocks) && campaign.blocks.length > 0) {
      htmlContent = compileBlocksToHtml(campaign.blocks);
    } else if (campaign.html_content) {
      htmlContent = campaign.html_content;
    } else if (campaign.template_id) {
      const templateRes = await pool.query("SELECT subject, html_content, preheader, blocks, header_options FROM marketing_templates WHERE id = $1", [campaign.template_id]);
      const template = templateRes.rows[0];
      if (template) {
        if (!subject) subject = template.subject;
        if (!preheader) preheader = template.preheader;
        htmlContent = template.html_content || (Array.isArray(template.blocks) ? compileBlocksToHtml(template.blocks) : "");
        if (!headerOptions) headerOptions = template.header_options;
      }
    }

    const { sendTestCustomEmail } = await import("../lib/marketing/sender.js");
    const result = await sendTestCustomEmail(
      { subject, preheader, htmlContent, headerOptions },
      toEmail
    );
    if (!result.ok) return res.status(500).json({ error: result.error || "Odeslání testovacího e-mailu selhalo" });
    await logMarketingAction("campaign.test_sent", req.session.userId || null, { type: "campaign", id: campaignId }, { to: toEmail });
    res.json({ success: true });
  } catch (error) {
    console.error("Campaign test send error:", error);
    res.status(500).json({ error: "Chyba při odesílání testovacího e-mailu: " + (error instanceof Error ? error.message : String(error)) });
  }
});

// Helper for selecting beats and sound kits inside the Beat Highlight block of the visual editor
router.get("/beats-select", requireAdmin, async (_req: Request, res: Response) => {
  try {
    // Get published beats - these are the "live" beats in beaty playlist
    const beatsRes = await pool.query(
      `SELECT id, title FROM beats WHERE is_published = true ORDER BY created_at DESC LIMIT 100`
    );
    const kitsRes = await pool.query(
      `SELECT id, title FROM sound_kits WHERE is_published = true ORDER BY created_at DESC LIMIT 100`
    );

    const items = [
      ...beatsRes.rows.map((b: any) => ({
        id: `beat-${b.id}`,
        title: b.title || "Beat",
        subtitle: "Beat",
      })),
      ...kitsRes.rows.map((k: any) => ({
        id: `kit-${k.id}`,
        title: k.title || "Kit",
        subtitle: "Sound Kit",
      })),
    ];

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání položek" });
  }
});

// Estimate recipient count for a campaign's segment-filtered audience.
router.get("/campaigns/:id/audience-count", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignRes = await pool.query("SELECT segment_rules FROM marketing_campaigns WHERE id = $1", [req.params.id]);
    const segmentRules = campaignRes.rows[0]?.segment_rules || { type: "all" };
    const audience = await resolveSegmentAudience(segmentRules);
    res.json({ count: audience.length });
  } catch (error) {
    res.status(500).json({ error: "Chyba při počítání příjemců" });
  }
});

// Detailed audience statistics for campaign recipient badge / modal
router.get("/campaigns/:id/audience-stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const campaignRes = await pool.query("SELECT * FROM marketing_campaigns WHERE id = $1", [campaignId]);
    const campaign = campaignRes.rows[0];
    if (!campaign) return res.status(404).json({ error: "Kampaň nenalezena" });

    const segmentRules = campaign.segment_rules || { type: "all" };
    const audience = await resolveSegmentAudience(segmentRules);

    let buyersCount = 0;
    let freebiesCount = 0;
    for (const s of audience) {
      if (s.is_buyer) buyersCount++;
      else freebiesCount++;
    }

    const [unsubRes, suppRes, totalSubsRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM subscribers WHERE unsubscribed_at IS NOT NULL"),
      pool.query("SELECT COUNT(*) FROM subscribers WHERE suppressed_at IS NOT NULL"),
      pool.query("SELECT COUNT(*) FROM subscribers"),
    ]);

    const sampleRecipients = audience.slice(0, 50).map((s: any) => ({
      id: s.id,
      email: s.email,
      name: s.name || "Bez jména",
      first_source: s.first_source || "web",
      is_buyer: !!s.is_buyer,
      created_at: s.created_at,
    }));

    res.json({
      campaignId,
      campaignName: campaign.name,
      segmentRules,
      totalRecipients: audience.length,
      totalSubscribers: parseInt(totalSubsRes.rows[0].count, 10),
      buyersCount,
      freebiesCount,
      excludedUnsubscribed: parseInt(unsubRes.rows[0].count, 10),
      excludedSuppressed: parseInt(suppRes.rows[0].count, 10),
      estimatedDaysSlowDrip: Math.ceil(audience.length / 85),
      sampleRecipients,
    });
  } catch (error) {
    console.error("Audience stats error:", error);
    res.status(500).json({ error: "Chyba při načítání statistik publika" });
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

    let campaignHtml = campaign.html_content || "";
    if (!campaignHtml && Array.isArray(campaign.blocks) && campaign.blocks.length > 0) {
      campaignHtml = compileBlocksToHtml(campaign.blocks);
    }

    if (!campaign.template_id && !campaignHtml) {
      return res.status(400).json({ error: "Kampaň nemá přiřazenou šablonu ani vlastní obsah" });
    }

    const audience = await resolveSegmentAudience(campaign.segment_rules);

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
              templateId: campaign.template_id || undefined,
              campaignId,
              idempotencyKey: `campaign/${campaignId}/subscriber/${subscriber.id}`,
              customSubject: campaign.subject || undefined,
              customPreheader: campaign.preheader || undefined,
              customHtml: campaignHtml || undefined,
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

// ── Admin: live block preview (WYSIWYG) ─────────────────────────────────────
router.post("/preview-blocks", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { blocks, subject, preheader, headerOptions } = req.body;
    const appUrl = process.env.APP_URL || "https://voodoo808.com";
    const { renderBrandedEmailShell } = await import("../lib/marketing/brandKit.js");
    const sampleVars: Record<string, string> = {
      first_name: "Petr",
      email: "petr@example.com",
      unsubscribe_url: `${appUrl}/odhlasit-marketing?token=NAHLED`,
      site_url: appUrl,
    };
    function fillVars(text: string): string {
      return text.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (m, key) => sampleVars[key] ?? m);
    }
    let bodyHtml = "";
    if (Array.isArray(blocks) && blocks.length > 0) {
      bodyHtml = fillVars(compileBlocksToHtml(blocks));
    }
    const html = renderBrandedEmailShell({
      appUrl, bodyHtml,
      unsubscribeUrl: sampleVars.unsubscribe_url,
      preheader: preheader ? fillVars(String(preheader)) : undefined,
      headerOptions,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    console.error("Preview-blocks error:", error);
    res.status(500).json({ error: "Chyba při generování náhledu" });
  }
});

// ── Campaign analytics (per-campaign stats) ──────────────────────────────────
router.get("/campaigns/:id/stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [campaign, sendsRes, eventsRes] = await Promise.all([
      pool.query("SELECT id, name, subject, status, sent_at, recipient_count FROM marketing_campaigns WHERE id = $1", [id]),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('sent','delivered','opened','clicked')) AS delivered,
           COUNT(*) FILTER (WHERE opened_at IS NOT NULL) AS opened,
           COUNT(*) FILTER (WHERE first_clicked_at IS NOT NULL) AS clicked,
           COUNT(*) FILTER (WHERE status = 'failed') AS failed,
           COUNT(*) FILTER (WHERE status = 'suppressed') AS suppressed
         FROM marketing_email_sends WHERE campaign_id = $1`,
        [id]
      ),
      pool.query(
        `SELECT event_type, COUNT(*) FROM marketing_email_events mee
         JOIN marketing_email_sends mes ON mes.id = mee.email_send_id
         WHERE mes.campaign_id = $1 GROUP BY event_type`,
        [id]
      ),
    ]);
    if (!campaign.rows[0]) return res.status(404).json({ error: "Kampaně nenalezena" });
    const s = sendsRes.rows[0];
    const delivered = parseInt(s.delivered, 10) || 0;
    const opened = parseInt(s.opened, 10) || 0;
    const clicked = parseInt(s.clicked, 10) || 0;
    const eventMap: Record<string, number> = {};
    for (const r of eventsRes.rows) eventMap[r.event_type] = parseInt(r.count, 10);
    res.json({
      ...campaign.rows[0],
      delivered,
      opened,
      clicked,
      failed: parseInt(s.failed, 10) || 0,
      suppressed: parseInt(s.suppressed, 10) || 0,
      openRate: delivered > 0 ? Math.round((opened / delivered) * 1000) / 10 : 0,
      clickRate: delivered > 0 ? Math.round((clicked / delivered) * 1000) / 10 : 0,
      clickToOpenRate: opened > 0 ? Math.round((clicked / opened) * 1000) / 10 : 0,
      events: eventMap,
    });
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání statistik" });
  }
});

// ── Resend to non-openers ─────────────────────────────────────────────────────
router.post("/campaigns/:id/resend-non-openers", requireAdmin, async (req: Request, res: Response) => {
  try {
    const parentId = parseInt(req.params.id, 10);
    const { subject, scheduledAt } = req.body;
    const parentRes = await pool.query("SELECT * FROM marketing_campaigns WHERE id = $1", [parentId]);
    const parent = parentRes.rows[0];
    if (!parent) return res.status(404).json({ error: "Kampaně nenalezena" });
    if (!['sent','sending'].includes(parent.status)) return res.status(400).json({ error: "Můžete přeposlat pouze odeslanou kampaně" });

    // Count non-openers for confirmation display
    const audience = await resolveSegmentAudience({ type: "non_openers", parent_campaign_id: parentId });
    if (audience.length === 0) return res.status(400).json({ error: "Není žádný neotviral, kterému by se dalo znovu odeslát." });

    const newName = `${parent.name} (opakovní pro neotviralé)`;
    const newStatus = scheduledAt ? "scheduled" : "draft";
    const result = await pool.query(
      `INSERT INTO marketing_campaigns
         (name, subject, preheader, template_id, status, blocks, html_content, header_options, segment_rules, scheduled_at, parent_campaign_id, resend_for)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9::jsonb,$10,$11,'non_openers') RETURNING *`,
      [
        newName,
        subject || parent.subject,
        parent.preheader,
        parent.template_id,
        newStatus,
        JSON.stringify(parent.blocks || []),
        parent.html_content,
        JSON.stringify(parent.header_options || {}),
        JSON.stringify({ type: "non_openers", parent_campaign_id: parentId }),
        scheduledAt || null,
        parentId,
      ]
    );
    await logMarketingAction("campaign.resend_non_openers", req.session.userId || null, { type: "campaign", id: result.rows[0].id }, { parentId, audienceCount: audience.length });
    res.json({ campaign: result.rows[0], audienceCount: audience.length });
  } catch (error) {
    console.error("Resend non-openers error:", error);
    res.status(500).json({ error: "Chyba při vytváření kampaně pro neotviralé" });
  }
});

// ── Journey step analytics ───────────────────────────────────────────────────
router.get("/journeys/:id/analytics", requireAdmin, async (req: Request, res: Response) => {
  try {
    const journeyId = parseInt(req.params.id, 10);
    const stepsRes = await pool.query(
      `SELECT s.*,
         (SELECT COUNT(*) FROM marketing_email_sends mes WHERE mes.journey_step_id = s.id) AS sends,
         (SELECT COUNT(*) FROM marketing_email_sends mes WHERE mes.journey_step_id = s.id AND mes.opened_at IS NOT NULL) AS opens,
         (SELECT COUNT(*) FROM marketing_email_sends mes WHERE mes.journey_step_id = s.id AND mes.first_clicked_at IS NOT NULL) AS clicks,
         (SELECT COUNT(*) FROM marketing_email_sends mes WHERE mes.journey_step_id = s.id AND mes.status = 'failed') AS failures
       FROM marketing_journey_steps s WHERE s.journey_id = $1 ORDER BY s.position ASC`,
      [journeyId]
    );
    const enrollmentsRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active') AS active,
         COUNT(*) FILTER (WHERE status = 'completed') AS completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
         COUNT(*) FILTER (WHERE status = 'failed') AS failed
       FROM marketing_enrollments WHERE journey_id = $1`,
      [journeyId]
    );
    res.json({
      steps: stepsRes.rows.map(r => ({
        ...r,
        sends: parseInt(r.sends, 10) || 0,
        opens: parseInt(r.opens, 10) || 0,
        clicks: parseInt(r.clicks, 10) || 0,
        failures: parseInt(r.failures, 10) || 0,
        openRate: parseInt(r.sends, 10) > 0 ? Math.round((parseInt(r.opens, 10) / parseInt(r.sends, 10)) * 1000) / 10 : 0,
        clickRate: parseInt(r.sends, 10) > 0 ? Math.round((parseInt(r.clicks, 10) / parseInt(r.sends, 10)) * 1000) / 10 : 0,
      })),
      enrollments: enrollmentsRes.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání analytiky" });
  }
});

// ── Subscriber CSV export ─────────────────────────────────────────────────────
router.get("/subscribers/export.csv", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT s.email, s.name, s.marketing_consent, s.is_buyer,
              s.first_source, s.utm_source, s.utm_campaign,
              s.unsubscribed_at, s.suppressed_at, s.created_at,
              COALESCE(STRING_AGG(DISTINCT t.name, '; '), '') AS tags
       FROM subscribers s
       LEFT JOIN subscriber_tags st ON st.subscriber_id = s.id
       LEFT JOIN tags t ON t.id = st.tag_id
       GROUP BY s.id ORDER BY s.created_at DESC`
    );
    const rows = result.rows;
    const headers = ["email","name","marketing_consent","is_buyer","first_source","utm_source","utm_campaign","unsubscribed_at","suppressed_at","created_at","tags"];
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map(r => headers.map(h => esc(r[h])).join(",")),
    ].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="subscribers-${new Date().toISOString().substring(0,10)}.csv"`);
    res.send("\uFEFF" + csv); // BOM for Excel UTF-8 compatibility
  } catch (error) {
    res.status(500).json({ error: "Chyba při exportu" });
  }
});

// ── Subscriber CSV import ─────────────────────────────────────────────────────
// Accepts a CSV body with header row. Required column: email. Optional: name.
// NEVER sets marketing_consent — imported contacts require explicit opt-in.
const csvImportLimiter = rateLimit({ windowMs: 60_000, max: 5, keyPrefix: "csv_import" });
router.post("/subscribers/import-csv", requireAdmin, csvImportLimiter, async (req: Request, res: Response) => {
  try {
    const body = String(req.body?.csv || "");
    if (!body.trim()) return res.status(400).json({ error: "Prázdný CSV soubor" });

    const lines = body.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: "CSV musí obsahovat alespoň řádek s hlavičkou a jeden kontakt" });

    // Parse header
    const parseCsvLine = (line: string) =>
      line.split(",").map(c => c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
    const emailIdx = headers.indexOf("email");
    if (emailIdx === -1) return res.status(400).json({ error: "CSV musí mít sloupec 'email'" });
    const nameIdx = headers.indexOf("name");

    let imported = 0, skipped = 0, errors = 0;
    for (const line of lines.slice(1)) {
      const cols = parseCsvLine(line);
      const email = normalizeEmail(cols[emailIdx] || "");
      if (!email || !email.includes("@")) { skipped++; continue; }
      const name = nameIdx >= 0 ? cols[nameIdx] || null : null;
      try {
        await upsertSubscriber({ email, name, source: "csv_import" });
        await pool.query(
          `INSERT INTO subscriber_tags (subscriber_id, tag_id)
           SELECT s.id, t.id FROM subscribers s, tags t
           WHERE s.email_normalized = $1 AND t.slug = 'imported'
           ON CONFLICT DO NOTHING`,
          [email]
        );
        imported++;
      } catch {
        errors++;
      }
    }
    // Ensure 'imported' tag exists
    await pool.query("INSERT INTO tags (name, slug) VALUES ('imported','imported') ON CONFLICT DO NOTHING");
    await logMarketingAction("subscribers.csv_imported", req.session.userId || null, undefined, { imported, skipped, errors });
    res.json({ imported, skipped, errors, total: lines.length - 1 });
  } catch (error) {
    console.error("CSV import error:", error);
    res.status(500).json({ error: "Chyba při importu CSV" });
  }
});

// ── Double opt-in: send confirmation email ────────────────────────────────────
const doubleOptinLimiter = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "double_optin" });
router.post("/subscribers/:id/send-double-optin", requireAdmin, doubleOptinLimiter, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const sub = await getSubscriberById(id);
    if (!sub) return res.status(404).json({ error: "Odběratel nenalezen" });
    if (sub.marketing_consent) return res.status(400).json({ error: "Odběratel již je přihlášen k odběru" });

    const token = randomBytes(32).toString("hex");
    const appUrl = process.env.APP_URL || "https://voodoo808.com";
    const confirmUrl = `${appUrl}/potvrdit-odber?token=${token}`;

    await pool.query(
      `UPDATE subscribers SET double_optin_token = $2, double_optin_sent_at = NOW() WHERE id = $1`,
      [id, token]
    );

    // Send confirmation email via Resend
    const { Resend } = await import("resend");
    const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;
    if (!apiKey) return res.status(503).json({ error: "RESEND_API_KEY není nastaven" });
    const resend = new Resend(apiKey);
    const fromAddress = process.env.RESEND_FROM || "VOODOO808 <info@voodoo808.com>";
    const { renderBrandedEmailShell } = await import("../lib/marketing/brandKit.js");
    const bodyHtml = `
      <p style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#ffffff;">Potvrďte odběr</p>
      <p style="margin:0 0 16px 0;font-size:15px;color:#aaaaaa;line-height:1.6;">
        Klikněte na tlačítko níže pro potvrzení vašeho odběru marketingových e-mailů od VOODOO808.
      </p>
      <table cellpadding="0" cellspacing="0"><tr><td>
        <a href="${confirmUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-weight:700;font-size:13px;padding:14px 32px;border-radius:4px;text-decoration:none;letter-spacing:0.5px;">POTVRDIT ODBĚR</a>
      </td></tr></table>
      <p style="margin:16px 0 0 0;font-size:12px;color:#555555;">
        Pokud jste o odběr nežádali, jednoduše tento e-mail ignorujte.
      </p>`;
    const html = renderBrandedEmailShell({
      appUrl,
      bodyHtml,
      unsubscribeUrl: `${appUrl}/odhlasit-marketing`,
      preheader: "Prosím potvrďte váš e-mailový odběr",
    });
    await resend.emails.send({ from: fromAddress, to: [sub.email], subject: "Potvrďte odběr VOODOO808", html });
    await logMarketingAction("subscriber.double_optin_sent", req.session.userId || null, { type: "subscriber", id });
    res.json({ success: true });
  } catch (error) {
    console.error("Double opt-in send error:", error);
    res.status(500).json({ error: "Chyba při odesílání potvrzovacího e-mailu" });
  }
});

// ── Double opt-in: public confirmation endpoint ───────────────────────────────
const optinConfirmLimiter = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "optin_confirm" });
router.get("/potvrdit-odber", optinConfirmLimiter, async (req: Request, res: Response) => {
  const token = String(req.query.token || "");
  if (!token) return res.status(400).json({ error: "Chybí token" });
  try {
    const result = await pool.query(
      `UPDATE subscribers
       SET marketing_consent = TRUE,
           marketing_consent_at = NOW(),
           marketing_consent_source = 'double_optin',
           double_optin_confirmed_at = NOW(),
           double_optin_token = NULL,
           unsubscribed_at = NULL,
           unsubscribe_reason = NULL,
           updated_at = NOW()
       WHERE double_optin_token = $1
         AND double_optin_confirmed_at IS NULL
       RETURNING id`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.send("<html><body style='background:#0a0a0a;color:#aaa;font-family:sans-serif;padding:40px;text-align:center;'><h2>Odkaz je neplatný nebo již byl použit.</h2></body></html>");
    }
    await logMarketingAction("subscriber.double_optin_confirmed", null, { type: "subscriber", id: result.rows[0].id });
    res.send("<html><body style='background:#0a0a0a;color:#fff;font-family:sans-serif;padding:40px;text-align:center;'><h2 style='color:#fff;'>\u2705 Odb\u011br potvrzen!</h2><p style='color:#aaa;'>D\u011bkujeme za potvrzen\u00ed. Brzy se ozv\u00edme.</p><p><a href=\"https://voodoo808.com\" style=\"color:#fff;\">Zp\u011bt na VOODOO808</a></p></body></html>");
  } catch (error) {
    res.status(500).json({ error: "Chyba při potvrzování" });
  }
});

// ── AI subject line suggestions (Gemini) ─────────────────────────────────────
const aiLimiter = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "ai_subject" });
router.post("/ai/subject-suggestions", requireAdmin, aiLimiter, async (req: Request, res: Response) => {
  try {
    const { campaignName, blocks, subject, preheader } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "GEMINI_API_KEY není nastaven" });

    let bodyText = subject || campaignName || "";
    if (Array.isArray(blocks) && blocks.length > 0) {
      bodyText += " " + blocks.map((b: any) => [
        b.headingText, b.paragraphText, b.buttonText, b.heroTitle, b.heroSubtitle, b.beatTitle
      ].filter(Boolean).join(" ")).join(" ");
    }
    bodyText = bodyText.substring(0, 800);

    const prompt = `You are an email marketing expert for VOODOO808, a Czech beat producer who sells beats and sound kits.
Generate exactly 5 email subject line suggestions for a marketing campaign.
Campaign context: "${bodyText}"
Preheader (for context): "${preheader || ""}"

Rules:
- Each subject line should be punchy, intriguing, max 60 characters
- Mix styles: curiosity, benefit, urgency, personal, question
- Write in Czech language (mix of Czech and English music slang is OK)
- Do NOT use emojis
- Return ONLY a JSON array of 5 strings, no other text

Example format: ["Subject 1", "Subject 2", "Subject 3", "Subject 4", "Subject 5"]`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!response.ok) return res.status(502).json({ error: "Chyba AI API" });
    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const match = text.match(/\[.*\]/s);
    if (!match) return res.status(502).json({ error: "Nepůsobný formát odpovědi AI" });
    const suggestions = JSON.parse(match[0]);
    res.json({ suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 5) : [] });
  } catch (error) {
    console.error("AI subject suggestions error:", error);
    res.status(500).json({ error: "Chyba při generování návrhů" });
  }
});


/**
 * Admin endpoint to manually seed/reseed all 12 templates
 * POST /api/marketing/templates/admin/seed
 */
router.post("/admin/seed", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const { TEMPLATE_SEEDS } = await import("../lib/templateSeeds.js");
    
    let seeded = 0;
    let skipped = 0;
    
    for (const tpl of TEMPLATE_SEEDS) {
      const existing = await pool.query(
        "SELECT id FROM marketing_templates WHERE key = $1",
        [tpl.key]
      );
      
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      
      await pool.query(
        `INSERT INTO marketing_templates 
         (name, key, category, audience, journey_name, step_position, step_type, is_recommended, sort_order, subject, preheader, html_content)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          tpl.name,
          tpl.key,
          tpl.category,
          tpl.audience || 'general',
          tpl.journey_name,
          tpl.step_position,
          tpl.step_type,
          tpl.is_recommended,
          tpl.sort_order,
          tpl.subject,
          tpl.preheader,
          tpl.html_content,
        ]
      );
      seeded++;
    }
    
    res.json({
      success: true,
      seeded,
      skipped,
      total: seeded + skipped,
      message: `Seeded ${seeded} templates, ${skipped} already exist`
    });
  } catch (error) {
    console.error("Template seeding error:", error);
    res.status(500).json({ error: "Failed to seed templates" });
  }
});


/**
 * Admin endpoint to seed all 11 complete customer journeys with email sequences
 * POST /api/marketing/journeys/seed
 * 
 * Creates:
 * 1. Free Beat Onboarding (30 days)
 * 2. Free Sound Kit Onboarding (30 days)
 * 3. Post-Beat Purchase Upsell (45 days)
 * 4. Post-Kit Purchase Engagement (45 days)
 * 5. Abandoned Checkout Recovery (7 days)
 * 6. Browse Abandonment Recovery (10 days)
 * 7. Rapper Growth & Tips Series (60 days)
 * 8. Producer Growth & Tutorials (60 days)
 * 9. Loyal Customer Newsletter (ongoing)
 * 10. VIP Premium Subscriber Series (90 days)
 * 11. Re-engagement Campaign (for inactive users)
 */
router.post("/journeys/seed", requireAdmin, async (_req: Request, res: Response) => {
  try {
    let created = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const journeyConfig of JOURNEY_CONFIGS) {
      // Check if journey already exists
      const existing = await pool.query(
        "SELECT id FROM marketing_journeys WHERE name = $1",
        [journeyConfig.name]
      );

      if (existing.rows.length > 0) {
        skipped++;
        results.push({
          journey: journeyConfig.name,
          status: "skipped",
          reason: "Journey already exists",
        });
        continue;
      }

      // Create journey
      const journeyRes = await pool.query(
        `INSERT INTO marketing_journeys 
         (name, description, trigger_type, trigger_value, status)
         VALUES ($1, $2, $3, $4, 'draft')
         RETURNING id`,
        [
          journeyConfig.name,
          journeyConfig.description,
          journeyConfig.trigger_type,
          journeyConfig.trigger_value || null,
        ]
      );

      const journeyId = journeyRes.rows[0].id;

      // Get template IDs for each step
      let stepIndex = 1;
      for (const step of journeyConfig.steps) {
        const templateRes = await pool.query(
          "SELECT id FROM marketing_templates WHERE key = $1",
          [step.template_key]
        );

        if (templateRes.rows.length === 0) {
          console.error(
            `Template not found: ${step.template_key} for journey: ${journeyConfig.name}`
          );
          continue;
        }

        const templateId = templateRes.rows[0].id;

        // Create journey step
        await pool.query(
          `INSERT INTO marketing_journey_steps
           (journey_id, position, template_id, delay_hours, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            journeyId,
            stepIndex,
            templateId,
            step.delay_hours,
            step.description,
          ]
        );

        stepIndex++;
      }

      created++;
      results.push({
        journey: journeyConfig.name,
        status: "created",
        steps: journeyConfig.steps.length,
        trigger: journeyConfig.trigger_type,
      });
    }

    res.json({
      success: true,
      created,
      skipped,
      total: created + skipped,
      journeys: JOURNEY_CONFIGS.length,
      results,
      message: `Created ${created} journeys, ${skipped} already exist`,
      next_steps: [
        "Review journeys in admin panel",
        "Test with sample subscriber",
        "Enable journeys one by one",
        "Monitor email analytics",
      ],
    });
  } catch (error) {
    console.error("Journey seeding error:", error);
    res.status(500).json({ error: "Failed to seed journeys" });
  }
});

// ── Admin: campaign emails (for KAMPANĚ tab sequence builder) ──────────────

// Get all emails for a campaign
router.get("/campaigns/:campaignId/emails", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId, 10);
    const result = await pool.query(
      `SELECT ce.*, mt.name AS template_name
       FROM marketing_campaign_emails ce
       LEFT JOIN marketing_templates mt ON mt.id = ce.template_id
       WHERE ce.campaign_id = $1
       ORDER BY ce.position ASC`,
      [campaignId]
    );
    res.json(result.rows || []);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání e-mailů kampaně" });
  }
});

// Add a new email to a campaign with default blocks (header, title, body, footer)
router.post("/campaigns/:campaignId/emails", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId, 10);
    const { position, delayHours } = req.body;
    console.log("[Marketing] Creating campaign email:", { campaignId, position, delayHours });
    
    // Create default blocks (header, title, body text, footer)
    const defaultBlocks = [
      {
        id: "header-1",
        type: "header",
        headerType: "logo",
        logoType: "white",
        logoSize: "md"
      },
      {
        id: "title-1",
        type: "heading",
        headingText: "Nadpis vašeho e-mailu",
        headingLevel: "h1",
        headingAlign: "center"
      },
      {
        id: "body-1",
        type: "paragraph",
        paragraphText: "Sem vložte obsah vašeho e-mailu. Klikněte na e-mail v sekvenci a upravte jej v editoru. Můžete přidat více bloků, obrázky, videa, tlačítka a další prvky."
      },
      {
        id: "footer-1",
        type: "footer",
        footerText: "© 2025 VOODOO808. Všechna práva vyhrazena."
      }
    ];
    
    // Insert campaign email directly with blocks (no template reference)
    const htmlContent = compileBlocksToHtml(defaultBlocks);
    const result = await pool.query(
      `INSERT INTO marketing_campaign_emails 
       (campaign_id, position, delay_hours, template_id, subject, preheader, blocks, html_content)
       VALUES ($1, $2, $3, NULL, $4, $5, $6::jsonb, $7) 
       RETURNING *`,
      [
        campaignId, 
        position || 1, 
        delayHours || 0,
        'E-mail kampaně',
        'Přečtěte si',
        JSON.stringify(defaultBlocks),
        htmlContent
      ]
    );
    
    console.log("[Marketing] Campaign email created:", result.rows[0]);
    await logMarketingAction("campaign_email.created", req.session.userId || null, { type: "campaign_email", id: result.rows[0].id });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("[Marketing] Error creating campaign email:", error);
    res.status(500).json({ error: "Chyba při vytváření e-mailu kampaně" });
  }
});

// Update a campaign email
router.patch("/campaigns/:campaignId/emails/:emailId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const emailId = parseInt(req.params.emailId, 10);
    const { templateId, delayHours, sendDate, sendTime, sendDateTime, subject, preheader, blocks, headerOptions, htmlContent } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let i = 1;
    
    if (templateId !== undefined) { updates.push(`template_id = $${i++}`); params.push(templateId); }
    if (delayHours !== undefined) { updates.push(`delay_hours = $${i++}`); params.push(delayHours); }
    if (sendDate !== undefined) { updates.push(`send_date = $${i++}`); params.push(sendDate); }
    if (sendTime !== undefined) { updates.push(`send_time = $${i++}`); params.push(sendTime); }
    if (sendDateTime !== undefined) { updates.push(`send_datetime = $${i++}`); params.push(sendDateTime); }
    if (subject !== undefined) { updates.push(`subject = $${i++}`); params.push(subject); }
    if (preheader !== undefined) { updates.push(`preheader = $${i++}`); params.push(preheader); }
    if (blocks !== undefined) {
      const blocksArr = Array.isArray(blocks) ? blocks : (typeof blocks === "string" ? JSON.parse(blocks) : []);
      updates.push(`blocks = $${i++}::jsonb`);
      params.push(JSON.stringify(blocksArr));
      
      let finalHtml = htmlContent;
      if (!finalHtml && blocksArr.length > 0) {
        finalHtml = compileBlocksToHtml(blocksArr);
      }
      if (finalHtml !== undefined) {
        updates.push(`html_content = $${i++}`);
        params.push(finalHtml);
      }
    } else if (htmlContent !== undefined) {
      updates.push(`html_content = $${i++}`);
      params.push(htmlContent);
    }
    if (headerOptions !== undefined) {
      updates.push(`header_options = $${i++}::jsonb`);
      params.push(JSON.stringify(headerOptions));
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(emailId);
    
    const result = await pool.query(
      `UPDATE marketing_campaign_emails SET ${updates.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: "E-mail kampaně nenalezen" });
    
    // Get full email with template info
    const fullRes = await pool.query(
      `SELECT ce.*, mt.name AS template_name FROM marketing_campaign_emails ce
       LEFT JOIN marketing_templates mt ON mt.id = ce.template_id WHERE ce.id = $1`,
      [emailId]
    );
    
    await logMarketingAction("campaign_email.updated", req.session.userId || null, { type: "campaign_email", id: emailId });
    res.json(fullRes.rows[0]);
  } catch (error) {
    console.error("Campaign email update error:", error);
    res.status(500).json({ error: "Chyba při aktualizaci e-mailu kampaně: " + (error instanceof Error ? error.message : String(error)) });
  }
});

// Delete a campaign email
router.delete("/campaigns/:campaignId/emails/:emailId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const emailId = parseInt(req.params.emailId, 10);
    
    await pool.query(
      "DELETE FROM marketing_campaign_emails WHERE id = $1",
      [emailId]
    );
    
    await logMarketingAction("campaign_email.deleted", req.session.userId || null, { type: "campaign_email", id: emailId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání e-mailu kampaně" });
  }
});

// Send test email for a campaign email
router.post("/campaigns/:campaignId/emails/:emailId/send-test", requireAdmin, testSendLimiter, async (req: Request, res: Response) => {
  console.log("[CAMPAIGN EMAIL TEST] Request received", { campaignId: req.params.campaignId, emailId: req.params.emailId, toEmail: req.body.email || req.body.to });
  try {
    const emailId = parseInt(req.params.emailId, 10);
    const campaignId = parseInt(req.params.campaignId, 10);
    const toEmail = String(req.body.email || req.body.to || "").trim();
    
    console.log(`[Campaign Email Test] Starting: campaign=${campaignId}, email=${emailId}, to=${toEmail}`);
    
    if (!toEmail || !toEmail.includes("@")) {
      console.warn(`[Campaign Email Test] Invalid email: ${toEmail}`);
      return res.status(400).json({ error: "Zadejte platnou e-mailovou adresu pro test" });
    }
    
    // Get the campaign email and its template
    const emailRes = await pool.query(
      `SELECT ce.*, mt.subject AS template_subject, mt.preheader AS template_preheader, mt.html_content AS template_html, mt.blocks AS template_blocks, mt.header_options AS template_header_options
       FROM marketing_campaign_emails ce
       LEFT JOIN marketing_templates mt ON mt.id = ce.template_id
       WHERE ce.id = $1 AND ce.campaign_id = $2`,
      [emailId, campaignId]
    );
    
    if (emailRes.rows.length === 0) {
      console.warn(`[Campaign Email Test] Email not found: email=${emailId}, campaign=${campaignId}`);
      return res.status(404).json({ error: "E-mail kampaně nenalezen" });
    }
    
    const email = emailRes.rows[0];
    
    // Prefer live overrides from editor UI, fall back to DB
    const overrideBlocks = Array.isArray(req.body.blocks) && req.body.blocks.length > 0 ? req.body.blocks : null;
    const overrideSubject = req.body.subject || null;
    const overridePreheader = req.body.preheader !== undefined ? req.body.preheader : null;
    const overrideHeaderOptions = req.body.headerOptions || null;

    const finalSubject = overrideSubject || email.subject || email.template_subject || "Email kampaně";
    const finalPreheader = overridePreheader !== null ? overridePreheader : (email.preheader || email.template_preheader || "");
    const finalBlocks = overrideBlocks || email.blocks || email.template_blocks || [];
    const finalHeaderOptions = overrideHeaderOptions || email.header_options || email.template_header_options || {};

    let finalHtmlContent = req.body.htmlContent || "";
    if (!finalHtmlContent && Array.isArray(finalBlocks) && finalBlocks.length > 0) {
      finalHtmlContent = compileBlocksToHtml(finalBlocks);
    }
    if (!finalHtmlContent) {
      finalHtmlContent = email.html_content || email.template_html || "";
    }
    
    console.log(`[Campaign Email Test] Using: subject=${finalSubject}, hasHtml=${!!finalHtmlContent}`);
    
    // Use sendTestCustomEmail to actually send via Resend
    const { sendTestCustomEmail } = await import("../lib/marketing/sender.js");
    const result = await sendTestCustomEmail(
      {
        subject: finalSubject,
        preheader: finalPreheader,
        htmlContent: finalHtmlContent,
        headerOptions: finalHeaderOptions,
      },
      toEmail
    );
    
    if (!result.ok) {
      console.error(`[Campaign Email Test] Failed for ${emailId} to ${toEmail}: ${result.error}`);
      return res.status(500).json({ error: result.error || "Chyba při odesílání testovacího e-mailu" });
    }
    
    console.log(`[Campaign Email Test] Success: email ${emailId} sent to ${toEmail}`);
    await logMarketingAction("campaign_email.test_sent", req.session.userId || null, { type: "campaign_email", id: emailId }, { to: toEmail });
    res.json({ success: true });
  } catch (error) {
    console.error("Campaign email test send error:", error);
    res.status(500).json({ error: "Chyba při odesílání testovacího e-mailu: " + (error instanceof Error ? error.message : String(error)) });
  }
});

// Import freebie audience from CSV data
router.post("/admin/import-freebie-audience", requireAdmin, async (req: Request, res: Response) => {
  try {
    const emails: string[] = req.body.emails || [];
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "Žádné e-maily k importu" });
    }
    
    const insertPlaceholders = emails.map((_, i) => `($${i + 1})`).join(',');
    const result = await pool.query(
      `INSERT INTO subscribers (email, email_normalized, tags, marketing_consent, marketing_consent_source, first_source, imported_at, import_source)
       SELECT 
         email,
         LOWER(TRIM(email)) as email_normalized,
         ARRAY['freebie', 'imported', 'subscribed']::TEXT[] as tags,
         TRUE as marketing_consent,
         'import' as marketing_consent_source,
         'freebie_download' as first_source,
         NOW() as imported_at,
         'audience_export_d2f83d6160' as import_source
       FROM (VALUES ${insertPlaceholders}) AS import_data(email)
       WHERE NOT EXISTS (
         SELECT 1 FROM subscribers WHERE LOWER(email_normalized) = LOWER(import_data.email)
       )
       ON CONFLICT (email_normalized) DO UPDATE SET
         tags = ARRAY(SELECT DISTINCT unnest(ARRAY['freebie', 'imported', 'subscribed'] || subscribers.tags)),
         marketing_consent = TRUE
       WHERE subscribers.marketing_consent = FALSE
       RETURNING *`,
      emails
    );
    
    console.log(`[Marketing] Imported ${result.rows.length} freebie audience emails`);
    await logMarketingAction("audience.imported", req.session.userId || null, { type: "freebie_audience", count: result.rows.length });
    
    res.json({
      success: true,
      imported: result.rows.length,
      total: emails.length,
      message: `Importováno ${result.rows.length} nových e-mailů ze ${emails.length} poskytnutých`
    });
  } catch (error) {
    console.error("Freebie audience import error:", error);
    res.status(500).json({ error: "Chyba při importu audience" });
  }
});

// Start a campaign (populate queue and begin sending)
router.post("/campaigns/:id/start", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const { audience_segment, daily_send_limit } = req.body;
    
    // Get campaign
    const campaignRes = await pool.query(
      `SELECT id, status FROM marketing_campaigns WHERE id = $1`,
      [campaignId]
    );
    
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: "Kampaně nenalezena" });
    }
    
    const campaign = campaignRes.rows[0];
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: `Kampaň není ve stavu draft (stav: ${campaign.status}). Tuto kampaň nelze znovu spustit.` });
    }

    // Ensure campaign has at least one email step
    const emailCheckRes = await pool.query(
      `SELECT COUNT(*) FROM marketing_campaign_emails WHERE campaign_id = $1`,
      [campaignId]
    );
    if (parseInt(emailCheckRes.rows[0].count, 10) === 0) {
      return res.status(400).json({ error: "Přidejte alespoň jeden e-mail do sekvence kampaňe před spuštěním." });
    }

    // Build subscriber query by segment
    // 'paid'  = is_buyer = TRUE
    // 'free'  = is_buyer = FALSE (free downloaders, non-buyers)
    // 'mixed' = all active marketing subscribers
    const baseWhere = `marketing_consent = TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL`;
    let subscriberRes;
    if (audience_segment === 'paid') {
      subscriberRes = await pool.query(`SELECT id FROM subscribers WHERE ${baseWhere} AND is_buyer = TRUE`);
    } else if (audience_segment === 'free') {
      subscriberRes = await pool.query(`SELECT id FROM subscribers WHERE ${baseWhere} AND is_buyer = FALSE`);
    } else {
      subscriberRes = await pool.query(`SELECT id FROM subscribers WHERE ${baseWhere}`);
    }
    
    const subscribers = subscriberRes.rows;
    console.log(`[Marketing] Starting campaign ${campaignId} with ${subscribers.length} subscribers (segment: ${audience_segment})`);
    
    if (subscribers.length === 0) {
      return res.status(400).json({ error: `Segment '${audience_segment || 'mixed'}' nemá žádné aktivní příjemce` });
    }
    
    // Bulk-insert subscribers into send queue using UNNEST
    const subscriberIds: number[] = subscribers.map((s: any) => s.id);
    await pool.query(
      `INSERT INTO campaign_send_queue (campaign_id, subscriber_id)
       SELECT $1, UNNEST($2::int[])
       ON CONFLICT (campaign_id, subscriber_id) DO NOTHING`,
      [campaignId, subscriberIds]
    );
    
    // Create / update rate limit config
    const hourlyLimit = Math.max(1, Math.ceil((daily_send_limit || 85) / 24));
    await pool.query(
      `INSERT INTO campaign_rate_limits (campaign_id, daily_limit, hourly_limit)
       VALUES ($1, $2, $3)
       ON CONFLICT (campaign_id) DO UPDATE SET 
         daily_limit = $2, hourly_limit = $3`,
      [campaignId, daily_send_limit || 85, hourlyLimit]
    );
    
    // Update campaign
    const updatedRes = await pool.query(
      `UPDATE marketing_campaigns 
       SET status = 'active', 
           audience_segment = $1,
           daily_send_limit = $2,
           hourly_send_limit = $3,
           total_recipients = $4,
           campaign_started_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [audience_segment, daily_send_limit || 85, hourlyLimit, subscribers.length, campaignId]
    );
    
    await logMarketingAction("campaign.started", req.session.userId || null, { 
      type: "campaign", 
      id: campaignId, 
      recipients: subscribers.length,
      segment: audience_segment
    });
    
    const estimatedDays = Math.ceil(subscribers.length / (daily_send_limit || 85));
    res.json({
      success: true,
      campaign: updatedRes.rows[0],
      recipients: subscribers.length,
      estimatedDays,
      message: `Kampaň spustěna! E-mail bude odeslán ${subscribers.length.toLocaleString('cs-CZ')} příjemci (přibližně za ${estimatedDays} dní při limitu ${daily_send_limit || 85}/den).`
    });
  } catch (error) {
    console.error("Campaign start error:", error);
    res.status(500).json({ error: "Chyba při spouštění kampaňě: " + (error instanceof Error ? error.message : String(error)) });
  }
});

// Get campaign queue status
router.get("/campaigns/:id/queue-status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    
    const statsRes = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'queued') as queued,
         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
         COUNT(*) FILTER (WHERE status = 'sent') as sent,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) as total
       FROM campaign_send_queue
       WHERE campaign_id = $1`,
      [campaignId]
    );
    
    const rateLimitRes = await pool.query(
      `SELECT daily_limit, hourly_limit, current_hour_sent, current_day_sent
       FROM campaign_rate_limits
       WHERE campaign_id = $1`,
      [campaignId]
    );
    
    const stats = statsRes.rows[0];
    const rateLimit = rateLimitRes.rows[0];
    
    res.json({
      queue: stats,
      rateLimit: rateLimit,
      progress: {
        percentage: Math.round((stats.sent / stats.total) * 100),
        sent: stats.sent,
        total: stats.total
      }
    });
  } catch (error) {
    console.error("Queue status error:", error);
    res.status(500).json({ error: "Chyba při načítání stavu front" });
  }
});

// Pause campaign
router.patch("/campaigns/:id/pause", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const { pauseUntil } = req.body;
    
    const result = await pool.query(
      `UPDATE marketing_campaigns
       SET paused_until = $1
       WHERE id = $2
       RETURNING *`,
      [pauseUntil ? new Date(pauseUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000), campaignId]
    );
    
    await logMarketingAction("campaign.paused", req.session.userId || null, { type: "campaign", id: campaignId });
    res.json({ success: true, campaign: result.rows[0] });
  } catch (error) {
    console.error("Campaign pause error:", error);
    res.status(500).json({ error: "Chyba při pozastavení kampaně" });
  }
});

// Resume campaign
router.patch("/campaigns/:id/resume", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    
    const result = await pool.query(
      `UPDATE marketing_campaigns
       SET paused_until = NULL
       WHERE id = $1
       RETURNING *`,
      [campaignId]
    );
    
    await logMarketingAction("campaign.resumed", req.session.userId || null, { type: "campaign", id: campaignId });
    res.json({ success: true, campaign: result.rows[0] });
  } catch (error) {
    console.error("Campaign resume error:", error);
    res.status(500).json({ error: "Chyba při obnovení kampaně" });
  }
});

// Delete a campaign
router.delete("/campaigns/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    
    // Check campaign status - only allow deletion of draft campaigns
    const campaignRes = await pool.query(
      "SELECT status FROM marketing_campaigns WHERE id = $1",
      [campaignId]
    );
    
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: "Kampaně nenalezena" });
    }
    
    const campaign = campaignRes.rows[0];
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: "Lze mazat pouze kampaňě v návrhu" });
    }
    
    // Delete campaign (cascade will handle related records)
    await pool.query(
      "DELETE FROM marketing_campaigns WHERE id = $1",
      [campaignId]
    );
    
    await logMarketingAction("campaign.deleted", req.session.userId || null, { type: "campaign", id: campaignId });
    res.json({ success: true });
  } catch (error) {
    console.error("Campaign delete error:", error);
    res.status(500).json({ error: "Chyba při mazání kampaně" });
  }
});

// Get email activity logs (transactional + campaign emails sent)
router.get("/email-activity", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { days = 7, journeyId, emailType, status, limit = 100, offset = 0 } = req.query;
    const daysNum = parseInt(String(days), 10) || 7;
    const limitNum = Math.min(parseInt(String(limit), 10) || 100, 500);
    const offsetNum = parseInt(String(offset), 10) || 0;

    let whereConditions = ["mes.sent_at > NOW() - ($1::text || ' days')::interval"];
    const params: any[] = [daysNum];

    if (journeyId) {
      whereConditions.push(`mj.id = $${params.length + 1}`);
      params.push(parseInt(String(journeyId), 10));
    }

    if (emailType && emailType !== "all") {
      whereConditions.push(`mes.email_type = $${params.length + 1}`);
      params.push(String(emailType));
    }

    if (status && status !== "all") {
      whereConditions.push(`mes.status = $${params.length + 1}`);
      params.push(String(status));
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count
    const countRes = await pool.query(
      `SELECT COUNT(*) as total FROM marketing_email_sends mes
       LEFT JOIN marketing_journeys mj ON mes.journey_id = mj.id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.total || 0, 10);

    // Get emails with engagement stats
    const emailsRes = await pool.query(
      `SELECT
         mes.id,
         mes.recipient,
         mes.subject,
         mes.email_type,
         COALESCE(mj.name, 'N/A') as journey_name,
         mes.status,
         mes.sent_at,
         COUNT(DISTINCT meo.id) FILTER (WHERE meo.event_type = 'open') as open_count,
         COUNT(DISTINCT meo.id) FILTER (WHERE meo.event_type = 'click') as click_count,
         COUNT(DISTINCT meo.id) FILTER (WHERE meo.event_type = 'unsubscribe') as unsubscribe_count
       FROM marketing_email_sends mes
       LEFT JOIN marketing_journeys mj ON mes.journey_id = mj.id
       LEFT JOIN marketing_email_events meo ON mes.id = meo.email_send_id
       WHERE ${whereClause}
       GROUP BY mes.id, mes.recipient, mes.subject, mes.email_type, mj.name, mes.status, mes.sent_at
       ORDER BY mes.sent_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offsetNum]
    );

    // Get stats
    const statsRes = await pool.query(
      `SELECT
         COUNT(*) as total_sent,
         COUNT(*) FILTER (WHERE status = 'sent') as successful,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(DISTINCT CASE WHEN meo.event_type = 'open' THEN mes.id END) as opened,
         COUNT(DISTINCT CASE WHEN meo.event_type = 'click' THEN mes.id END) as clicked,
         COUNT(DISTINCT CASE WHEN meo.event_type = 'unsubscribe' THEN mes.id END) as unsubscribed
       FROM marketing_email_sends mes
       LEFT JOIN marketing_email_events meo ON mes.id = meo.email_send_id
       WHERE ${whereClause}`,
      params
    );

    const stats = statsRes.rows[0];
    const successRate = stats.total_sent > 0 ? Math.round((stats.successful / stats.total_sent) * 100) : 0;
    const openRate = stats.total_sent > 0 ? Math.round((stats.opened / stats.total_sent) * 100) : 0;
    const clickRate = stats.total_sent > 0 ? Math.round((stats.clicked / stats.total_sent) * 100) : 0;

    res.json({
      emails: emailsRes.rows,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
      stats: {
        totalSent: parseInt(stats.total_sent, 10),
        successful: parseInt(stats.successful, 10),
        failed: parseInt(stats.failed, 10),
        opened: parseInt(stats.opened, 10),
        clicked: parseInt(stats.clicked, 10),
        unsubscribed: parseInt(stats.unsubscribed, 10),
        successRate,
        openRate,
        clickRate,
      },
    });
  } catch (error) {
    console.error("Email activity error:", error);
    res.status(500).json({ error: "Chyba při načítání aktivity e-mailů" });
  }
});

// Get available journeys for filtering
router.get("/email-activity/journeys", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const res_journeys = await pool.query(
      `SELECT id, name FROM marketing_journeys ORDER BY name ASC`
    );
    res.json(res_journeys.rows);
  } catch (error) {
    console.error("Error fetching journeys:", error);
    res.status(500).json({ error: "Chyba při načítání cest" });
  }
});

// [DEV ONLY] Create sample email sends for testing dashboard
router.post("/email-activity/test-data", requireAdmin, async (_req: Request, res: Response) => {
  try {
    // Get or create test subscriber
    const subRes = await pool.query(
      `INSERT INTO subscribers (email, source) VALUES ($1, 'test') 
       ON CONFLICT(email) DO UPDATE SET email = EXCLUDED.email 
       RETURNING id`,
      ['test@example.cz']
    );
    const subscriberId = subRes.rows[0].id;

    // Get journeys
    const journeysRes = await pool.query('SELECT id, name FROM marketing_journeys LIMIT 3');
    const journeys = journeysRes.rows;

    let created = 0;
    
    // Create 20 sample email sends for the past 7 days
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const sentAt = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);
      const journey = journeys[Math.floor(Math.random() * journeys.length)];
      const isSuccessful = Math.random() > 0.1; // 90% success rate

      await pool.query(
        `INSERT INTO marketing_email_sends (subscriber_id, journey_id, email_type, recipient, subject, status, sent_at)
         VALUES ($1, $2, 'transactional', $3, $4, $5, $6)`,
        [
          subscriberId,
          journey?.id || null,
          `test-${i}@example.cz`,
          `Testovací e-mail #${i} - ${journey?.name || 'Bez cesty'}`,
          isSuccessful ? 'sent' : 'failed',
          sentAt
        ]
      );
      created++;

      // Add some engagement events for sent emails
      if (isSuccessful && Math.random() > 0.5) {
        const lastEmailRes = await pool.query(
          'SELECT id FROM marketing_email_sends WHERE recipient = $1 ORDER BY id DESC LIMIT 1',
          [`test-${i}@example.cz`]
        );
        if (lastEmailRes.rows.length > 0) {
          const emailSendId = lastEmailRes.rows[0].id;
          if (Math.random() > 0.3) {
            await pool.query(
              `INSERT INTO marketing_email_events (email_send_id, event_type) VALUES ($1, 'open')`,
              [emailSendId]
            );
          }
          if (Math.random() > 0.6) {
            await pool.query(
              `INSERT INTO marketing_email_events (email_send_id, event_type) VALUES ($1, 'click')`,
              [emailSendId]
            );
          }
        }
      }
    }

    res.json({ success: true, created, message: `Vytvořeno ${created} testovacích e-mailů` });
  } catch (error) {
    console.error("Error creating test data:", error);
    res.status(500).json({ error: "Chyba při vytváření testovacích dat" });
  }
});

export default router;
