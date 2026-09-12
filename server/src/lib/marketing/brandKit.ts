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

export interface EmailHeaderOptions {
  logoType?: "metallic" | "white";
  logoSize?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

function resolveLogoUrl(appUrl: string, logoType?: "metallic" | "white"): string {
  if (logoType === "metallic") {
    return `${appUrl}/uploads/artwork/voodoo808-main-logo-cropped.png`;
  }
  // Default is the pure white logo from website header
  return `${appUrl}/uploads/artwork/voodoo808-logo-white@2x.png`;
}

function resolveLogoWidth(size?: "sm" | "md" | "lg" | "xl"): number {
  if (size === "sm") return 180;
  if (size === "md") return 240;
  if (size === "xl") return 400;
  return 300; // "lg" default
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
  headerOptions?: EmailHeaderOptions;
}): string {
  const { appUrl, bodyHtml, unsubscribeUrl, preheader, headerOptions } = opts;
  const logoUrl = resolveLogoUrl(appUrl, headerOptions?.logoType);
  const logoWidth = resolveLogoWidth(headerOptions?.logoSize);
  const showText = !!headerOptions?.showText;

  const footer = unsubscribeUrl
    ? `<p style="margin:0;font-size:11px;color:${BRAND.textFainter};line-height:1.7;">
         VOODOO808 &bull; Vojtěch Vojkovský<br/>
         <a href="${unsubscribeUrl}" style="color:${BRAND.textFaint};text-decoration:underline;">Odhlásit se z marketingových e-mailů</a>
       </p>`
    : `<p style="margin:0;font-size:12px;color:${BRAND.textFootnote};text-align:center;line-height:1.7;">
         VOODOO808 &bull; Vojtěch Vojkovský<br/>
         <a href="mailto:info@voodoo808.com" style="color:${BRAND.textFaint};text-decoration:none;">info@voodoo808.com</a>
       </p>`;

  const preheaderPadding = "&#847; &zwnj;&nbsp;".repeat(35);

  return `<!DOCTYPE html>
<html lang="cs" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="color-scheme" content="dark only"/>
<meta name="supported-color-schemes" content="dark only"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>VOODOO808</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  :root {
    color-scheme: dark only;
    supported-color-schemes: dark only;
  }
  @media (prefers-color-scheme: dark) {
    body, .email-body-wrapper {
      background-color: #0a0a0a !important;
    }
  }
  /* Outlook App & Samsung Mail dark mode protection */
  [data-ogsc] .email-body-wrapper {
    background-color: #0a0a0a !important;
  }
  @media only screen and (max-width: 600px) {
    .email-container {
      width: 100% !important;
      max-width: 100% !important;
    }
    .email-header-cell {
      padding-left: 20px !important;
      padding-right: 20px !important;
      padding-bottom: 24px !important;
    }
    .email-content-cell {
      padding-left: 20px !important;
      padding-right: 20px !important;
      padding-top: 24px !important;
    }
    .email-footer-cell {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }
  }
</style>
</head>
<body class="email-body-wrapper" style="margin:0;padding:0;background:${BRAND.bg};background-color:${BRAND.bg};font-family:${BRAND.fontFamily};-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">${preheader}${preheaderPadding}</div>` : ""}
  <table class="email-body-wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};background-color:${BRAND.bg};padding:36px 0;width:100%;">
    <tr><td align="center" style="padding:0 12px;">
      <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin:0 auto;">
        <tr><td class="email-header-cell" style="padding:0 24px 28px 24px;text-align:center;border-bottom:1px solid ${BRAND.border};">
          <a href="${appUrl}" style="display:inline-block;text-decoration:none;">
            <img src="${logoUrl}" alt="VOODOO808" width="${logoWidth}" style="display:inline-block;height:auto;max-width:${logoWidth}px;width:auto;" />
          </a>
          ${showText ? `<div style="color:#ffffff;font-size:16px;font-weight:900;letter-spacing:3px;margin-top:8px;">VOODOO808</div>` : ""}
        </td></tr>
        <tr><td class="email-content-cell" style="padding:32px 24px 0 24px;">
          ${bodyHtml}
        </td></tr>
        <tr><td class="email-footer-cell" style="padding:40px 24px 0 24px;border-top:1px solid ${BRAND.border};margin-top:32px;">
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
