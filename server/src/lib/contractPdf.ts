import PDFDocument from "pdfkit";

/** Render filled contract plain text as a downloadable PDF (works on Render). */
export function contractTextToPdfBuffer(
  contractText: string,
  beatTitle: string,
  datum: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4", autoFirstPage: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text("Licenční smlouva", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica").text(beatTitle, { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor("#444444").text(`Vyhotoveno dne ${datum}`, { align: "center" });
    doc.fillColor("#000000");
    doc.moveDown(1.2);

    const lines = contractText.split("\n");
    for (const raw of lines) {
      const trimmed = raw.trim();
      if (!trimmed) {
        doc.moveDown(0.35);
        continue;
      }

      const isSectionLabel =
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 2 &&
        !/^\d+\./.test(trimmed) &&
        !trimmed.startsWith("•");
      const isArticle = /^\d+\.\s+[A-ZÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ]/.test(trimmed);

      if (isSectionLabel || isArticle) {
        doc.moveDown(0.25);
        doc.font("Helvetica-Bold").fontSize(10).text(trimmed);
        doc.font("Helvetica").fontSize(9);
      } else if (trimmed.startsWith("•")) {
        doc.fontSize(9).text(`  ${trimmed}`, { indent: 10, lineGap: 2 });
      } else {
        doc.fontSize(9).text(trimmed, { lineGap: 2 });
      }
      doc.moveDown(0.2);
    }

    doc.end();
  });
}
