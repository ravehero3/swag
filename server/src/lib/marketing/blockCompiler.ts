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
  | "info_box";

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

  // Info Box
  infoTitle?: string;
  infoText?: string;
  infoBorderColor?: string;
  infoBgColor?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

      return `<p style="margin:${margin};font-size:${fontSize};font-weight:700;color:${color};text-align:${align};line-height:1.3;">${text}</p>`;
    }

    case "paragraph": {
      const text = block.paragraphText || "Text odstavce…";
      const align = block.paragraphAlign || "left";
      // Allow HTML breaks or paragraph content formatted cleanly
      const formattedText = text.replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 16px 0;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;text-align:${align};">${formattedText}</p>`;
    }

    case "button": {
      const text = block.buttonText || "TLAČÍTKO";
      const url = block.buttonUrl || "{{site_url}}";
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
      const link = block.imageLink || "";
      const align = block.imageAlign || "center";
      const width = block.imageWidth || "100%";

      if (!url) return "";

      const imgHtml = `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" style="display:block;max-width:100%;width:${width};height:auto;border-radius:6px;border:1px solid ${BRAND.border};" />`;

      const wrappedImg = link
        ? `<a href="${escapeHtml(link)}" style="display:inline-block;text-decoration:none;">${imgHtml}</a>`
        : imgHtml;

      return `<table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;">
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
      return `<div style="margin:20px 0;border-bottom:1px ${style} ${color};"></div>`;
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
            <p style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:${BRAND.textPrimary};line-height:1.3;">${title}</p>
            <p style="margin:0 0 18px 0;font-size:14px;color:${BRAND.textSecondary};line-height:1.5;">${subtitle}</p>
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

    case "info_box": {
      const title = block.infoTitle || "Důležitá informace";
      const text = block.infoText || "Obsah informačního boxu…";
      const border = block.infoBorderColor || BRAND.border;
      const bg = block.infoBgColor || BRAND.cardBg;

      return `<div style="background:${bg};border:1px solid ${border};border-radius:6px;padding:18px 22px;margin:16px 0;">
        ${title ? `<p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:${BRAND.textPrimary};">${escapeHtml(title)}</p>` : ""}
        <p style="margin:0;font-size:13px;color:${BRAND.textSecondary};line-height:1.6;">${text.replace(/\n/g, "<br/>")}</p>
      </div>`;
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
