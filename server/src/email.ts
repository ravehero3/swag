import { Resend } from "resend";
import { pool } from "./db.js";
import { generateDownloadUrl, STORAGE_BUCKETS } from "./lib/storage.js";

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

interface DownloadItem {
  title: string;
  productType: string;
  price: number;
  downloadUrl: string | null;
}

async function resolveDownloadItems(items: any[]): Promise<DownloadItem[]> {
  const result: DownloadItem[] = [];

  for (const item of items) {
    let fileKey: string | null = null;

    try {
      if (item.productType === "beat") {
        const res = await pool.query("SELECT file_url FROM beats WHERE id = $1", [item.productId]);
        fileKey = res.rows[0]?.file_url || null;
      } else if (item.productType === "sound_kit") {
        const res = await pool.query("SELECT file_url FROM sound_kits WHERE id = $1", [item.productId]);
        fileKey = res.rows[0]?.file_url || null;
      }
    } catch (err) {
      console.error(`[Email] Could not fetch file_url for item ${item.productId}:`, err);
    }

    let downloadUrl: string | null = null;
    if (fileKey) {
      try {
        // Pre-signed URL valid for 30 days
        downloadUrl = await generateDownloadUrl(STORAGE_BUCKETS.ZIPS, fileKey, 30 * 24 * 60 * 60);
      } catch (err) {
        console.error(`[Email] Could not generate download URL for key ${fileKey}:`, err);
      }
    }

    result.push({
      title: item.title || "Produkt",
      productType: item.productType,
      price: Number(item.price),
      downloadUrl,
    });
  }

  return result;
}

function buildPurchaseEmailHtml(
  order: any,
  downloadItems: DownloadItem[],
  datum: string,
  appUrl: string,
): string {
  const downloadRows = downloadItems.map(item => {
    const priceFormatted = formatPriceCzech(item.price);
    const downloadBtn = item.downloadUrl
      ? `<a href="${item.downloadUrl}"
           style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:13px;
                  padding:10px 22px;border-radius:4px;text-decoration:none;letter-spacing:0.5px;">
           STÁHNOUT
         </a>`
      : `<span style="color:#888;font-size:13px;">Odkaz nedostupný — přihlaste se na účet</span>`;

    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #222;vertical-align:middle;">
          <div style="font-weight:600;font-size:15px;color:#fff;margin-bottom:4px;">${item.title}</div>
          <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">
            ${item.productType === "beat" ? "Beat" : "Sound Kit"} &bull; ${priceFormatted}
          </div>
        </td>
        <td style="padding:14px 0 14px 24px;border-bottom:1px solid #222;text-align:right;vertical-align:middle;white-space:nowrap;">
          ${downloadBtn}
        </td>
      </tr>`;
  }).join("");

  const hasBeatContracts = downloadItems.some(i => i.productType === "beat");

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;border-bottom:1px solid #222;">
              <span style="font-size:26px;font-weight:900;letter-spacing:3px;color:#fff;text-transform:uppercase;">
                VOODOO808
              </span>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 0 8px 0;">
              <p style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#fff;">
                Platba přijata — díky za nákup!
              </p>
              <p style="margin:0;font-size:15px;color:#aaa;line-height:1.6;">
                Objednávka #${order.id} ze dne ${datum} je potvrzena.
                Níže najdete odkazy ke stažení vašich souborů. Každý odkaz je platný <strong style="color:#fff;">30 dní</strong>.
              </p>
            </td>
          </tr>

          <!-- Downloads -->
          <tr>
            <td style="padding:28px 0 0 0;">
              <p style="margin:0 0 12px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;">
                Vaše soubory
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${downloadRows}
              </table>
            </td>
          </tr>

          <!-- Account note -->
          <tr>
            <td style="padding:24px 0 0 0;">
              <div style="background:#111;border:1px solid #222;border-radius:6px;padding:18px 22px;">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#fff;">
                  Přístup ke stažení kdykoliv
                </p>
                <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
                  Všechny vaše nákupy jsou také dostupné ve vašem
                  <a href="${appUrl}/ucet" style="color:#fff;font-weight:600;">účtu na VOODOO808</a>.
                  Přihlaste se kdykoliv pro opětovné stažení.
                </p>
              </div>
            </td>
          </tr>

          ${hasBeatContracts ? `
          <!-- Contract note -->
          <tr>
            <td style="padding:20px 0 0 0;">
              <div style="background:#111;border:1px solid #222;border-radius:6px;padding:18px 22px;">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#fff;">
                  Licenční smlouva
                </p>
                <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
                  Dokončením nákupu jste odsouhlasili licenční podmínky.
                  Smlouva s vašimi údaji je přiložena k tomuto emailu pro vaši evidenci.
                  Žádná další akce z vaší strany není nutná.
                </p>
              </div>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding:40px 0 0 0;border-top:1px solid #222;margin-top:32px;">
              <p style="margin:32px 0 0 0;font-size:12px;color:#444;text-align:center;line-height:1.7;">
                VOODOO808 &bull; Vojtěch Vojkovský<br/>
                <a href="mailto:info@voodoo808.com" style="color:#666;text-decoration:none;">info@voodoo808.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContractEmail(orderId: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;
  if (!apiKey) {
    console.log(`[Email] RESEND_API_KEY not configured, skipping purchase email for order ${orderId}`);
    return;
  }

  const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  if (orderRes.rows.length === 0) return;
  const order = orderRes.rows[0];

  const items: any[] = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0) {
    console.log(`[Email] Order ${orderId} has no items, skipping email`);
    return;
  }

  const orderDate = new Date(order.created_at || Date.now());
  const datum = formatDateCzech(orderDate);

  const appUrl = process.env.APP_URL ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://voodoo808.com");

  const downloadItems = await resolveDownloadItems(items);

  const resend = new Resend(apiKey);

  const emailHtml = buildPurchaseEmailHtml(order, downloadItems, datum, appUrl);

  const attachments: { filename: string; content: string; contentType?: string }[] = [];
  const beatItems = items.filter((i: any) => i.productType === "beat");

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
      console.log(`[Email] No contract template for order ${orderId}, item: ${item.title}`);
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

    attachments.push({
      filename: `Licencni_smlouva_${(item.title || "beat").replace(/\s+/g, "_")}.html`,
      content: Buffer.from(htmlContract, "utf-8").toString("base64"),
    });
  }

  const fromAddress = process.env.RESEND_FROM || "VOODOO808 <info@voodoo808.com>";

  try {
    const payload: any = {
      from: fromAddress,
      to: [order.email],
      subject: `Platba přijata – Objednávka #${orderId} | VOODOO808`,
      html: emailHtml,
    };

    if (attachments.length > 0) {
      payload.attachments = attachments.map(a => ({
        filename: a.filename,
        content: a.content,
      }));
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error(`[Email] Resend error for order ${orderId}:`, error);
    } else {
      console.log(`[Email] Purchase email sent for order ${orderId}, id: ${data?.id}`);
    }
  } catch (err) {
    console.error(`[Email] Failed to send purchase email for order ${orderId}:`, err);
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
