import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface ContractPdfOptions {
  language?: "en" | "cs";
  licenseName?: string;
  isExclusive?: boolean;
}

/**
 * Locate bundled TrueType font files that support full UTF-8 / Czech diacritics.
 */
function getFontPaths(): { regular: string; bold: string } | null {
  const candidateDirs = [
    path.resolve(process.cwd(), "server/assets/fonts"),
    path.resolve(process.cwd(), "dist/assets/fonts"),
    path.resolve(process.cwd(), "assets/fonts"),
  ];

  for (const dir of candidateDirs) {
    const reg = path.join(dir, "Roboto-Regular.ttf");
    const bold = path.join(dir, "Roboto-Bold.ttf");
    if (fs.existsSync(reg) && fs.existsSync(bold)) {
      return { regular: reg, bold };
    }
  }
  return null;
}

/**
 * Render filled contract text as a high-quality, professional PDF document.
 * Supports full UTF-8 Czech/English character sets, clean typography,
 * page numbering, and executive music contract styling.
 */
export function contractTextToPdfBuffer(
  contractText: string,
  beatTitle: string,
  datum: string,
  options?: ContractPdfOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const isEnglish =
      options?.language === "en" ||
      contractText.includes("CONTRACTING PARTIES") ||
      contractText.includes("Agreement");

    const isExclusive =
      options?.isExclusive ||
      (options?.licenseName && /exclusive|výhradní|exkluzivní/i.test(options.licenseName)) ||
      /exclusive license agreement|výhradní licenční smlouva/i.test(contractText);

    // Margin: 45pt for clean layout without spilling
    const doc = new PDFDocument({
      margin: 45,
      size: "A4",
      autoFirstPage: true,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);

    // Register TrueType fonts with full Unicode support
    const fonts = getFontPaths();
    const regularFont = fonts ? "Roboto" : "Helvetica";
    const boldFont = fonts ? "Roboto-Bold" : "Helvetica-Bold";

    if (fonts) {
      doc.registerFont("Roboto", fonts.regular);
      doc.registerFont("Roboto-Bold", fonts.bold);
    }

    // ─── Header Section ────────────────────────────────────────────────────────
    const headerTitle = isEnglish
      ? (isExclusive ? "EXCLUSIVE BEAT LICENSE AGREEMENT" : "NON-EXCLUSIVE BEAT LICENSE AGREEMENT")
      : (isExclusive ? "VÝHRADNÍ LICENČNÍ SMLOUVA K HUDEBNÍMU DÍLU" : "LICENČNÍ SMLOUVA K HUDEBNÍMU DÍLU");

    const subtitlePrefix = isEnglish ? "Composition / Beat: " : "Předmět licence (Beat): ";
    const datePrefix = isEnglish ? "Date of Issuance: " : "Datum vystavení: ";

    // Decorative top accent bar
    doc.rect(45, 45, doc.page.width - 90, 3).fill("#111827");
    doc.moveDown(0.8);

    // Brand Label
    doc
      .font(boldFont)
      .fontSize(9)
      .fillColor("#6366f1")
      .text("VOODOO808 • PRODUCTION & PUBLISHING", { align: "center", characterSpacing: 1.5 });
    doc.moveDown(0.35);

    // Main Document Title
    doc
      .font(boldFont)
      .fontSize(15)
      .fillColor("#111827")
      .text(headerTitle, { align: "center" });
    doc.moveDown(0.3);

    // Track Title
    doc
      .font(regularFont)
      .fontSize(11)
      .fillColor("#374151")
      .text(`${subtitlePrefix}"${beatTitle}"`, { align: "center" });
    doc.moveDown(0.2);

    // Date of Issuance badge
    doc
      .font(regularFont)
      .fontSize(8.5)
      .fillColor("#6b7280")
      .text(`${datePrefix}${datum} • Digitally Certified Agreement`, { align: "center" });

    doc.moveDown(0.4);
    // Divider line
    const dividerY = doc.y;
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(0.75)
      .moveTo(45, dividerY)
      .lineTo(doc.page.width - 45, dividerY)
      .stroke();
    doc.moveDown(0.8);

    // ─── Document Body Parsing & Rendering ────────────────────────────────────
    const lines = contractText.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (!trimmed) {
        doc.moveDown(0.3);
        continue;
      }

      // Check for main section headers (e.g. "CONTRACTING PARTIES", "SMLUVNÍ STRANY", "ELECTRONIC ACCEPTANCE")
      const isMajorHeader =
        (trimmed === trimmed.toUpperCase() &&
          trimmed.length > 2 &&
          !/^\d+\./.test(trimmed) &&
          !trimmed.startsWith("•") &&
          !trimmed.startsWith("-")) ||
        trimmed.startsWith("ELEKTRONICKÉ PŘIJETÍ") ||
        trimmed.startsWith("ELECTRONIC ACCEPTANCE");

      // Check for numbered article headers (e.g. "1. MASTER USE", "1. PŘEDMĚT SMLOUVY")
      const isArticleHeader = /^\d+\.\s+/.test(trimmed);

      // Check for bullet points
      const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");

      if (isMajorHeader) {
        doc.moveDown(0.45);
        // Header background box
        doc
          .font(boldFont)
          .fontSize(9.5)
          .fillColor("#111827")
          .text(trimmed, { characterSpacing: 0.5 });
        doc.moveDown(0.15);
      } else if (isArticleHeader) {
        doc.moveDown(0.4);
        doc
          .font(boldFont)
          .fontSize(9.5)
          .fillColor("#1f2937")
          .text(trimmed);
        doc.moveDown(0.15);
      } else if (isBullet) {
        const bulletText = trimmed.replace(/^[•\-]\s*/, "");
        doc
          .font(regularFont)
          .fontSize(8.5)
          .fillColor("#374151")
          .text(`•  ${bulletText}`, {
            indent: 12,
            lineGap: 2.2,
          });
        doc.moveDown(0.15);
      } else {
        doc
          .font(regularFont)
          .fontSize(8.5)
          .fillColor("#374151")
          .text(trimmed, {
            lineGap: 2.2,
            align: "left",
          });
        doc.moveDown(0.18);
      }
    }

    // ─── Page Footers (Multi-page numbering) ──────────────────────────────────
    const range = doc.bufferedPageRange();
    const totalPages = range.count;

    for (let p = 0; p < totalPages; p++) {
      doc.switchToPage(p);
      const oldBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const footerY = doc.page.height - 25;

      // Bottom subtle rule
      doc
        .strokeColor("#e5e7eb")
        .lineWidth(0.5)
        .moveTo(45, footerY - 5)
        .lineTo(doc.page.width - 45, footerY - 5)
        .stroke();

      const footerLeft = isEnglish
        ? "VOODOO808 Music Production • Official License Agreement"
        : "VOODOO808 Hudební produkce • Oficiální licenční smlouva";

      const footerRight = isEnglish
        ? `Page ${p + 1} of ${totalPages}`
        : `Strana ${p + 1} z ${totalPages}`;

      doc
        .font(regularFont)
        .fontSize(7.5)
        .fillColor("#9ca3af")
        .text(footerLeft, 45, footerY, { align: "left", width: doc.page.width - 90, lineBreak: false });

      doc
        .font(regularFont)
        .fontSize(7.5)
        .fillColor("#9ca3af")
        .text(footerRight, 45, footerY, { align: "right", width: doc.page.width - 90, lineBreak: false });

      doc.page.margins.bottom = oldBottom;
    }

    doc.end();
  });
}
