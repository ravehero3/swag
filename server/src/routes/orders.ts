import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { sendContractEmail, sendBankTransferInstructionsEmail } from "../email.js";

export const BANK_TRANSFER_DETAILS = {
  accountNumber: "2845557133/0800",
  bankName: "Česká spořitelna",
  currency: "CZK",
  holderName: "VOODOO808",
};

// ── GoPay return-URL helpers ─────────────────────────────────────────────────
//
// GoPay validates return_url / notify_url against the "URL prodejního místa"
// whitelist in the merchant portal.  The most common mismatch is www vs non-www
// (e.g. APP_URL = "https://www.voodoo808.com" but GoPay registered without www).
//
// Strategy:
//  1. If GOPAY_RETURN_DOMAIN is set, use it unconditionally — no probing needed.
//  2. Otherwise build the domain from APP_URL / Replit env vars.
//  3. On a payment attempt: if GoPay returns error 111 on return_url, automatically
//     retry with the www ↔ non-www alternative and cache the winner in memory.
//     The cache resets on server restart; this is fine because probing only costs
//     one extra createPayment call the first time there is a www mismatch.

let _gopayWorkingDomain: string | null = null;  // in-process cache

export function normaliseDomain(raw: string): string {
  let d = raw.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(d)) d = `https://${d}`;
  return d;
}

export function buildBaseDomain(): string {
  // GOPAY_RETURN_DOMAIN — explicit override for the return/notify URL base.
  // Set this in Vercel env vars to exactly the domain registered in GoPay portal.
  if (process.env.GOPAY_RETURN_DOMAIN) return normaliseDomain(process.env.GOPAY_RETURN_DOMAIN);

  // Use the cached working domain from a previous successful payment
  if (_gopayWorkingDomain) return _gopayWorkingDomain;

  const raw = process.env.APP_URL ||
    (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0].trim()}` : null) ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null) ||
    "http://localhost:5000";
  return normaliseDomain(raw);
}

/** Return the www ↔ non-www alternative of a domain string. */
function alternativeDomain(domain: string): string {
  if (domain.includes("://www.")) return domain.replace("://www.", "://");
  const proto = domain.startsWith("https") ? "https" : "http";
  const host = domain.replace(/^https?:\/\//, "");
  return `${proto}://www.${host}`;
}

function isError111(response: any): boolean {
  const s = typeof response === "string" ? response : JSON.stringify(response ?? "");
  return s.includes('"error_code":111') || s.includes('"error_code": 111');
}

/**
 * Try to create a GoPay payment, automatically falling back to the www/non-www
 * domain variant if GoPay returns error 111 (return_url not whitelisted).
 * Caches the winning domain for subsequent payments.
 */
async function createGoPayPaymentWithFallback(
  gopay: any,
  basePaymentData: Record<string, any>,
  primaryDomain: string,
  orderId: number,
): Promise<{ payment: any; domain: string; triedVariants: string[] }> {
  const variants = [primaryDomain, alternativeDomain(primaryDomain)];
  const triedVariants: string[] = [];

  for (const domain of variants) {
    const returnUrl = `${domain}/platba-status?orderId=${orderId}`;
    const notifyUrl = `${domain}/api/orders/${orderId}/notify`;
    const paymentData = { ...basePaymentData, return_url: returnUrl, notify_url: notifyUrl };

    console.log(`[GoPay] Trying return_url="${returnUrl}"`);
    triedVariants.push(domain);

    const payment = await gopay.createPayment(paymentData);
    console.log(`[GoPay] createPayment response (domain=${domain}):`, JSON.stringify(payment));

    if (payment && typeof payment === "object" && payment.gw_url) {
      // Success — cache the working domain so we skip the probe next time
      _gopayWorkingDomain = domain;
      console.log(`[GoPay] Working domain cached: ${domain}`);
      return { payment, domain, triedVariants };
    }

    if (!isError111(payment)) {
      // Different error — no point trying alternative domain
      return { payment, domain, triedVariants };
    }

    console.log(`[GoPay] error 111 on domain=${domain}, trying alternative…`);
  }

  // Both variants failed with error 111
  const lastDomain = variants[variants.length - 1];
  const payment = await gopay.createPayment({
    ...basePaymentData,
    return_url: `${lastDomain}/platba-status?orderId=${orderId}`,
    notify_url: `${lastDomain}/api/orders/${orderId}/notify`,
  });
  return { payment, domain: lastDomain, triedVariants };
}
// ────────────────────────────────────────────────────────────────────────────

const router = Router();

router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání objednávek" });
  }
});

router.get("/my", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.session.userId]
    );

    // For paid orders, attach the current download URL for each item so the
    // account page can show a "Stáhnout" link (Google Drive URL or signed B2 URL).
    const orders = result.rows;
    const isPaid = (status: string) => status === "completed" || status === "paid";

    // Collect all (productType, productId) pairs we need to look up.
    const beatIds = new Set<number>();
    const kitIds = new Set<number>();
    for (const o of orders) {
      if (!isPaid(o.status)) continue;
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        if (!it || !it.productId) continue;
        if (it.productType === "beat") beatIds.add(Number(it.productId));
        else if (it.productType === "sound_kit" || it.productType === "kit") kitIds.add(Number(it.productId));
      }
    }

    const beatMap = new Map<number, { file_url: string; trackout_url: string | null; artwork_url: string | null; title: string }>();
    if (beatIds.size > 0) {
      const r = await pool.query(
        "SELECT id, title, file_url, trackout_url, artwork_url FROM beats WHERE id = ANY($1::int[])",
        [Array.from(beatIds)]
      );
      for (const row of r.rows) beatMap.set(row.id, row);
    }

    const kitMap = new Map<number, { file_url: string; artwork_url: string | null; title: string }>();
    if (kitIds.size > 0) {
      const r = await pool.query(
        "SELECT id, title, file_url, artwork_url FROM sound_kits WHERE id = ANY($1::int[])",
        [Array.from(kitIds)]
      );
      for (const row of r.rows) kitMap.set(row.id, row);
    }

    // Helper: given a stored file_url (Google Drive URL, full http URL, or B2 key),
    // return the URL the customer should use to access the file.
    async function resolveDownload(fileUrl: string | null | undefined): Promise<string | null> {
      if (!fileUrl) return null;
      // External URL (Google Drive, Dropbox, etc.) — return as-is
      if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
      // Local public path
      if (fileUrl.startsWith("/")) return fileUrl;
      // Otherwise treat as a B2 ZIP key — generate a fresh signed URL (legacy)
      try {
        const { generateDownloadUrl, STORAGE_BUCKETS } = await import("../lib/storage.js");
        return await generateDownloadUrl(STORAGE_BUCKETS.ZIPS, fileUrl, 7 * 24 * 60 * 60);
      } catch {
        return null;
      }
    }

    const enriched = await Promise.all(
      orders.map(async (o: any) => {
        if (!isPaid(o.status)) return o;
        const items = Array.isArray(o.items) ? o.items : [];
        const itemsOut = await Promise.all(
          items.map(async (it: any) => {
            if (!it || !it.productId) return it;
            let product: any = null;
            let trackoutUrl: string | null = null;
            if (it.productType === "beat") {
              product = beatMap.get(Number(it.productId));
              trackoutUrl = product ? product.trackout_url : null;
            } else if (it.productType === "sound_kit" || it.productType === "kit") {
              product = kitMap.get(Number(it.productId));
            }
            const downloadUrl = product ? await resolveDownload(product.file_url) : null;
            const trackoutDownloadUrl = trackoutUrl ? await resolveDownload(trackoutUrl) : null;
            return {
              ...it,
              artwork_url: product?.artwork_url || it.artwork_url || null,
              downloadUrl,
              trackoutDownloadUrl,
            };
          })
        );
        return { ...o, items: itemsOut };
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error("Orders fetch error:", error);
    res.status(500).json({ error: "Chyba při načítání objednávek" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, items, buyerLegalName, buyerArtistName, buyerAddress, paymentMethod, promoCode } = req.body;
    const userId = req.session.userId || null;
    const method = paymentMethod === "bank_transfer" ? "bank_transfer" : paymentMethod === "free" ? "free" : "gopay";

    const rawItems: any[] = Array.isArray(items) ? items : [];
    const rawTotal = rawItems.reduce((sum: number, it: any) => sum + (Number(it.price) || 0), 0);

    let discountPercent = 0;
    let appliedPromoCode: string | null = null;

    if (promoCode && typeof promoCode === "string" && promoCode.trim().length > 0) {
      const promoRes = await pool.query(
        "SELECT discount_percent FROM promo_codes WHERE UPPER(code) = UPPER($1) AND is_active = true",
        [promoCode.trim()]
      );
      if (promoRes.rows.length > 0) {
        discountPercent = promoRes.rows[0].discount_percent;
        appliedPromoCode = promoCode.trim().toUpperCase();
      }
    }

    const finalTotal = Math.round(rawTotal * (1 - discountPercent / 100) * 100) / 100;

    const result = await pool.query(
      `INSERT INTO orders (user_id, email, items, total, status, buyer_legal_name, buyer_artist_name, buyer_address, payment_method, promo_code, discount_percent)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, email, JSON.stringify(rawItems), finalTotal, buyerLegalName || null, buyerArtistName || null, buyerAddress || null, method, appliedPromoCode, discountPercent]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Chyba při vytváření objednávky" });
  }
});

router.post("/:id/pay", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.session?.userId || null;

    const orderResult = userId
      ? await pool.query("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [orderId, userId])
      : await pool.query("SELECT * FROM orders WHERE id = $1 AND user_id IS NULL", [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Objednávka nenalezena" });
    }

    const order = orderResult.rows[0];

    if (order.status === "completed" || order.status === "paid") {
      return res.status(400).json({ error: "Objednávka je již zaplacena" });
    }

    const clientId = process.env.GOPAY_CLIENT_ID;
    const clientSecret = process.env.GOPAY_CLIENT_SECRET;
    const goId = process.env.GOPAY_GOID;

    if (!clientId || !clientSecret || !goId) {
      return res.status(503).json({
        error: "Platební brána není nakonfigurována. Kontaktujte prosím správce."
      });
    }

    const { GoPay } = await import("gopay-nodejs");
    const isSandbox = process.env.GOPAY_SANDBOX === "true" || process.env.NODE_ENV !== "production";
    console.log(`[GoPay] mode=${isSandbox ? "SANDBOX" : "PRODUCTION"} NODE_ENV=${process.env.NODE_ENV} GOPAY_SANDBOX=${process.env.GOPAY_SANDBOX}`);
    const gopay = new GoPay(clientId, clientSecret, isSandbox);

    const primaryDomain = buildBaseDomain();
    console.log(`[GoPay] primary domain="${primaryDomain}" (GOPAY_RETURN_DOMAIN=${process.env.GOPAY_RETURN_DOMAIN || "not set"} APP_URL=${process.env.APP_URL || "not set"})`);

    const items: Array<{ name: string; amount: number; count: number }> = [];
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        items.push({ name: item.title || "Produkt", amount: Math.round(Number(item.price) * 100), count: 1 });
      }
    }
    if (items.length === 0) {
      items.push({ name: `Objednávka #${order.id}`, amount: Math.round(Number(order.total) * 100), count: 1 });
    }

    const basePaymentData = {
      payer: { contact: { email: order.email } },
      target: { type: "ACCOUNT", goid: parseInt(goId, 10) },
      amount: Math.round(Number(order.total) * 100),
      currency: "CZK",
      order_number: String(order.id),
      order_description: `Objednávka #${order.id}`,
      items,
      lang: "CS",
    };

    const { payment, domain: workingDomain, triedVariants } = await createGoPayPaymentWithFallback(
      gopay, basePaymentData, primaryDomain, order.id
    );

    if (payment && typeof payment === "object" && payment.gw_url) {
      if (payment.id) {
        await pool.query("UPDATE orders SET gopay_payment_id = $1 WHERE id = $2", [payment.id, order.id]);
      }
      return res.json({ gw_url: payment.gw_url, payment_id: payment.id });
    }

    const detail = typeof payment === "string" ? payment : JSON.stringify(payment);
    console.error("[GoPay] Payment creation failed. Tried variants:", triedVariants, "Response:", detail);

    // Build a helpful error message explaining what to do about error 111
    let userError = "Nepodařilo se vytvořit platbu. Zkuste to prosím znovu.";
    let guidance = "";
    if (isError111(payment)) {
      guidance = `Chyba 111 (return_url): GoPay odmítl tyto URL jako newhitelistované: ${triedVariants.map(v => v + "/platba-status").join(", ")}. ` +
        `Nastavte proměnnou GOPAY_RETURN_DOMAIN na přesnou doménu, která je zaregistrována v GoPay portálu ` +
        `(https://gate.gopay.cz/gopay-partner/ → Nastavení → URL prodejního místa). ` +
        `Příklad: GOPAY_RETURN_DOMAIN=https://www.voodoo808.com`;
    }
    return res.status(500).json({ error: userError, gopayDetail: detail, guidance: guidance || undefined });
  } catch (error) {
    console.error("GoPay payment error:", error);
    res.status(500).json({ error: "Chyba při vytváření platby" });
  }
});

// Allow customer to retry payment on a cancelled/failed order.
// Resets the order to pending, clears the old GoPay payment ID, and creates
// a fresh GoPay payment. Uses a suffixed order_number so GoPay accepts it.
router.post("/:id/retry-payment", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: "Invalid order ID" });

    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Objednávka nenalezena" });
    }

    const order = orderResult.rows[0];

    if (order.status === "completed" || order.status === "paid") {
      return res.status(400).json({ error: "Objednávka je již zaplacena" });
    }

    if (Number(order.total) <= 0) {
      return res.status(400).json({ error: "Tuto objednávku nelze znovu zaplatit" });
    }

    const clientId = process.env.GOPAY_CLIENT_ID;
    const clientSecret = process.env.GOPAY_CLIENT_SECRET;
    const goId = process.env.GOPAY_GOID;

    if (!clientId || !clientSecret || !goId) {
      return res.status(503).json({ error: "Platební brána není nakonfigurována." });
    }

    // Reset order back to pending before creating a new payment
    await pool.query(
      "UPDATE orders SET status = 'pending', gopay_payment_id = NULL WHERE id = $1",
      [orderId]
    );

    const { GoPay } = await import("gopay-nodejs");
    const isSandbox = process.env.GOPAY_SANDBOX === "true" || process.env.NODE_ENV !== "production";
    const gopay = new GoPay(clientId, clientSecret, isSandbox);

    const primaryDomain = buildBaseDomain();

    const items: Array<{ name: string; amount: number; count: number }> = [];
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        items.push({ name: item.title || "Produkt", amount: Math.round(Number(item.price) * 100), count: 1 });
      }
    }
    if (items.length === 0) {
      items.push({ name: `Objednávka #${order.id}`, amount: Math.round(Number(order.total) * 100), count: 1 });
    }

    // Suffix order_number with timestamp so GoPay doesn't reject it as a duplicate
    const retryOrderNumber = `${order.id}-r${Date.now()}`;

    const basePaymentData = {
      payer: { contact: { email: order.email } },
      target: { type: "ACCOUNT", goid: parseInt(goId, 10) },
      amount: Math.round(Number(order.total) * 100),
      currency: "CZK",
      order_number: retryOrderNumber,
      order_description: `Objednávka #${order.id} (opakovaná platba)`,
      items,
      lang: "CS",
    };

    const { payment, triedVariants } = await createGoPayPaymentWithFallback(
      gopay, basePaymentData, primaryDomain, order.id
    );
    console.log(`[GoPay] retry-payment order=${orderId} response:`, JSON.stringify(payment));

    if (payment && typeof payment === "object" && payment.gw_url) {
      if (payment.id) {
        await pool.query("UPDATE orders SET gopay_payment_id = $1 WHERE id = $2", [payment.id, order.id]);
      }
      return res.json({ gw_url: payment.gw_url, payment_id: payment.id });
    }

    const detail = typeof payment === "string" ? payment : JSON.stringify(payment);
    console.error("[GoPay] retry-payment failed. Tried:", triedVariants, "Response:", detail);
    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [orderId]);

    let guidance = "";
    if (isError111(payment)) {
      guidance = `Chyba 111: GoPay odmítl URL ${triedVariants.map(v => v + "/platba-status").join(", ")}. Nastavte GOPAY_RETURN_DOMAIN.`;
    }
    return res.status(500).json({ error: "Nepodařilo se znovu vytvořit platbu.", gopayDetail: detail, guidance: guidance || undefined });
  } catch (error) {
    console.error("retry-payment error:", error);
    res.status(500).json({ error: "Chyba při opakování platby" });
  }
});

router.post("/:id/bank-transfer", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const userId = req.session?.userId || null;

    const orderResult = userId
      ? await pool.query("SELECT * FROM orders WHERE id = $1 AND user_id = $2", [orderId, userId])
      : await pool.query("SELECT * FROM orders WHERE id = $1 AND user_id IS NULL", [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Objednávka nenalezena" });
    }

    const order = orderResult.rows[0];

    if (order.status === "completed" || order.status === "paid") {
      return res.status(400).json({ error: "Objednávka je již zaplacena" });
    }

    await pool.query(
      "UPDATE orders SET status = 'awaiting_payment', payment_method = 'bank_transfer' WHERE id = $1",
      [orderId]
    );

    try {
      await sendBankTransferInstructionsEmail(orderId);
    } catch (err) {
      console.error("[Email] Bank transfer instructions email error:", err);
    }

    return res.json({
      success: true,
      orderId: order.id,
      variableSymbol: String(order.id),
      amount: Number(order.total),
      ...BANK_TRANSFER_DETAILS,
      messageForRecipient: `VOODOO808 ${order.id}`,
    });
  } catch (error) {
    console.error("Bank transfer error:", error);
    res.status(500).json({ error: "Chyba při zpracování bankovního převodu" });
  }
});

router.post("/:id/claim-free", requireAuth, async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);

    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, req.session.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Objednávka nenalezena" });
    }

    const order = orderResult.rows[0];

    if (Number(order.total) > 0) {
      return res.status(400).json({ error: "Tato objednávka není zdarma" });
    }

    await pool.query(
      "UPDATE orders SET status = 'completed' WHERE id = $1",
      [orderId]
    );

    try {
      await sendContractEmail(orderId);
    } catch (err) {
      console.error("[Email] Free download email error:", err);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Claim free error:", error);
    res.status(500).json({ error: "Chyba při zpracování" });
  }
});

router.get("/:id/status", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: "Invalid order ID" });

    const result = await pool.query(
      "SELECT id, status, total, items, email, created_at FROM orders WHERE id = $1",
      [orderId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Objednávka nenalezena" });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Chyba při načítání stavu objednávky" });
  }
});

// Actively query GoPay for the current payment status and sync it to the DB.
// Called by the PaymentStatus page when the customer returns from the gateway.
router.post("/:id/check-payment", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: "Invalid order ID" });

    const result = await pool.query(
      "SELECT id, status, gopay_payment_id FROM orders WHERE id = $1",
      [orderId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Objednávka nenalezena" });

    const order = result.rows[0];

    // Already finalised — return current status immediately
    if (order.status === "completed" || order.status === "paid" || order.status === "cancelled") {
      return res.json({ status: order.status, source: "db" });
    }

    // No GoPay payment ID stored yet — nothing to query
    if (!order.gopay_payment_id) {
      return res.json({ status: order.status, source: "db", note: "no_gopay_id" });
    }

    const clientId = process.env.GOPAY_CLIENT_ID;
    const clientSecret = process.env.GOPAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.json({ status: order.status, source: "db", note: "gopay_not_configured" });
    }

    const { GoPay } = await import("gopay-nodejs");
    const isSandbox = process.env.GOPAY_SANDBOX === "true" || process.env.NODE_ENV !== "production";
    const gopay = new GoPay(clientId, clientSecret, isSandbox);

    const gopayStatus = await gopay.getStatus(order.gopay_payment_id);
    console.log(`[GoPay] check-payment order=${orderId} payment=${order.gopay_payment_id} state=${gopayStatus?.state}`);

    if (!gopayStatus || typeof gopayStatus !== "object") {
      return res.json({ status: order.status, source: "db", note: "gopay_query_failed" });
    }

    // Map GoPay states to our order status
    const gopayState: string = gopayStatus.state || "";
    let newStatus: string | null = null;

    if (gopayState === "PAID") {
      newStatus = "completed";
    } else if (gopayState === "PAYMENT_METHOD_CHOSEN" || gopayState === "AUTHORIZED") {
      newStatus = "pending"; // still processing, no change needed
    } else if (gopayState === "CANCELED" || gopayState === "TIMEOUTED" || gopayState === "REFUNDED") {
      newStatus = "cancelled";
    }

    if (newStatus && newStatus !== order.status && newStatus !== "pending") {
      await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [newStatus, orderId]);
      console.log(`[GoPay] check-payment updated order=${orderId} to status=${newStatus}`);

      if (newStatus === "completed") {
        try {
          const { sendContractEmail } = await import("../email.js");
          await sendContractEmail(orderId);
        } catch (err) {
          console.error("[GoPay] check-payment email error:", err);
        }
      }
    }

    return res.json({
      status: newStatus ?? order.status,
      gopayState,
      source: "gopay",
    });
  } catch (error) {
    console.error("check-payment error:", error);
    res.status(500).json({ error: "Chyba při ověřování platby" });
  }
});

router.post("/:id/notify", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { id: paymentId } = req.body;

    const clientId = process.env.GOPAY_CLIENT_ID;
    const clientSecret = process.env.GOPAY_CLIENT_SECRET;

    if (clientId && clientSecret) {
      const { GoPay } = await import("gopay-nodejs");
      const isSandbox = process.env.NODE_ENV !== "production";
      const gopay = new GoPay(clientId, clientSecret, isSandbox);
      const status = await gopay.getStatus(paymentId);

      if (status && status.state === "PAID") {
        await pool.query(
          "UPDATE orders SET status = 'completed' WHERE id = $1",
          [orderId]
        );
        try {
          await sendContractEmail(orderId);
        } catch (err) {
          console.error("[Email] Contract email error:", err);
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("GoPay notify error:", error);
    res.status(200).send("OK");
  }
});

router.delete("/:id/cancel", requireAuth, async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id, 10);

    const orderResult = await pool.query(
      "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, req.session.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Objednávka nenalezena" });
    }

    const order = orderResult.rows[0];
    const cancelableStatuses = ["pending", "awaiting_payment"];

    if (!cancelableStatuses.includes(order.status)) {
      return res.status(400).json({ error: "Tuto objednávku nelze zrušit — již byla zaplacena nebo zpracována." });
    }

    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [orderId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Chyba při rušení objednávky" });
  }
});

router.put("/:id/status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    const updatedOrder = result.rows[0];
    if (!updatedOrder) return res.status(404).json({ error: "Objednávka nenalezena" });
    if (status === "completed" || status === "paid") {
      try {
        await sendContractEmail(updatedOrder.id);
      } catch (err) {
        console.error("[Email] Contract email on admin approval error:", err);
      }
    }
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: "Chyba při aktualizaci objednávky" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query("DELETE FROM orders WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Objednávka nenalezena" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Chyba při mazání objednávky" });
  }
});

export default router;
