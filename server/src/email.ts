import nodemailer from "nodemailer";
import { pool } from "./db.js";

function formatDateCzech(date: Date): string {
  const day = date.getDate();
  const months = [
    "ledna", "února", "března", "dubna", "května", "června",
    "července", "srpna", "září", "října", "listopadu", "prosince"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

function formatPriceCzech(amount: number): string {
  return amount.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " Kč";
}

export function fillContractTemplate(
  template: string,
  data: {
    datum: string;
    pravniJmeno: string;
    umeleckeJmeno: string;
    adresa: string;
    beatNazev: string;
    cena: string;
  }
): string {
  return template
    .replace(/\{\{DATUM\}\}/g, data.datum)
    .replace(/\{\{PRAVNI_JMENO\}\}/g, data.pravniJmeno)
    .replace(/\{\{UMELECKE_JMENO\}\}/g, data.umeleckeJmeno)
    .replace(/\{\{ADRESA\}\}/g, data.adresa)
    .replace(/\{\{BEAT_NAZEV\}\}/g, data.beatNazev)
    .replace(/\{\{CENA\}\}/g, data.cena);
}

export function contractToHtml(contractText: string, beatTitle: string, datum: string): string {
  const escaped = contractText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  const htmlLines = lines.map(line => {
    if (line.trim() === "") return "<br/>";
    return `<p style="margin:0 0 6px 0;">${line}</p>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #111; background: #fff; margin: 0; padding: 40px; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #111; padding-bottom: 16px; }
  .header h1 { font-size: 16pt; margin: 0 0 4px 0; letter-spacing: 1px; }
  .header h2 { font-size: 13pt; margin: 0; font-weight: normal; }
  .footer { margin-top: 40px; border-top: 1px solid #111; padding-top: 12px; font-size: 9pt; color: #555; text-align: center; }
  .body { line-height: 1.7; }
</style>
</head>
<body>
<div class="header">
  <h1>VOODOO808: Smlouva o exkluzivní licenci</h1>
  <h2>Licenční smlouva k hudebnímu dílu</h2>
</div>
<div class="body">
${htmlLines}
</div>
<div class="footer">
  VOODOO808 Exkluzivní licenční smlouva — Vyhotoveno: ${datum} — Strana 1/1<br/>
  Tato smlouva je vyhotovena ve dvou stejnopisích, přičemž každá strana obdrží jeden výtisk.
</div>
</body>
</html>`;
}

export async function sendContractEmail(orderId: number): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(`[Email] SMTP not configured, skipping contract email for order ${orderId}`);
    return;
  }

  const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  if (orderRes.rows.length === 0) return;
  const order = orderRes.rows[0];

  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const beatItems = items.filter((i: any) => i.productType === "beat");

  if (beatItems.length === 0) {
    console.log(`[Email] Order ${orderId} has no beats, skipping contract email`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: smtpUser, pass: smtpPass },
  });

  const orderDate = new Date(order.created_at || Date.now());
  const datum = formatDateCzech(orderDate);

  for (const item of beatItems) {
    const licenseTypeId = item.licenseTypeId;
    let contractTemplate: string | null = null;
    let licensePrice = item.price;

    if (licenseTypeId) {
      const ltRes = await pool.query(
        "SELECT contract_template, price FROM license_types WHERE id = $1",
        [licenseTypeId]
      );
      if (ltRes.rows.length > 0) {
        contractTemplate = ltRes.rows[0].contract_template;
        licensePrice = ltRes.rows[0].price;
      }
    }

    if (!contractTemplate) {
      const fallbackRes = await pool.query(
        "SELECT contract_template FROM license_types WHERE contract_template IS NOT NULL AND is_active = true ORDER BY price DESC LIMIT 1"
      );
      if (fallbackRes.rows.length > 0) {
        contractTemplate = fallbackRes.rows[0].contract_template;
      }
    }

    if (!contractTemplate) {
      console.log(`[Email] No contract template found for order ${orderId}, item ${item.title}`);
      continue;
    }

    const filled = fillContractTemplate(contractTemplate, {
      datum,
      pravniJmeno: order.buyer_legal_name || order.email,
      umeleckeJmeno: order.buyer_artist_name || order.email,
      adresa: order.buyer_address || "—",
      beatNazev: item.title || "—",
      cena: formatPriceCzech(Number(licensePrice)),
    });

    const htmlContract = contractToHtml(filled, item.title, datum);

    try {
      await transporter.sendMail({
        from: `VOODOO808 <${smtpFrom}>`,
        to: order.email,
        subject: `Licenční smlouva – ${item.title} | VOODOO808`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="border-bottom:2px solid #111;padding-bottom:12px;">VOODOO808</h2>
            <p>Dobrý den,</p>
            <p>děkujeme za váš nákup. V příloze naleznete licenční smlouvu k beatu <strong>${item.title}</strong>.</p>
            <p>Po podepsání smlouvy ji prosím zašlete zpět na adresu <a href="mailto:info@voodoo808.com">info@voodoo808.com</a>.</p>
            <p>S pozdravem,<br/>Vojtěch Vojkovský (VOODOO808)</p>
          </div>
        `,
        attachments: [
          {
            filename: `Licencni_smlouva_${(item.title || "beat").replace(/\s+/g, "_")}.html`,
            content: htmlContract,
            contentType: "text/html",
          },
        ],
      });
      console.log(`[Email] Contract sent for order ${orderId}, beat: ${item.title}`);
    } catch (err) {
      console.error(`[Email] Failed to send contract for order ${orderId}:`, err);
    }
  }
}

export function generateContractHtml(
  template: string,
  data: {
    datum: string;
    pravniJmeno: string;
    umeleckeJmeno: string;
    adresa: string;
    beatNazev: string;
    cena: string;
  }
): string {
  const filled = fillContractTemplate(template, data);
  return contractToHtml(filled, data.beatNazev, data.datum);
}

export { formatDateCzech, formatPriceCzech };
