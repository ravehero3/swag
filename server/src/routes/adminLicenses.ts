import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { generateContractHtml, formatDateCzech, formatPriceCzech } from "../email.js";
import { generateOrderItemContractPdf } from "../lib/contracts.js";
import { fillContractTemplate } from "../lib/contractTemplate.js";
import { contractTextToPdfBuffer } from "../lib/contractPdf.js";

// English license agreement template
const DEFAULT_CONTRACT_TEMPLATE_EN = `CONTRACTING PARTIES
This Exclusive License Agreement (hereinafter the "Agreement") is entered into on {{DATUM}} (hereinafter the "Effective Date") between the following parties:

Licensee: {{PRAVNI_JMENO}}, artist name {{UMELECKE_JMENO}} (hereinafter the "Licensee").

Licensor: Vojtěch Vojkovský, artist name VOODOO808, residing at Bedovická č. 193, Třebechovice pod Orebem, 503 46, Czech Republic (hereinafter the "Licensor").

SUBJECT MATTER
The Licensor represents that they are the sole owner of the master and publishing rights to the musical composition titled {{BEAT_NAZEV}} (hereinafter the "Beat" or the "Composition"), and has the full right to grant the license set forth in this Agreement.

1. MASTER USE
Licensee is hereby granted an exclusive license to record vocal performances to the Beat, synchronize the Beat with video content, and release the resulting master recording(s) (hereinafter "New Song") worldwide.

2. REPRODUCTION AND DISTRIBUTION
Licensee is hereby granted the exclusive right to reproduce, manufacture, and distribute the New Song in unlimited copies worldwide, including all physical and digital formats (CDs, digital downloads, streaming platforms such as Spotify, Apple Music, etc.).

3. PUBLIC PERFORMANCE AND STREAMING
Licensee is hereby granted the exclusive right to publicly perform the New Song, including monetized live performances, concerts, and tours, as well as unlimited streaming on all platforms. Licensee may collect performance royalties from the New Song.

4. SYNCHRONIZATION RIGHTS
Licensee is hereby granted unlimited synchronization rights to use the Beat in music videos distributed online (YouTube, Vimeo, etc.) without limitation on views. Synchronization rights are also granted for use in television broadcasts, films, and video games.

5. RADIO AND BROADCAST
Licensee is hereby granted the right to broadcast the New Song on an unlimited number of radio and television stations worldwide.

6. CREDIT
Licensee agrees to credit the Licensor as the producer of the Beat in all formats and media with the name "Prod. VOODOO808", in writing where possible, otherwise verbally.

7. LICENSE FEE
In consideration for the rights granted under this Agreement, Licensee agrees to pay the Licensor a one-time fee of {{CENA}}, receipt of which is hereby acknowledged.

Should Licensee fail to make the required payment or breach any other obligation under this Agreement, Licensor may terminate this Agreement by written notice, and any reproduction, manufacture, or distribution of the New Song without payment shall constitute copyright infringement.

8. DELIVERY
The Beat will be delivered to Licensee in high-quality format (WAV + stems) via e-mail to the address provided by the Licensee.

9. SAMPLES
Clearance of any third-party sample rights contained within the Beat is the sole responsibility of the Licensee.

10. NON-TRANSFERABILITY
This license is non-transferable and applies exclusively to the specified Beat and Licensee. This Agreement constitutes the entire agreement between Licensor and Licensee concerning the Beat and is binding upon both parties and their respective successors and assigns.

11. PUBLISHING AND WRITER'S SHARE
Regarding publishing rights and ownership of the underlying Beat incorporated into the New Song, the parties agree to the following split:
• Licensor retains and administers 50% of the Writer's Share of the underlying Composition.
• Licensor retains and administers 50% of the Publisher's Share of the underlying Composition.
• Licensor retains and administers 3% of the Master Royalties, calculated from the Licensee's net profits after deducting all costs.

12. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be governed by the laws of the Czech Republic. Any disputes arising from this Agreement shall first be resolved through good-faith negotiation. If no agreement is reached, the dispute shall be submitted to the competent courts of the Czech Republic.

ELECTRONIC ACCEPTANCE
This Agreement becomes effective upon completion of payment for the license through the VOODOO808 platform. Licensee — {{PRAVNI_JMENO}}, artist name {{UMELECKE_JMENO}} — by completing the purchase expressly confirms that:

• they have read and fully understood this Agreement,
• they agree to all terms set forth herein,
• this Agreement reflects their true and voluntary will.

The electronic payment confirmation serves as the equivalent of a handwritten signature. The date of this Agreement is {{DATUM}}.

Licensor: Vojtěch Vojkovský, artist name VOODOO808, confirms the conclusion of this Agreement by issuing a payment confirmation and delivering the licensed files to the Licensee.`;

// In-memory history of generated licenses (persists per server process)
const generatedLicenseHistory: Array<{
  id: string;
  legalName: string;
  artistName: string;
  email: string;
  beatTitle: string;
  licenseId: number;
  licenseName: string;
  language: string;
  price: number;
  generatedAt: string;
}> = [];

const router = Router();

router.post("/contracts/preview", requireAdmin, (req: Request, res: Response) => {
  const { template } = req.body;
  if (!template) return res.status(400).json({ error: "Chybí šablona" });

  const today = new Date();
  const datum = formatDateCzech(today);
  const html = generateContractHtml(template, {
    datum,
    pravniJmeno: "Jan Novák",
    umeleckeJmeno: "YourArtistName",
    adresa: "Příkladná 1, Praha 1, 110 00",
    beatNazev: "Název díla (ukázka)",
    cena: formatPriceCzech(5000),
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

// Generate a custom license PDF for a specific customer
router.post("/contracts/generate-custom", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { legalName, artistName, email, beatTitle, licenseId, language } = req.body;

    if (!legalName || !artistName || !email || !beatTitle || !licenseId) {
      return res.status(400).json({ error: "Chybí povinné údaje (legalName, artistName, email, beatTitle, licenseId)" });
    }

    const lang = language === "en" ? "en" : "cs";

    // Fetch the license type to get the template and price
    const licenseRes = await pool.query(
      "SELECT id, name, price, contract_template FROM license_types WHERE id = $1",
      [licenseId]
    );
    if (licenseRes.rows.length === 0) {
      return res.status(404).json({ error: "Licence nenalezena" });
    }
    const licenseType = licenseRes.rows[0];

    // Use language-specific template or license's own template
    let template: string;
    if (lang === "en") {
      template = DEFAULT_CONTRACT_TEMPLATE_EN;
    } else {
      template = licenseType.contract_template || req.body.fallbackTemplate || "";
      if (!template) {
        return res.status(400).json({ error: "Licence nemá nastavenou šablonu smlouvy" });
      }
    }

    const today = new Date();
    const datum = formatDateCzech(today);
    const cena = formatPriceCzech(Number(licenseType.price));

    const filled = fillContractTemplate(template, {
      datum,
      pravniJmeno: legalName,
      umeleckeJmeno: artistName,
      adresa: email,
      beatNazev: beatTitle,
      cena,
    });

    const buffer = await contractTextToPdfBuffer(filled, beatTitle, datum);

    // Save to in-memory history
    const historyEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      legalName,
      artistName,
      email,
      beatTitle,
      licenseId: Number(licenseId),
      licenseName: licenseType.name,
      language: lang,
      price: Number(licenseType.price),
      generatedAt: new Date().toISOString(),
    };
    generatedLicenseHistory.unshift(historyEntry);
    // Keep only last 200 entries
    if (generatedLicenseHistory.length > 200) generatedLicenseHistory.length = 200;

    const safeArtist = artistName.replace(/[^\p{L}\p{N}\-_]+/gu, "_").slice(0, 40);
    const safeBeat = beatTitle.replace(/[^\p{L}\p{N}\-_]+/gu, "_").slice(0, 40);
    const filename = `Licence_${safeArtist}_${safeBeat}_${lang.toUpperCase()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Error generating custom contract:", error);
    res.status(500).json({ error: "Chyba při generování smlouvy" });
  }
});

// Get history of generated custom licenses
router.get("/contracts/history", requireAdmin, (_req: Request, res: Response) => {
  res.json(generatedLicenseHistory);
});

router.post("/licenses", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, price, fileTypes, termsText, isNegotiable, isActive, contractTemplate } = req.body;
    
    if (!name || price === undefined || !fileTypes || !Array.isArray(fileTypes)) {
      return res.status(400).json({ error: "Název, cena a typy souborů jsou povinné" });
    }

    const result = await pool.query(
      `INSERT INTO license_types (name, description, price, file_types, terms_text, is_negotiable, is_active, contract_template)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description || null, price, fileTypes, termsText || null, isNegotiable || false, isActive !== false, contractTemplate || null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating license:", error);
    res.status(500).json({ error: "Chyba při vytváření licence" });

  }
});

router.put("/licenses/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, price, fileTypes, termsText, isNegotiable, isActive, contractTemplate } = req.body;
    
    if (!name || price === undefined || !fileTypes || !Array.isArray(fileTypes)) {
      return res.status(400).json({ error: "Název, cena a typy souborů jsou povinné" });
    }

    const result = await pool.query(
      `UPDATE license_types 
       SET name = $1, description = $2, price = $3, file_types = $4, terms_text = $5, is_negotiable = $6, is_active = $7, contract_template = $8
       WHERE id = $9 RETURNING *`,
      [name, description || null, price, fileTypes, termsText || null, isNegotiable || false, isActive !== false, contractTemplate || null, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Licence nenalezena" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating license:", error);
    res.status(500).json({ error: "Chyba při aktualizaci licence" });
  }
});

router.get("/orders/:id/contract/:itemIndex", requireAdmin, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const itemIndex = parseInt(req.params.itemIndex, 10);

    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: "Objednávka nenalezena" });
    }
    const order = orderRes.rows[0];
    const items: any[] = Array.isArray(order.items) ? order.items : [];
    const item = items[itemIndex];
    if (!item) return res.status(404).json({ error: "Položka nenalezena" });

    const format = req.query.format === "html" ? "html" : "pdf";
    const orderDate = new Date(order.created_at || Date.now());
    const datum = formatDateCzech(orderDate);

    if (format === "html") {
      const { resolveContractTemplate } = await import("../lib/contracts.js");
      const { template, licensePrice } = await resolveContractTemplate(
        item.licenseTypeId,
        item.price
      );
      if (!template) {
        return res.status(404).json({ error: "Šablona smlouvy není nastavena" });
      }
      const html = generateContractHtml(template, {
        datum,
        pravniJmeno: order.buyer_legal_name || order.email,
        umeleckeJmeno: order.buyer_artist_name || order.email,
        adresa: order.buyer_address || "—",
        beatNazev: item.title || "—",
        cena: formatPriceCzech(Number(licensePrice)),
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }

    const pdf = await generateOrderItemContractPdf(order, item);
    if (!pdf) {
      return res.status(404).json({ error: "Šablona smlouvy není nastavena" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.filename}"`);
    res.send(pdf.buffer);
  } catch (error) {
    console.error("Error generating contract:", error);
    res.status(500).json({ error: "Chyba při generování smlouvy" });
  }
});

router.delete("/licenses/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "DELETE FROM license_types WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Licence nenalezena" });
    }
    
    res.json({ message: "Licence smazána" });
  } catch (error) {
    console.error("Error deleting license:", error);
    res.status(500).json({ error: "Chyba při mazání licence" });
  }
});

router.post("/beats/:id/license-files", requireAdmin, async (req: Request, res: Response) => {
  try {
    const beatId = req.params.id;
    const { licenseTypeId, fileUrl } = req.body;
    
    if (!licenseTypeId || !fileUrl) {
      return res.status(400).json({ error: "ID licence a URL souboru jsou povinné" });
    }

    const beatCheck = await pool.query("SELECT id FROM beats WHERE id = $1", [beatId]);
    if (beatCheck.rows.length === 0) {
      return res.status(404).json({ error: "Beat nenalezen" });
    }

    const licenseCheck = await pool.query("SELECT id FROM license_types WHERE id = $1", [licenseTypeId]);
    if (licenseCheck.rows.length === 0) {
      return res.status(404).json({ error: "Licence nenalezena" });
    }

    const result = await pool.query(
      `INSERT INTO beat_license_files (beat_id, license_type_id, file_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (beat_id, license_type_id) 
       DO UPDATE SET file_url = $3, uploaded_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [beatId, licenseTypeId, fileUrl]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error uploading license file:", error);
    res.status(500).json({ error: "Chyba při nahrávání souboru licence" });
  }
});

router.get("/beats/:id/license-files", requireAdmin, async (req: Request, res: Response) => {
  try {
    const beatId = req.params.id;
    const result = await pool.query(
      `SELECT blf.*, lt.name as license_name, lt.description as license_description
       FROM beat_license_files blf
       JOIN license_types lt ON blf.license_type_id = lt.id
       WHERE blf.beat_id = $1
       ORDER BY lt.price ASC`,
      [beatId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching license files:", error);
    res.status(500).json({ error: "Chyba při načítání souborů licence" });
  }
});

router.delete("/beats/:beatId/license-files/:licenseTypeId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { beatId, licenseTypeId } = req.params;
    const result = await pool.query(
      "DELETE FROM beat_license_files WHERE beat_id = $1 AND license_type_id = $2 RETURNING *",
      [beatId, licenseTypeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Soubor licence nenalezen" });
    }
    
    res.json({ message: "Soubor licence smazán" });
  } catch (error) {
    console.error("Error deleting license file:", error);
    res.status(500).json({ error: "Chyba při mazání souboru licence" });
  }
});

export default router;
