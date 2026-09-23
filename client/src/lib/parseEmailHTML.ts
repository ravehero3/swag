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

  // Extract heading (h1, h2, h3, or first large text)
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

  // Extract paragraphs
  const paragraphs = doc.querySelectorAll("p");
  paragraphs.forEach((p) => {
    const text = p.textContent?.trim() || "";
    // Skip very short text (like single words) and paragraph tags inside other elements
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

  // Extract info boxes (divs with specific styling)
  const infoBoxes = doc.querySelectorAll("div[style*='border']");
  infoBoxes.forEach((box) => {
    const titleEl = box.querySelector("p:first-child");
    const contentEl = box.querySelector("p:last-child");
    
    if (titleEl && contentEl) {
      const title = titleEl.textContent?.trim() || "";
      let content = contentEl.textContent?.trim() || "";
      
      // Extract link if exists
      const link = contentEl.querySelector("a");
      const linkUrl = link?.getAttribute("href") || "";
      
      if (title && content.length > 10) {
        // Remove the link text from content, keep just the descriptive part
        const beforeLink = content.split(link?.textContent || "")[0]?.trim() || "";
        
        blocks.push({
          id: `b${blockIdCounter++}`,
          type: "info_box",
          infoBorderColor: "#222222",
          infoTitle: title,
          infoBodyHtml: beforeLink,
          infoLink: linkUrl,
          infoLinkText: link?.textContent || "Learn more",
        });
      }
    }
  });

  // If no blocks were extracted, return empty array (will use default)
  return blocks.length > 0 ? blocks : [];
}
