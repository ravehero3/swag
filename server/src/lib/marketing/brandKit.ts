// ─────────────────────────────────────────────────────────────────────────────
// VOODOO808 email brand kit — the single source of truth for marketing email
// styling. Mirrors (does not duplicate-and-drift from) the colors already
// used in:
//   - client/src/constants/designSystem.ts (admin panel dark theme)
//   - client/src/styles/global.css (site body background/text)
//   - server/src/email.ts (existing transactional emails: purchase, free
//     download, password reset, welcome, bank transfer, abandoned checkout)
//
// Email clients can't reliably load custom web fonts (Figtree/Saint Regular
// aren't safe bets in Gmail/Outlook), so — exactly like every transactional
// email already in this codebase — we use the same "Helvetica Neue" system
// fallback chain. Visually this reads as the same brand because the actual
// differentiators (near-black background, white text, grey secondary text,
// white pill buttons, thin #222 borders) are all preserved exactly.
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  bg: "#0a0a0a",
  cardBg: "#111111",
  border: "#222222",
  borderSubtle: "#1a1a1a",
  textPrimary: "#ffffff",
  textSecondary: "#aaaaaa",
  textMuted: "#888888",
  textFaint: "#666666",
  textFainter: "#555555",
  textFootnote: "#444444",
  accentWarning: "#f5b150",
  accentWarningBg: "rgba(245,158,11,0.06)",
  accentWarningBorder: "#3a2a10",
};

function resolveLogoUrl(appUrl: string): string {
  return `${appUrl}/uploads/artwork/voodoo808-main-logo.png`;
}

/**
 * The outer shell every marketing email is rendered into: dark background,
 * centered 600px column, logo header, footer with business identity +
 * unsubscribe link. Callers pass only the inner body HTML (built from the
 * block helpers below, or raw markup) — this function owns everything else,
 * so a template can never accidentally drift from the brand.
 */
export function renderBrandedEmailShell(opts: {
  appUrl: string;
  bodyHtml: string;
  unsubscribeUrl?: string;
  preheader?: string;
}): string {
  const { appUrl, bodyHtml, unsubscribeUrl, preheader } = opts;
  const logoUrl = resolveLogoUrl(appUrl);

  const footer = unsubscribeUrl
    ? `<p style="margin:0;font-size:11px;color:${BRAND.textFainter};line-height:1.7;">
         VOODOO808 &bull; Vojtěch Vojkovský<br/>
         <a href="${unsubscribeUrl}" style="color:${BRAND.textFaint};text-decoration:underline;">Odhlásit se z marketingových e-mailů</a>
       </p>`
    : `<p style="margin:0;font-size:12px;color:${BRAND.textFootnote};text-align:center;line-height:1.7;">
         VOODOO808 &bull; Vojtěch Vojkovský<br/>
         <a href="mailto:info@voodoo808.com" style="color:${BRAND.textFaint};text-decoration:none;">info@voodoo808.com</a>
       </p>`;

  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:${BRAND.fontFamily};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 0 32px 0;text-align:center;border-bottom:1px solid ${BRAND.border};">
          <img src="${logoUrl}" alt="VOODOO808" width="220" style="display:inline-block;height:auto;max-width:220px;"/>
        </td></tr>
        <tr><td style="padding:32px 0 0 0;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:40px 0 0 0;border-top:1px solid ${BRAND.border};margin-top:32px;">
          <div style="margin:32px 0 0 0;text-align:center;">${footer}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Reusable content blocks — same visual language as the existing site/emails ──

export function emailHeading(text: string): string {
  return `<p style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:${BRAND.textPrimary};">${text}</p>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">${text}</p>`;
}

export function emailSmallLabel(text: string): string {
  return `<p style="margin:0 0 12px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.textFaint};">${text}</p>`;
}

/** White pill button — same style as "STÁHNOUT" / "RESETOVAT HESLO" in the existing transactional emails. */
export function emailButton(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0;"><tr><td>
    <a href="${url}" style="display:inline-block;background:${BRAND.textPrimary};color:#000000;font-weight:700;font-size:13px;padding:12px 28px;border-radius:4px;text-decoration:none;letter-spacing:0.5px;">${label}</a>
  </td></tr></table>`;
}

/** Dark bordered info box — same style as the "Přístup kdykoli" / payment-details boxes. */
export function emailInfoBox(title: string, bodyHtml: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:6px;margin:0 0 16px 0;">
    <tr><td style="padding:18px 22px;">
      <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:${BRAND.textPrimary};">${title}</p>
      <div style="font-size:13px;color:${BRAND.textMuted};line-height:1.6;">${bodyHtml}</div>
    </td></tr>
  </table>`;
}

/** Amber warning box — same style used for the bank-transfer "variable symbol" warning. */
export function emailWarningBox(bodyHtml: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;border:1px solid ${BRAND.accentWarningBorder};background:${BRAND.accentWarningBg};border-radius:4px;margin:0 0 16px 0;">
    <tr><td style="padding:14px;">
      <div style="font-size:13px;color:${BRAND.accentWarning};line-height:1.6;">${bodyHtml}</div>
    </td></tr>
  </table>`;
}

export function emailDivider(): string {
  return `<div style="border-top:1px solid ${BRAND.border};margin:24px 0;"></div>`;
}

/** A product/beat row — same two-column layout used for order download items. */
export function emailProductRow(opts: { title: string; meta: string; ctaLabel?: string; ctaUrl?: string }): string {
  const cta = opts.ctaUrl
    ? `<a href="${opts.ctaUrl}" style="display:inline-block;background:${BRAND.textPrimary};color:#000000;font-weight:700;font-size:13px;padding:10px 22px;border-radius:4px;text-decoration:none;letter-spacing:0.5px;">${opts.ctaLabel || "ZOBRAZIT"}</a>`
    : "";
  return `<tr>
    <td style="padding:14px 0;border-bottom:1px solid ${BRAND.border};vertical-align:middle;">
      <div style="font-weight:600;font-size:15px;color:${BRAND.textPrimary};margin-bottom:4px;">${opts.title}</div>
      <div style="font-size:12px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;">${opts.meta}</div>
    </td>
    <td style="padding:14px 0 14px 24px;border-bottom:1px solid ${BRAND.border};text-align:right;vertical-align:middle;white-space:nowrap;">${cta}</td>
  </tr>`;
}

export function emailProductTable(rowsHtml: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>`;
}
