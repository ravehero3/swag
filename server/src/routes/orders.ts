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
    res.json(result.rows);
  } catch (error) {
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

    sendBankTransferInstructionsEmail(orderId).catch((err) => {
      console.error("[Email] Bank transfer instructions email error:", err);
    });

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

    sendContractEmail(orderId).catch((err) => {
      console.error("[Email] Free download email error:", err);
    });

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
        sendContractEmail(orderId).catch((err) => {
          console.error("[Email] Contract email error:", err);
        });
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
