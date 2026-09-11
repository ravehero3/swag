import { BRAND } from "./brandKit.js";

export type BlockType =
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "hero"
  | "beat_highlight"
  | "multi_beat_grid"
  | "info_box"
  | "coupon_box"
  | "social_links"
  | "countdown";

export interface EmailBlockGridItem {
  title: string;
  subtitle?: string;
  coverUrl?: string;
  price?: string;
  url?: string;
}

export interface EmailBlock {
  id: string;
  type: BlockType;
  // Heading
  headingText?: string;
  headingLevel?: "h1" | "h2" | "h3";
  headingAlign?: "left" | "center" | "right";
  headingColor?: string;

  // Paragraph
  paragraphText?: string;
  paragraphAlign?: "left" | "center" | "right";
  paragraphColor?: string;
  paragraphFontSize?: string;

  // Button
  buttonText?: string;
  buttonUrl?: string;
  buttonAlign?: "left" | "center" | "right";
  buttonBgColor?: string;
  buttonTextColor?: string;

  // Image
  imageUrl?: string;
  imageAlt?: string;
  imageLink?: string;
  imageAlign?: "left" | "center" | "right";
  imageWidth?: string;
  imageFullBleed?: boolean;

  // Divider
  dividerColor?: string;
  dividerStyle?: "solid" | "dashed" | "dotted";

  // Spacer
  spacerHeight?: number;

  // Hero
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  heroButtonText?: string;
  heroButtonUrl?: string;

  // Beat Highlight
  beatTitle?: string;
  beatSubtitle?: string;
  beatCoverUrl?: string;
  beatPrice?: string;
  beatUrl?: string;
  beatBpmKey?: string;

  // Multi Beat Grid
  gridItems?: EmailBlockGridItem[];

  // Info Box
  infoTitle?: string;
  infoText?: string;
  infoBorderColor?: string;
  infoBgColor?: string;

  // Coupon Box
  couponCode?: string;
  couponDiscount?: string;
  couponDescription?: string;

  // Social Links
  instagramUrl?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  beatstarsUrl?: string;

  // Countdown Timer
  countdownTitle?: string;
  countdownTargetDate?: string;
  countdownDays?: number | string;
  countdownHours?: number | string;
  countdownMinutes?: number | string;
  countdownSeconds?: number | string;
  countdownButtonText?: string;
  countdownButtonUrl?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeUrl(url?: string): string {
  if (!url) return "{{site_url}}";
  const trimmed = url.trim();
  if (trimmed.startsWith("/")) {
    return `{{site_url}}${trimmed}`;
  }
  return trimmed;
}

export function compileSingleBlockToHtml(block: EmailBlock): string {
  switch (block.type) {
    case "heading": {
      const text = block.headingText || "Nadpis";
      const align = block.headingAlign || "left";
      const color = block.headingColor || BRAND.textPrimary;
      const level = block.headingLevel || "h1";
      const fontSize = level === "h1" ? "24px" : level === "h2" ? "20px" : "17px";
      const margin = level === "h1" ? "0 0 16px 0" : "0 0 12px 0";

      return `<p style="margin:${margin};font-size:${fontSize};font-weight:700;color:${color};text-align:${align};line-height:1.3;">${escapeHtml(text)}</p>`;
    }

    case "paragraph": {
      const text = block.paragraphText || "Text odstavce…";
      const align = block.paragraphAlign || "left";
      const color = block.paragraphColor || BRAND.textSecondary;
      const fontSize = block.paragraphFontSize || "15px";
      const formattedText = escapeHtml(text).replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 16px 0;font-size:${fontSize};color:${color};line-height:1.6;text-align:${align};">${formattedText}</p>`;
    }

    case "button": {
      const text = block.buttonText || "TLAČÍTKO";
      const url = normalizeUrl(block.buttonUrl);
      const align = block.buttonAlign || "left";
      const bg = block.buttonBgColor || "#ffffff";
      const textColor = block.buttonTextColor || "#000000";

      return `<table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;">
        <tr>
          <td align="${align}">
            <a href="${escapeHtml(url)}" style="display:inline-block;background:${bg};color:${textColor};font-weight:700;font-size:13px;padding:12px 28px;border-radius:4px;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(text)}</a>
          </td>
        </tr>
      </table>`;
    }

    case "image": {
      const url = block.imageUrl || "";
      const alt = block.imageAlt || "";
      const link = block.imageLink ? normalizeUrl(block.imageLink) : "";
      const align = block.imageAlign || "center";
      const isFullBleed = block.imageFullBleed || block.imageWidth === "full_bleed";
      const width = isFullBleed ? "100%" : (block.imageWidth || "100%");
      const borderRadius = isFullBleed ? "0px" : "6px";
      const border = isFullBleed ? "none" : `1px solid ${BRAND.border}`;

      if (!url) return "";

      const imgHtml = `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" style="display:block;max-width:100%;width:${width};height:auto;border-radius:${borderRadius};border:${border};margin:0 auto;" />`;

      const wrappedImg = link
        ? `<a href="${escapeHtml(link)}" style="display:inline-block;text-decoration:none;width:100%;">${imgHtml}</a>`
        : imgHtml;

      return `<table cellpadding="0" cellspacing="0" style="margin:${isFullBleed ? "8px 0" : "16px 0"};width:100%;">
        <tr>
          <td align="${align}">
            ${wrappedImg}
          </td>
        </tr>
      </table>`;
    }

    case "divider": {
      const color = block.dividerColor || BRAND.border;
      const style = block.dividerStyle || "solid";
      return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:20px 0;">
        <tr>
          <td style="border-bottom:1px ${style} ${color};font-size:0;line-height:0;height:1px;">&nbsp;</td>
        </tr>
      </table>`;
    }

    case "spacer": {
      const height = Math.max(8, Math.min(120, block.spacerHeight || 24));
      return `<div style="height:${height}px;line-height:${height}px;font-size:1px;">&nbsp;</div>`;
    }

    case "hero": {
      const title = block.heroTitle || "VOODOO808 EXCLUSIVE";
      const subtitle = block.heroSubtitle || "Nové beaty a sound kity pro vaše projekty.";
      const imgUrl = block.heroImageUrl || "";
      const btnText = block.heroButtonText || "PROZKOUMAT";
      const btnUrl = block.heroButtonUrl || "{{site_url}}/beaty";

      return `<table cellpadding="0" cellspacing="0" style="width:100%;background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;margin:0 0 24px 0;">
        ${imgUrl ? `<tr><td><img src="${escapeHtml(imgUrl)}" alt="" style="width:100%;height:auto;display:block;max-height:260px;object-fit:cover;" /></td></tr>` : ""}
        <tr>
          <td style="padding:24px 20px;text-align:center;">
            <p style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:${BRAND.textPrimary};line-height:1.3;">${escapeHtml(title)}</p>
            <p style="margin:0 0 18px 0;font-size:14px;color:${BRAND.textSecondary};line-height:1.5;">${escapeHtml(subtitle)}</p>
            <div>
              <a href="${escapeHtml(btnUrl)}" style="display:inline-block;background:#ffffff;color:#000000;font-weight:700;font-size:12px;padding:10px 24px;border-radius:4px;text-decoration:none;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(btnText)}</a>
            </div>
          </td>
        </tr>
      </table>`;
    }

    case "beat_highlight": {
      const title = block.beatTitle || "Featured Beat / Sound Kit";
      const subtitle = block.beatSubtitle || "Exkluzivní novinka na VOODOO808";
      const coverUrl = block.beatCoverUrl || "{{site_url}}/uploads/artwork/voodoo808-main-logo.png";
      const price = block.beatPrice || "od 990 Kč";
      const url = block.beatUrl || "{{site_url}}/beaty";
      const bpmKey = block.beatBpmKey || "";

      return `<table cellpadding="0" cellspacing="0" style="width:100%;background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:8px;padding:16px;margin:16px 0;">
        <tr>
          <td width="90" style="vertical-align:top;padding-right:16px;">
            <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(title)}" width="90" height="90" style="width:90px;height:90px;border-radius:6px;object-fit:cover;display:block;border:1px solid ${BRAND.border};" />
          </td>
          <td style="vertical-align:middle;">
            <p style="margin:0 0 4px 0;font-size:16px;font-weight:700;color:${BRAND.textPrimary};">${escapeHtml(title)}</p>
            ${subtitle ? `<p style="margin:0 0 4px 0;font-size:13px;color:${BRAND.textSecondary};">${escapeHtml(subtitle)}</p>` : ""}
            ${bpmKey ? `<p style="margin:0 0 8px 0;font-size:11px;color:${BRAND.textMuted};">${escapeHtml(bpmKey)}</p>` : ""}
            <table cellpadding="0" cellspacing="0" style="margin-top:6px;">
              <tr>
                <td style="padding-right:12px;">
                  <span style="font-size:14px;font-weight:700;color:${BRAND.textPrimary};">${escapeHtml(price)}</span>
                </td>
                <td>
                  <a href="${escapeHtml(url)}" style="display:inline-block;background:#ffffff;color:#000000;font-size:11px;font-weight:700;padding:6px 14px;border-radius:4px;text-decoration:none;text-transform:uppercase;">Koupit / Přehrát</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    }

    case "multi_beat_grid": {
      const items = block.gridItems && block.gridItems.length > 0 ? block.gridItems : [
        { title: "Beat #1", subtitle: "140 BPM", price: "990 Kč", coverUrl: "", url: "{{site_url}}/beaty" },
        { title: "Beat #2", subtitle: "130 BPM", price: "990 Kč", coverUrl: "", url: "{{site_url}}/beaty" },
      ];

      const columnsHtml = items.map((item) => {
        const cover = item.coverUrl || "{{site_url}}/uploads/artwork/voodoo808-main-logo.png";
        return `<td width="${Math.floor(100 / items.length)}%" style="padding:8px;vertical-align:top;">
          <div style="background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:8px;padding:12px;text-align:center;">
            <img src="${escapeHtml(cover)}" alt="" style="width:100%;max-width:140px;height:auto;aspect-ratio:1;border-radius:6px;display:block;margin:0 auto 10px auto;border:1px solid ${BRAND.border};" />
            <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:${BRAND.textPrimary};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(item.title)}</p>
            ${item.subtitle ? `<p style="margin:0 0 6px 0;font-size:11px;color:${BRAND.textMuted};">${escapeHtml(item.subtitle)}</p>` : ""}
            <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:${BRAND.textPrimary};">${escapeHtml(item.price || "Cena")}</p>
            <a href="${escapeHtml(item.url || "{{site_url}}/beaty")}" style="display:inline-block;background:#ffffff;color:#000000;font-size:10px;font-weight:700;padding:5px 12px;border-radius:4px;text-decoration:none;text-transform:uppercase;">Koupit</a>
          </div>
        </td>`;
      }).join("");

      return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;">
        <tr>${columnsHtml}</tr>
      </table>`;
    }

    case "coupon_box": {
      const code = block.couponCode || "VOODOO808";
      const discount = block.couponDiscount || "20% SLEVA";
      const desc = block.couponDescription || "Použijte tento kód v nákupním košíku pro získání slevy na váš nákup.";

      return `<table cellpadding="0" cellspacing="0" style="width:100%;background:${BRAND.cardBg};border:2px dashed #ffffff;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <tr>
          <td>
            <span style="display:inline-block;background:rgba(255,255,255,0.1);color:#ffffff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">${escapeHtml(discount)}</span>
            <p style="margin:8px 0 4px 0;font-size:24px;font-weight:800;letter-spacing:3px;color:#ffffff;font-family:monospace;">${escapeHtml(code)}</p>
            <p style="margin:8px 0 0 0;font-size:13px;color:${BRAND.textSecondary};line-height:1.5;">${escapeHtml(desc)}</p>
          </td>
        </tr>
      </table>`;
    }

    case "social_links": {
      const insta = block.instagramUrl || "https://instagram.com";
      const yt = block.youtubeUrl || "https://youtube.com";
      const spotify = block.spotifyUrl || "https://spotify.com";

      return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:24px 0;text-align:center;">
        <tr>
          <td>
            <a href="${escapeHtml(insta)}" style="color:${BRAND.textSecondary};text-decoration:none;font-size:12px;font-weight:600;margin:0 10px;">Instagram</a>
            <span style="color:${BRAND.textMuted};">•</span>
            <a href="${escapeHtml(yt)}" style="color:${BRAND.textSecondary};text-decoration:none;font-size:12px;font-weight:600;margin:0 10px;">YouTube</a>
            <span style="color:${BRAND.textMuted};">•</span>
            <a href="${escapeHtml(spotify)}" style="color:${BRAND.textSecondary};text-decoration:none;font-size:12px;font-weight:600;margin:0 10px;">Spotify</a>
          </td>
        </tr>
      </table>`;
    }

    case "info_box": {
      const title = block.infoTitle || "Důležitá informace";
      const text = block.infoText || "Obsah informačního boxu…";
      const border = block.infoBorderColor || BRAND.border;
      const bg = block.infoBgColor || BRAND.cardBg;

      return `<table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${bg};border:1px solid ${border};border-radius:6px;margin:16px 0;">
        <tr>
          <td style="padding:18px 22px;">
            ${title ? `<p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:${BRAND.textPrimary};">${escapeHtml(title)}</p>` : ""}
            <p style="margin:0;font-size:13px;color:${BRAND.textSecondary};line-height:1.6;">${escapeHtml(text).replace(/\n/g, "<br/>")}</p>
          </td>
        </tr>
      </table>`;
    }

    case "countdown": {
      const title = block.countdownTitle || "LIMITOVANÁ NABÍDKA KONČÍ ZA:";
      const targetDate = block.countdownTargetDate;
      let days = String(block.countdownDays ?? "01").padStart(2, "0");
      let hours = String(block.countdownHours ?? "14").padStart(2, "0");
      let mins = String(block.countdownMinutes ?? "30").padStart(2, "0");
      let secs = String(block.countdownSeconds ?? "00").padStart(2, "0");

      if (targetDate) {
        const diff = new Date(targetDate).getTime() - Date.now();
        if (diff > 0) {
          days = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, "0");
          hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0");
          mins = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, "0");
          secs = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
        } else {
          days = "00"; hours = "00"; mins = "00"; secs = "00";
        }
      }

      const btnText = block.countdownButtonText;
      const btnUrl = normalizeUrl(block.countdownButtonUrl || "/beaty");

      return `<table cellpadding="0" cellspacing="0" style="width:100%;background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:8px;padding:22px 16px;margin:20px 0;text-align:center;">
        <tr>
          <td>
            <span style="display:inline-block;background:rgba(255,45,85,0.15);color:#ff2d55;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Časově omezená nabídka</span>
            <p style="margin:8px 0 16px 0;font-size:15px;font-weight:800;letter-spacing:1px;color:${BRAND.textPrimary};text-transform:uppercase;">${escapeHtml(title)}</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
              <tr>
                <td style="padding:0 5px;">
                  <div style="background:#050505;border:1px solid #282828;border-radius:6px;padding:8px 12px;min-width:44px;">
                    <div style="font-size:22px;font-weight:800;color:#ffffff;font-family:monospace;">${days}</div>
                    <div style="font-size:9px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Dny</div>
                  </div>
                </td>
                <td style="padding:0 5px;">
                  <div style="background:#050505;border:1px solid #282828;border-radius:6px;padding:8px 12px;min-width:44px;">
                    <div style="font-size:22px;font-weight:800;color:#ffffff;font-family:monospace;">${hours}</div>
                    <div style="font-size:9px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Hod</div>
                  </div>
                </td>
                <td style="padding:0 5px;">
                  <div style="background:#050505;border:1px solid #282828;border-radius:6px;padding:8px 12px;min-width:44px;">
                    <div style="font-size:22px;font-weight:800;color:#ffffff;font-family:monospace;">${mins}</div>
                    <div style="font-size:9px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Min</div>
                  </div>
                </td>
                <td style="padding:0 5px;">
                  <div style="background:#050505;border:1px solid #282828;border-radius:6px;padding:8px 12px;min-width:44px;">
                    <div style="font-size:22px;font-weight:800;color:#0B99FC;font-family:monospace;">${secs}</div>
                    <div style="font-size:9px;color:${BRAND.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Sek</div>
                  </div>
                </td>
              </tr>
            </table>
            ${btnText ? `<div style="margin-top:8px;"><a href="${escapeHtml(btnUrl)}" style="display:inline-block;background:#ffffff;color:#000000;font-weight:700;font-size:12px;padding:10px 24px;border-radius:4px;text-decoration:none;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(btnText)}</a></div>` : ""}
          </td>
        </tr>
      </table>`;
    }

    default:
      return "";
  }
}

export function compileBlocksToHtml(blocks: EmailBlock[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return "";
  }
  return blocks.map(b => compileSingleBlockToHtml(b)).filter(Boolean).join("\n");
}
