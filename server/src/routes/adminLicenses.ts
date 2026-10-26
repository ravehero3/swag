import { Router, Request, Response } from "express";
import { pool } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { generateContractHtml } from "../email.js";
import { generateOrderItemContractPdf } from "../lib/contracts.js";
import {
  fillContractTemplate,
  formatDateCzech,
  formatDateEnglish,
  formatPriceCzech,
  formatPriceEnglish,
} from "../lib/contractTemplate.js";
import { contractTextToPdfBuffer } from "../lib/contractPdf.js";

// ─── English Non-Exclusive License (<100k Monthly Spotify Listeners) ───────────
const DEFAULT_CONTRACT_TEMPLATE_EN = `CONTRACTING PARTIES
This Non-Exclusive Beat License Agreement (hereinafter the "Agreement") is entered into on {{DATUM}} (the "Effective Date") by and between:

Licensor: Vojtěch Vojkovský, professionally known as VOODOO808, residing at Bedovická 193, 503 46 Třebechovice pod Orebem, Czech Republic, email: info@voodoo808.com (hereinafter the "Licensor").

Licensee: {{PRAVNI_JMENO}}, professionally known as {{UMELECKE_JMENO}}, contact/email: {{ADRESA}} (hereinafter the "Licensee").

1. SUBJECT COMPOSITION
Licensor represents and warrants that Licensor is the sole author, producer, and copyright holder of the original instrumental musical composition and sound recording titled "{{BEAT_NAZEV}}" (hereinafter the "Beat" or "Composition"). Licensor warrants that Licensor possesses all rights necessary to grant the license set forth herein.

2. GRANT OF NON-EXCLUSIVE LICENSE
Licensor hereby grants to Licensee a non-exclusive, non-transferable, non-sublicensable, worldwide license to record one (1) new original vocal and/or lyrical performance synchronized with the Beat, creating one (1) derivative sound recording (hereinafter the "New Song"), subject to the terms and limitations below.

3. STREAMING AND SPOTIFY LISTENER LIMITS (<100K LISTENERS)
• Licensee is authorized to distribute the New Song on digital audio streaming services (including Spotify, Apple Music, Tidal, Amazon Music, YouTube Music, and Deezer).
• This license specifically permits distribution for an artist profile with fewer than 100,000 monthly active Spotify listeners, or up to a cumulative maximum of 100,000 total audio streams across all platforms.
• If Licensee exceeds 100,000 monthly Spotify listeners or 100,000 cumulative streams, Licensee must contact Licensor to upgrade this license to an Unlimited or Exclusive license upon mutual agreement. Continued distribution beyond these thresholds without an upgraded license shall constitute copyright infringement.

4. REPRODUCTION AND PHYSICAL DISTRIBUTION
Licensee is granted the right to manufacture, distribute, and sell up to 3,000 physical copies (CDs, vinyl, cassettes) and digital download copies (e.g. iTunes, Bandcamp) of the New Song.

5. VIDEO AND SYNCHRONIZATION
• Licensee is granted synchronization rights for one (1) non-commercial or monetized promotional music video on online video platforms (such as YouTube, Vimeo, TikTok, Instagram) up to a maximum of 100,000 total combined video views.
• Commercial television broadcasts, theatrical feature films, or video games require a separate synchronization agreement.

6. CONTENT ID AND AUDIO FINGERPRINTING RESTRICTION (STRICT)
Licensee is strictly prohibited from registering or allowing any third party (including digital distributors, aggregators, or collection agencies such as DistroKid, TuneCore, CDBaby, Identifyy, or Songtrust) to register the New Song or Beat with YouTube Content ID, Meta Rights Manager, TikTok audio fingerprinting, or any automated copyright recognition/fingerprinting system. The underlying Beat is non-exclusive; registration with Content ID generates false copyright claims against Licensor and other authorized licensees. Any violation will result in immediate termination of this license and liability for damages.

7. PUBLIC PERFORMANCE AND LIVE SHOWS
Licensee is granted the non-exclusive right to perform the New Song in live concerts, shows, and festivals with cumulative gross performance revenue not to exceed $2,000 USD (or equivalent in local currency).

8. PUBLISHING, PRO REGISTRATION, AND WRITER'S SHARE
The parties agree to the music industry standard split regarding the musical composition (publishing) of the New Song:
• Music / Instrumental Composition (Licensor): Licensor retains and administers 50% of the Writer's Share and 50% of the Publisher's Share.
• Lyrics / Vocal Melody (Licensee): Licensee owns and administers 50% of the Writer's Share and 50% of the Publisher's Share.
• In any registration with Performing Rights Organizations (e.g. OSA, BMI, ASCAP, PRS, SOCAN, GEMA), Licensor (Vojtěch Vojkovský / VOODOO808) must be credited and registered as a 50% composer/writer.
• Master Recording Royalties: Licensee retains 100% of master streaming and sales revenue generated within the permitted streaming limits.

9. CREDIT AND ATTRIBUTION
In accordance with moral rights and industry standards, Licensee must credit Licensor in all commercial and promotional releases of the New Song:
• In track titles and release metadata where possible: "[Song Title] (Prod. VOODOO808)" or "[Song Title] (Prod. by VOODOO808)".
• In DSP metadata and liner notes: Producer: VOODOO808.

10. LICENSE FEE AND DELIVERY
In consideration for the rights granted herein, Licensee agrees to pay the one-time fee of {{CENA}}, receipt of which is hereby acknowledged. Licensor delivers the Beat in high-resolution audio format (WAV and/or stems as specified in the purchased tier) electronically to the email address provided by Licensee.

11. SAMPLES AND WARRANTIES
Licensor warrants that the Beat is an original musical composition created by Licensor and does not infringe upon any third-party copyrights. Licensee warrants that any lyrics, vocal recordings, or additional instrumentation added by Licensee are original and do not infringe any third-party rights.

12. NON-TRANSFERABILITY AND RESERVATION OF RIGHTS
This license is non-transferable, non-exclusive, and personal to Licensee. Licensor reserves all rights not expressly granted herein and retains full ownership of the underlying Beat, including the right to continue licensing the Beat non-exclusively to other artists until an exclusive license is sold.

13. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement is governed by and construed in accordance with the laws of the Czech Republic (specifically Act No. 89/2012 Coll., Civil Code § 2358 et seq., and Act No. 121/2000 Coll., Copyright Act), in harmony with international copyright conventions. Any disputes shall first be resolved through good-faith amicable negotiation, failing which the competent courts of the Czech Republic shall have jurisdiction.

14. ELECTRONIC ACCEPTANCE AND LEGAL VALIDITY
Pursuant to Section 562 of the Czech Civil Code (Act No. 89/2012 Coll.) and EU Directive 2000/31/EC on electronic commerce, this Agreement becomes legally valid and binding upon completion of payment and electronic issuance by Licensor. Physical handwritten signatures are not required for legal validity.`;

// ─── English Exclusive License Agreement ──────────────────────────────────────
const DEFAULT_EXCLUSIVE_CONTRACT_TEMPLATE_EN = `CONTRACTING PARTIES
This Exclusive Beat License Agreement (hereinafter the "Agreement") is entered into on {{DATUM}} (the "Effective Date") by and between:

Licensor: Vojtěch Vojkovský, professionally known as VOODOO808, residing at Bedovická 193, 503 46 Třebechovice pod Orebem, Czech Republic, email: info@voodoo808.com (hereinafter the "Licensor").

Licensee: {{PRAVNI_JMENO}}, professionally known as {{UMELECKE_JMENO}}, contact/email: {{ADRESA}} (hereinafter the "Licensee").

1. SUBJECT COMPOSITION
Licensor represents and warrants that Licensor is the sole author, producer, and copyright holder of the original instrumental musical composition and sound recording titled "{{BEAT_NAZEV}}" (hereinafter the "Beat" or "Composition"), and has the full legal right and authority to grant the exclusive license set forth herein.

2. GRANT OF EXCLUSIVE LICENSE
Licensor hereby grants to Licensee the exclusive, perpetual, worldwide license to record vocal and/or instrumental performances synchronized with the Beat, creating one or more derivative sound recordings (hereinafter "New Song"), and to commercially exploit the New Song without limitation on copies or streaming volume.

3. FULL EXCLUSIVITY & RETIREMENT OF THE BEAT
Upon execution of this Agreement and receipt of payment, Licensor shall retire the Beat from public sale and agrees not to sell, license, or grant any further rights to the Beat to any third party. Licensor confirms that any prior non-exclusive licenses granted prior to this exclusive sale shall remain valid only until their natural expiration or terms, and no new licenses shall be issued.

4. REPRODUCTION, DISTRIBUTION AND STREAMING
Licensee is granted the exclusive right to manufacture, distribute, sell, and stream the New Song in unlimited copies and unlimited streams worldwide, across all physical and digital formats (CDs, vinyl, downloads, Spotify, Apple Music, YouTube Music, Tidal, etc.).

5. SYNCHRONIZATION AND BROADCAST
Licensee is granted unlimited synchronization rights to synchronize the Beat and New Song with visual media worldwide, including music videos, television broadcasts, motion pictures, advertisements, and video games. Licensee is granted unlimited radio and television broadcasting rights.

6. PUBLISHING AND WRITER'S SHARE
The parties agree to the industry standard publishing split regarding the underlying musical composition:
• Music / Instrumental Composition (Licensor): Licensor retains and administers 50% of the Writer's Share and 50% of the Publisher's Share.
• Lyrics / Vocal Melody (Licensee): Licensee owns and administers 50% of the Writer's Share and 50% of the Publisher's Share.
• Licensee shall register Licensor (Vojtěch Vojkovský / VOODOO808) with the relevant Performing Rights Organization (OSA, BMI, ASCAP, PRS, etc.) as 50% composer/writer.

7. CREDIT AND ATTRIBUTION
Licensee agrees to credit Licensor as the producer of the Beat in all formats and metadata with the name "Prod. VOODOO808" or "Prod. by VOODOO808".

8. LICENSE FEE AND DELIVERY
In consideration for the exclusive rights granted herein, Licensee agrees to pay the one-time fee of {{CENA}}, receipt of which is hereby acknowledged. Licensor delivers the Beat in uncompressed WAV and multitrack stems electronically to Licensee.

9. SAMPLES AND WARRANTIES
Licensor warrants that the Beat is an original musical composition created by Licensor and does not infringe third-party copyrights. Licensee warrants that any additional elements incorporated into the New Song are original.

10. GOVERNING LAW AND JURISDICTION
This Agreement is governed by the laws of the Czech Republic (specifically Act No. 89/2012 Coll., Civil Code § 2358 et seq., and Act No. 121/2000 Coll., Copyright Act). Disputes shall be submitted to the competent courts of the Czech Republic.

11. ELECTRONIC ACCEPTANCE
Pursuant to Section 562 of the Czech Civil Code (Act No. 89/2012 Coll.) and EU Directive 2000/31/EC, this Agreement is legally formed and valid upon payment completion and electronic issuance by Licensor.`;

// ─── Czech Non-Exclusive License (<100k Monthly Spotify Listeners) ─────────────
const DEFAULT_CONTRACT_TEMPLATE_CS = `SMLUVNÍ STRANY
Tato neexkluzivní licenční smlouva k hudebnímu dílu (dále jen „Smlouva") se uzavírá dne {{DATUM}} (dále jen „Den účinnosti") mezi těmito smluvními stranami:

Poskytovatel licence: Vojtěch Vojkovský, uměleckým jménem VOODOO808, s bydlištěm Bedovická 193, 503 46 Třebechovice pod Orebem, Česká republika, e-mail: info@voodoo808.com (dále jen „Poskytovatel").

Nabyvatel licence: {{PRAVNI_JMENO}}, uměleckým jménem {{UMELECKE_JMENO}}, kontaktní údaj/adresa: {{ADRESA}} (dále jen „Nabyvatel").

Tato Smlouva se řídí zákonem č. 89/2012 Sb., občanský zákoník (zejména § 2358 a násl. – licenční smlouva), a zákonem č. 121/2000 Sb., o právu autorském a právech souvisejících s právem autorským (autorský zákon).

1. PŘEDMĚT SMLOUVY
Poskytovatel prohlašuje a zaručuje, že je výlučným autorem a nositelem majetkových autorských práv k původnímu hudebnímu dílu a zvukovému záznamu s názvem „{{BEAT_NAZEV}}" (dále jen „Beat" nebo „Dílo"), a má plné oprávnění udělit licenci specifikovanou v této Smlouvě.

2. UDĚLENÍ NEEXKLUZIVNÍ LICENCE
Poskytovatel uděluje Nabyvateli nevýhradní (neexkluzivní), nepřevoditelnou celosvětovou licenci k zaznamenání vokálního či textového projevu synchronizovaného s Beatem za účelem vytvoření jedné (1) odvozené zvukové nahrávky (dále jen „Nová píseň"), za podmínek stanovených níže.

3. STREAMOVÁNÍ A SPOTIFY LIMIT (<100 000 POSLUCHAČŮ)
• Nabyvatel je oprávněn šířit Novou píseň prostřednictvím digitálních streamovacích služeb (zejména Spotify, Apple Music, Tidal, Amazon Music, YouTube Music, Deezer).
• Tato licence je výslovně určena a omezena pro umělecký profil s méně než 100 000 měsíčními posluchači na Spotify (Monthly Listeners) nebo do kumulativního limitu 100 000 streamů napříč všemi platformami.
• Při překročení 100 000 měsíčních posluchačů na Spotify nebo 100 000 streamů je Nabyvatel povinen kontaktovat Poskytovatele za účelem sjednání rozšířené (Unlimited) nebo exkluzivní licence. Šíření nad rámec tohoto limitu bez rozšířené licence zakládá porušení autorských práv.

4. ROZMNOŽOVÁNÍ A DISTRIBUCE FYZICKÝCH NOSIČŮ
Nabyvatel je oprávněn vyrobit a distribuovat nejvýše 3 000 kusů fyzických nosičů (CD, vinyl, kazety) a digitálních stažení (downloadů) Nové písně.

5. VIDEO A SYNCHRONIZACE
• Nabyvateli se uděluje synchronizační právo pro jedno (1) hudební video na online video platformách (YouTube, Vimeo, TikTok, Instagram) do maximálního limitu 100 000 zhlédnutí.
• Užití v televizním vysílání, celovečerním filmu nebo komerčních videohrách vyžaduje samostatnou synchronizační smlouvu.

6. ZÁKAZ REGISTRACE DO CONTENT ID A AUDIO FINGERPRINTINGU
Nabyvatel se výslovně zavazuje, že nezaregistruje ani neumožní třetím stranám (včetně digitálních distributorů jako DistroKid, TuneCore, CDBaby, Songtrust apod.) zaregistrovat Novou píseň ani Beat do systému YouTube Content ID, Meta Rights Manager ani do jiných automatizovaných systémů rozpoznávání zvuku (audio fingerprinting). Beat je poskytován neexkluzivně; registrace by způsobila neoprávněné blokování a demonetizaci Poskytovatele a ostatních držitelů licence. Porušení tohoto zákazu zakládá právo Poskytovatele na okamžité odstoupení od smlouvy a náhradu škody.

7. VEŘEJNÉ PROVOZOVÁNÍ A VYSTOUPENÍ
Nabyvatel je oprávněn veřejně provozovat Novou píseň na živých vystoupeních a koncertech s celkovým hrubým příjmem z vystoupení nepřesahujícím ekvivalent 2 000 USD.

8. AUTORSKÝ PODÍL, OSA A NAKLADATELSKÁ PRÁVA
Ohledně hudební kompozice Nové písně smluvní strany sjednávají standardní hudební dělení:
• Hudba / Beat (Poskytovatel): 50 % autorského podílu (Writer's Share) a 50 % nakladatelského podílu (Publisher's Share).
• Text / Vokál (Nabyvatel): 50 % autorského podílu (Writer's Share) a 50 % nakladatelského podílu (Publisher's Share).
• Při registraci Nové písně u organizací kolektivní správy práv (OSA, BMI, ASCAP, SOZA apod.) je Nabyvatel povinen uvést Poskytovatele (Vojtěch Vojkovský / VOODOO808) jako autora hudby s podílem 50 %.
• Příjmy z masteru (streamy a prodeje nahrávky) v povoleném limitu náleží v plné výši Nabyvateli.

9. UVEDENÍ AUTORSTVÍ
V souladu s § 11 odst. 2 autorského zákona je Nabyvatel povinen uvádět autorství Poskytovatele:
• V názvu skladby a metadatech: „[Název skladby] (Prod. VOODOO808)“ nebo „Prod. by VOODOO808“.
• V metadatech streamovacích platforem a na obalu: Producent: VOODOO808.

10. ODMĚNA ZA LICENCI A PŘEDÁNÍ DÍLA
Jako protiplnění za udělení licence se Nabyvatel zavazuje uhradit jednorázovou odměnu ve výši {{CENA}}, jejíž přijetí Poskytovatel tímto potvrzuje. Poskytovatel předá Beat v audio formátu vysoké kvality elektronicky na e-mail sdělený Nabyvatelem.

11. ZÁRUKY A PŮVODNOST
Poskytovatel zaručuje, že Beat je původním hudebním dílem vytvořeným Poskytovatelem a neporušuje autorská práva třetích osob. Nabyvatel zaručuje, že jím doplněný text, vokály a další prvky jsou původní a nezasahují do práv třetích osob.

12. NEPŘEVODITELNOST A VÝHRADA PRÁV
Tato licence je nepřevoditelná na třetí osoby bez předchozího písemného souhlasu Poskytovatele (§ 2375 občanského zákoníku). Poskytovatel si vyhrazuje veškerá práva výslovně neudělená a zůstává výlučným vlastníkem Beatu s právem pokračovat v neexkluzivním licencování Beatu dalším zájemcům.

13. ROZHODNÉ PRÁVO A ŘEŠENÍ SPORŮ
Tato Smlouva se řídí právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník, a zákonem č. 121/2000 Sb., autorský zákon. Spory budou řešeny přednostně smírnou cestou, případně věcně a místně příslušnými soudy České republiky.

14. ELEKTRONICKÉ UZAVŘENÍ A PLATNOST SMLOUVY
Dle § 562 zákona č. 89/2012 Sb., občanský zákoník, a evropské směrnice 2000/31/ES nabývá tato Smlouva platnosti a účinnosti okamžikem uhrazení licence a jejího elektronického vystavení Poskytovatelem. K platnosti smlouvy není vyžadován vlastnoruční listinný podpis.`;

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

    const isExclusive =
      /exclusive|výhradní|exkluzivní/i.test(licenseType.name) ||
      Boolean((licenseType as any).is_exclusive);

    // Pick appropriate language & exclusivity template
    let template: string;
    if (lang === "en") {
      template = isExclusive ? DEFAULT_EXCLUSIVE_CONTRACT_TEMPLATE_EN : DEFAULT_CONTRACT_TEMPLATE_EN;
    } else {
      if (licenseType.contract_template && licenseType.contract_template.trim().length > 50) {
        template = licenseType.contract_template;
      } else {
        template = DEFAULT_CONTRACT_TEMPLATE_CS;
      }
    }

    const today = new Date();
    const datum = lang === "en" ? formatDateEnglish(today) : formatDateCzech(today);
    const cena = lang === "en" ? formatPriceEnglish(Number(licenseType.price)) : formatPriceCzech(Number(licenseType.price));

    const filled = fillContractTemplate(template, {
      datum,
      pravniJmeno: legalName,
      umeleckeJmeno: artistName,
      adresa: email,
      beatNazev: beatTitle,
      cena,
    });

    const buffer = await contractTextToPdfBuffer(filled, beatTitle, datum, {
      language: lang,
      licenseName: licenseType.name,
      isExclusive,
    });

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
