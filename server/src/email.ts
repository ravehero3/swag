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
  // Escape HTML entities first
  const escaped = contractText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = escaped.split("\n");
  let bodyHtml = "";
  let inSigBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === "") {
      bodyHtml += `<div class="spacer"></div>`;
      continue;
    }

    // Signature block trigger — "PODPISY" header
    if (/^PODPISY/i.test(trimmed) && trimmed === trimmed.toUpperCase() && trimmed.length > 2) {
      inSigBlock = true;
      bodyHtml += `<div class="section-rule"></div><p class="section-label">${trimmed}</p>`;
      continue;
    }

    // ALL-CAPS section label (no leading digit, not a bullet)
    if (
      trimmed === trimmed.toUpperCase() &&
      trimmed.length > 2 &&
      !/^\d+\./.test(trimmed) &&
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("_") &&
      !/^[A-Z]{1,2}\d/.test(trimmed)
    ) {
      bodyHtml += `<div class="section-rule"></div><p class="section-label">${trimmed}</p>`;
      continue;
    }

    // Numbered article header "N. SOMETHING IN CAPS"
    if (/^\d+\.\s+[A-ZÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ]/.test(trimmed)) {
      const match = trimmed.match(/^(\d+\.\s+)(.+)$/);
      if (match) {
        bodyHtml += `<p class="article-heading"><span class="article-num">${match[1]}</span>${match[2]}</p>`;
        continue;
      }
    }

    // Bullet point
    if (trimmed.startsWith("•")) {
      bodyHtml += `<p class="bullet">${trimmed.slice(1).trim()}</p>`;
      continue;
    }

    // Signature line (contains underscores for filling in)
    if (trimmed.includes("____") || inSigBlock) {
      bodyHtml += `<p class="sig-line">${trimmed}</p>`;
      continue;
    }

    // Default paragraph
    bodyHtml += `<p class="body-para">${trimmed}</p>`;
  }

  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Licen&#269;n&#237; smlouva &ndash; ${beatTitle}</title>
<style>
  /* ── Reset ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Page shell ── */
  html { background: #d6d6d6; min-height: 100%; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 10.5pt;
    line-height: 1.62;
    color: #111;
    background: #d6d6d6;
    padding: 48px 24px 72px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── A4 paper ── */
  .page {
    position: relative;
    width: 794px;
    min-height: 1123px;
    margin: 0 auto;
    padding: 84px 88px 120px;
    background: #fff;
    box-shadow:
      0 2px 8px rgba(0,0,0,0.12),
      0 12px 40px rgba(0,0,0,0.14),
      0 32px 64px rgba(0,0,0,0.08);
  }

  /* ── Document header (top bar) ── */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 18px;
    border-bottom: 2px solid #111;
    margin-bottom: 52px;
  }
  .doc-wordmark {
    font-family: 'Georgia', serif;
    font-size: 10.5pt;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: #000;
  }
  .doc-meta {
    text-align: right;
    font-size: 7.5pt;
    letter-spacing: 0.08em;
    color: #888;
    line-height: 1.7;
    font-family: 'Georgia', serif;
  }

  /* ── Title block ── */
  .title-block {
    margin-bottom: 52px;
  }
  .doc-overline {
    font-size: 7pt;
    font-family: 'Georgia', serif;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 10px;
    display: block;
  }
  .doc-title {
    font-size: 21pt;
    font-weight: 700;
    letter-spacing: -0.015em;
    line-height: 1.1;
    color: #000;
    margin-bottom: 8px;
    font-family: 'Georgia', serif;
  }
  .doc-subtitle {
    font-size: 10pt;
    color: #777;
    font-style: italic;
    font-family: 'Georgia', serif;
    letter-spacing: 0.01em;
  }

  /* ── Section rule + label ── */
  .section-rule {
    border: none;
    border-top: 1px solid #ddd;
    margin: 32px 0 0 0;
  }
  .section-label {
    font-size: 7pt;
    font-family: 'Georgia', serif;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #aaa;
    margin: 8px 0 14px 0;
  }

  /* ── Article heading ── */
  .article-heading {
    font-size: 9.5pt;
    font-weight: 700;
    font-family: 'Georgia', serif;
    letter-spacing: 0.01em;
    color: #111;
    margin: 22px 0 6px 0;
    line-height: 1.35;
  }
  .article-num {
    color: #aaa;
    font-weight: 400;
    margin-right: 2px;
  }

  /* ── Body paragraph ── */
  .body-para {
    font-size: 10.5pt;
    line-height: 1.62;
    color: #222;
    margin: 0 0 9px 0;
    text-align: justify;
    hyphens: auto;
  }

  /* ── Bullet ── */
  .bullet {
    font-size: 10.5pt;
    line-height: 1.62;
    color: #222;
    margin: 0 0 5px 0;
    padding-left: 18px;
    position: relative;
    text-align: justify;
  }
  .bullet::before {
    content: '·';
    position: absolute;
    left: 4px;
    color: #aaa;
    font-size: 14pt;
    line-height: 1.2;
  }

  /* ── Spacer between paragraphs ── */
  .spacer { height: 8px; }

  /* ── Signature lines ── */
  .sig-line {
    font-size: 10pt;
    color: #333;
    margin: 4px 0;
    line-height: 1.8;
    font-family: 'Georgia', serif;
  }

  /* ── Footer ── */
  .doc-footer {
    position: absolute;
    bottom: 40px;
    left: 88px;
    right: 88px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e8e8e8;
    padding-top: 10px;
  }
  .doc-footer span {
    font-size: 7pt;
    font-family: 'Georgia', serif;
    letter-spacing: 0.08em;
    color: #bbb;
  }

  /* ── Print ── */
  @media print {
    html, body { background: #fff; padding: 0; }
    .page {
      width: 100%;
      min-height: auto;
      box-shadow: none;
      padding: 0;
      margin: 0;
    }
  }
</style>
</head>
<body>
<div class="page">

  <header class="doc-header">
    <span class="doc-wordmark">VOODOO808</span>
    <div class="doc-meta">
      Exkluzivn&#237; licen&#269;n&#237; smlouva<br/>
      Vyhotoveno: ${datum}
    </div>
  </header>

  <div class="title-block">
    <span class="doc-overline">Licen&#269;n&#237; smlouva k hudebn&#237;mu d&#237;lu</span>
    <h1 class="doc-title">${beatTitle}</h1>
    <p class="doc-subtitle">Smlouva o p&#345;evodu exkluzivn&#237; licence</p>
  </div>

  <main>
    ${bodyHtml}
  </main>

  <footer class="doc-footer">
    <span>VOODOO808 &copy; ${new Date().getFullYear()}</span>
    <span>Strana 1 z 1</span>
    <span>Vyhotoveno dne ${datum}</span>
  </footer>

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

export function buildPreviewEmailHtml(key: string, introText: string, appUrl: string): string {
  const datum = "3. dubna 2026";

  const isFree = key === "free";
  const isKit = key.includes("kit") || key.includes("kits");

  const sampleItems: DownloadItem[] = isFree
    ? [
        { title: "Dark Trap Vol. 1", productType: "sound_kit", price: 0, downloadUrl: "#" },
      ]
    : key === "beats"
    ? [
        { title: "Neon Nights", productType: "beat", price: 1490, downloadUrl: "#" },
        { title: "Midnight Drive", productType: "beat", price: 990, downloadUrl: "#" },
      ]
    : key === "kits"
    ? [
        { title: "Dark Trap Vol. 1", productType: "sound_kit", price: 890, downloadUrl: "#" },
        { title: "808 Essentials", productType: "sound_kit", price: 690, downloadUrl: "#" },
      ]
    : key === "mixed"
    ? [
        { title: "Neon Nights", productType: "beat", price: 1490, downloadUrl: "#" },
        { title: "Dark Trap Vol. 1", productType: "sound_kit", price: 890, downloadUrl: "#" },
      ]
    : [{ title: "Neon Nights", productType: "beat", price: 1490, downloadUrl: "#" }];

  const sampleOrder = { id: 1234, total: sampleItems.reduce((s, i) => s + i.price, 0) };

  if (isFree) {
    return buildFreePreviewHtml(introText, sampleItems, appUrl);
  }
  return buildPurchaseEmailHtml(sampleOrder, sampleItems, datum, appUrl, introText);
}

function buildFreePreviewHtml(introText: string, items: DownloadItem[], appUrl: string): string {
  const downloadRows = items.map(item => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #222;vertical-align:middle;">
        <div style="font-weight:600;font-size:15px;color:#fff;margin-bottom:4px;">${item.title}</div>
        <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">
          ${item.productType === "beat" ? "Beat" : "Sound Kit"} &bull; Zdarma
        </div>
      </td>
      <td style="padding:14px 0 14px 24px;border-bottom:1px solid #222;text-align:right;vertical-align:middle;white-space:nowrap;">
        <a href="#" style="display:inline-block;background:#fff;color:#000;font-weight:700;font-size:13px;padding:10px 22px;border-radius:4px;text-decoration:none;letter-spacing:0.5px;">STÁHNOUT</a>
      </td>
    </tr>`).join("");

  const displayIntro = introText || "Děkujeme za zájem! Níže najdete přímé odkazy ke stažení vašich souborů zdarma. Každý odkaz je platný 30 dní.";

  return `<!DOCTYPE html><html lang="cs"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 32px 0;text-align:center;border-bottom:1px solid #222;">
          <img src="${appUrl}/uploads/artwork/voodoo808-logo.png" alt="VOODOO808" width="180" style="display:inline-block;height:auto;max-width:180px;"/>
        </td></tr>
        <tr><td style="padding:32px 0 8px 0;">
          <p style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#fff;">Vaše soubory jsou připraveny!</p>
          <p style="margin:0;font-size:15px;color:#aaa;line-height:1.6;">${displayIntro}</p>
        </td></tr>
        <tr><td style="padding:28px 0 0 0;">
          <p style="margin:0 0 12px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;">Vaše soubory</p>
          <table width="100%" cellpadding="0" cellspacing="0">${downloadRows}</table>
        </td></tr>
        <tr><td style="padding:24px 0 0 0;">
          <div style="background:#111;border:1px solid #222;border-radius:6px;padding:18px 22px;">
            <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#fff;">Přístup kdykoli</p>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
              Soubory jsou také dostupné ve vašem <a href="${appUrl}/ucet" style="color:#fff;font-weight:600;">účtu na VOODOO808</a>.
            </p>
          </div>
        </td></tr>
        <tr><td style="padding:40px 0 0 0;border-top:1px solid #222;margin-top:32px;">
          <p style="margin:32px 0 0 0;font-size:12px;color:#444;text-align:center;line-height:1.7;">
            VOODOO808 &bull; Vojtěch Vojkovský<br/>
            <a href="mailto:info@voodoo808.com" style="color:#666;text-decoration:none;">info@voodoo808.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildPurchaseEmailHtml(
  order: any,
  downloadItems: DownloadItem[],
  datum: string,
  appUrl: string,
  customIntroText?: string,
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

  const hasBeatContracts = downloadItems.some(i => i.productType === "beat" || i.productType === "sound_kit");

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
              <img src="${appUrl}/uploads/artwork/voodoo808-logo.png" alt="VOODOO808" width="180" style="display:inline-block;height:auto;max-width:180px;"/>
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
  const beatItems = items.filter((i: any) => i.productType === "beat" || i.productType === "sound_kit");

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

export async function sendFreeDownloadEmail(lead: { id: number; email: string; items: any[] }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;
  if (!apiKey) {
    console.log(`[Email] RESEND_API_KEY not configured, skipping free download email for lead ${lead.id}`);
    return;
  }

  const items: any[] = Array.isArray(lead.items) ? lead.items : [];
  if (items.length === 0) return;

  const appUrl = process.env.APP_URL ||
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "https://voodoo808.com");

  const downloadItems = await resolveDownloadItems(items);
  const datum = formatDateCzech(new Date());
  const resend = new Resend(apiKey);
  const fromAddress = process.env.RESEND_FROM || "VOODOO808 <info@voodoo808.com>";

  const downloadRows = downloadItems.map(item => {
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
            ${item.productType === "beat" ? "Beat" : "Sound Kit"} &bull; Zdarma
          </div>
        </td>
        <td style="padding:14px 0 14px 24px;border-bottom:1px solid #222;text-align:right;vertical-align:middle;white-space:nowrap;">
          ${downloadBtn}
        </td>
      </tr>`;
  }).join("");

  const emailHtml = `<!DOCTYPE html>
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
          <tr>
            <td style="padding:0 0 32px 0;text-align:center;border-bottom:1px solid #222;">
              <span style="font-size:26px;font-weight:900;letter-spacing:3px;color:#fff;text-transform:uppercase;">VOODOO808</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 0 8px 0;">
              <p style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#fff;">Vaše soubory jsou připraveny!</p>
              <p style="margin:0;font-size:15px;color:#aaa;line-height:1.6;">
                Děkujeme za zájem! Níže najdete přímé odkazy ke stažení vašich souborů zdarma. Každý odkaz je platný <strong style="color:#fff;">30 dní</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0 0;">
              <p style="margin:0 0 12px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;">Vaše soubory</p>
              <table width="100%" cellpadding="0" cellspacing="0">${downloadRows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0 0;">
              <div style="background:#111;border:1px solid #222;border-radius:6px;padding:18px 22px;">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:#fff;">Přístup kdykoli</p>
                <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
                  Soubory jsou také dostupné ve vašem
                  <a href="${appUrl}/ucet" style="color:#fff;font-weight:600;">účtu na VOODOO808</a>.
                </p>
              </div>
            </td>
          </tr>
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

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [lead.email],
      subject: `Vaše soubory zdarma – VOODOO808`,
      html: emailHtml,
    });
    if (error) {
      console.error(`[Email] Resend error for lead ${lead.id}:`, error);
    } else {
      console.log(`[Email] Free download email sent for lead ${lead.id}, id: ${data?.id}`);
    }
  } catch (err) {
    console.error(`[Email] Failed to send free download email for lead ${lead.id}:`, err);
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
