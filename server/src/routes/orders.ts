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
    const { email, items, total, buyerLegalName, buyerArtistName, buyerAddress, paymentMethod } = req.body;
    const userId = req.session.userId || null;
    const method = paymentMethod === "bank_transfer" ? "bank_transfer" : "gopay";

    const result = await pool.query(
      `INSERT INTO orders (user_id, email, items, total, status, buyer_legal_name, buyer_artist_name, buyer_address, payment_method)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8) RETURNING *`,
      [userId, email, JSON.stringify(items), total, buyerLegalName || null, buyerArtistName || null, buyerAddress || null, method]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Chyba při vytváření objednávky" });
  }
});

router.post("/:id/pay", requireAuth, async (req: Request, res: Response) => {
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
    const isSandbox = process.env.NODE_ENV !== "production";
    const gopay = new GoPay(clientId, clientSecret, isSandbox);

    const domain = process.env.APP_URL ||
      (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");

    const items: Array<{ name: string; amount: number; count: number }> = [];
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        items.push({
          name: item.title || "Produkt",
          amount: Math.round(Number(item.price) * 100),
          count: 1,
        });
      }
    }

    if (items.length === 0) {
      items.push({
        name: `Objednávka #${order.id}`,
        amount: Math.round(Number(order.total) * 100),
        count: 1,
      });
    }

    const paymentData = {
      payer: {
        contact: { email: order.email },
      },
      target: {
        type: "ACCOUNT",
        goid: parseInt(goId, 10),
      },
      amount: Math.round(Number(order.total) * 100),
      currency: "CZK",
      order_number: String(order.id),
      order_description: `Objednávka #${order.id}`,
      items,
      return_url: `${domain}/ucet`,
      notify_url: `${domain}/api/orders/${order.id}/notify`,
      lang: "CS",
    };

    const payment = await gopay.createPayment(paymentData);

    if (payment && payment.gw_url) {
      return res.json({ gw_url: payment.gw_url, payment_id: payment.id });
    }

    return res.status(500).json({ error: "Nepodařilo se vytvořit platbu. Zkuste to prosím znovu." });
  } catch (error) {
    console.error("GoPay payment error:", error);
    res.status(500).json({ error: "Chyba při vytváření platby" });
  }
});

router.post("/:id/bank-transfer", requireAuth, async (req: Request, res: Response) => {
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

router.put("/:id/status", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    res.json(result.rows[0]);
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
