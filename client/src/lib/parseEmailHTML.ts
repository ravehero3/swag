/**
 * Parse old HTML email templates and extract content into editable blocks
 * Handles the standard VOODOO808 email template structure:
 * - Logo (header)
 * - Heading
 * - Paragraph
 * - Info boxes
 * - Links
 */

export interface EmailBlock {
  id: string;
  type: string;
  [key: string]: any;
}

export function parseEmailHTMLToBlocks(htmlContent: string, subject: string = ""): EmailBlock[] {
  if (!htmlContent) return [];

  const blocks: EmailBlock[] = [];
  let blockIdCounter = 0;

  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  // Extract heading (h1, h2, h3)
  const headings = doc.querySelectorAll("h1, h2, h3");
  if (headings.length > 0) {
    const heading = headings[0].textContent?.trim() || "";
    if (heading) {
      blocks.push({
        id: `b${blockIdCounter++}`,
        type: "heading",
        headingText: heading,
        headingLevel: "h1",
        headingAlign: "center",
        headingColor: "#ffffff",
      });
    }
  }

  // Extract paragraphs (but skip those inside divs with borders - those are info box content)
  const infoBoxDivs = doc.querySelectorAll("div[style*='border']");
  const infoBoxParagraphs = new Set();
  infoBoxDivs.forEach((box) => {
    box.querySelectorAll("p").forEach((p) => infoBoxParagraphs.add(p));
  });

  const paragraphs = doc.querySelectorAll("p");
  paragraphs.forEach((p) => {
    // Skip if this paragraph is inside an info box
    if (infoBoxParagraphs.has(p)) return;
    
    const text = p.textContent?.trim() || "";
    // Skip very short text (like single words) and text with copyright/emails
    if (text.length > 20 && !text.includes("©") && !text.includes("@")) {
      blocks.push({
        id: `b${blockIdCounter++}`,
        type: "paragraph",
        paragraphText: text,
        paragraphAlign: "left",
        paragraphColor: "#aaaaaa",
        paragraphFontSize: "15px",
      });
    }
  });

  // Extract info boxes (divs with border styling)
  infoBoxDivs.forEach((box) => {
    const pElements = box.querySelectorAll("p");
    if (pElements.length >= 2) {
      const titleEl = pElements[0];
      const contentEl = pElements[pElements.length - 1]; // Get last p tag
      
      const title = titleEl.textContent?.trim() || "";
      const content = contentEl.textContent?.trim() || "";
      
      if (title && content.length > 10) {
        blocks.push({
          id: `b${blockIdCounter++}`,
          type: "info_box",
          infoBgColor: "#111111",
          infoBorderColor: "#222222",
          infoTitle: title,
          infoText: content,
        });
      }
    }
  });

  // If no blocks were extracted, return empty array (will use default)
  return blocks.length > 0 ? blocks : [];
}
