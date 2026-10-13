import fs from "fs";
import path from "path";
import { pool } from "../db.js";
import { ensureTag } from "../lib/marketing/subscribers.js";

function parseCSV(filePath: string): string[][] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === "\"" && (c === 0 || line[c - 1] !== "\\")) {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(cur.replace(/^"|"$/g, "").trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    cells.push(cur.replace(/^"|"$/g, "").trim());
    rows.push(cells);
  }
  return rows;
}

interface ImportCustomer {
  email: string;
  name: string | null;
  optinTime: Date;
  status: "subscribed" | "legacy-unsubscribed" | "legacy-cleaned";
  tags: string[];
}

export async function importLegacyCustomers() {
  const dir = path.resolve(process.cwd(), "server/data/segment_preview_export_201f63783f");
  if (!fs.existsSync(dir)) {
    throw new Error(`Data directory not found at ${dir}`);
  }

  const subFile = path.join(dir, "subscribed_email_segment_preview_export_201f63783f.csv");
  const unsubFile = path.join(dir, "unsubscribed_email_segment_preview_export_201f63783f.csv");
  const cleanFile = path.join(dir, "cleaned_email_segment_preview_export_201f63783f.csv");

  const subRows = parseCSV(subFile);
  const unsubRows = parseCSV(unsubFile);
  const cleanRows = parseCSV(cleanFile);

  const customers: ImportCustomer[] = [];

  for (const r of subRows) {
    const email = (r[0] || "").trim();
    if (!email || !email.includes("@")) continue;
    const first = (r[1] || "").trim();
    const last = (r[2] || "").trim();
    const name = [first, last].filter(Boolean).join(" ") || null;
    const optin = r[7] ? new Date(r[7]) : new Date();
    customers.push({
      email,
      name,
      optinTime: isNaN(optin.getTime()) ? new Date() : optin,
      status: "subscribed",
      tags: ["customer", "sales", "v1-customer"],
    });
  }

  for (const r of unsubRows) {
    const email = (r[0] || "").trim();
    if (!email || !email.includes("@")) continue;
    const first = (r[1] || "").trim();
    const last = (r[2] || "").trim();
    const name = [first, last].filter(Boolean).join(" ") || null;
    const optin = r[7] ? new Date(r[7]) : new Date();
    customers.push({
      email,
      name,
      optinTime: isNaN(optin.getTime()) ? new Date() : optin,
      status: "legacy-unsubscribed",
      tags: ["customer", "sales", "v1-customer", "legacy-unsubscribed"],
    });
  }

  for (const r of cleanRows) {
    const email = (r[0] || "").trim();
    if (!email || !email.includes("@")) continue;
    const first = (r[1] || "").trim();
    const last = (r[2] || "").trim();
    const name = [first, last].filter(Boolean).join(" ") || null;
    const optin = r[7] ? new Date(r[7]) : new Date();
    customers.push({
      email,
      name,
      optinTime: isNaN(optin.getTime()) ? new Date() : optin,
      status: "legacy-cleaned",
      tags: ["customer", "sales", "v1-customer", "legacy-cleaned"],
    });
  }

  console.log(`📦 Loaded ${customers.length} total customers from CSV files.`);

  // Ensure all tags exist
  const tagCache: Record<string, number> = {};
  for (const tagName of ["customer", "sales", "v1-customer", "legacy-unsubscribed", "legacy-cleaned"]) {
    const t = await ensureTag(tagName);
    tagCache[tagName] = t.id;
  }

  const beforeCountRes = await pool.query("SELECT COUNT(*) FROM subscribers");
  const beforeCount = parseInt(beforeCountRes.rows[0].count, 10);
  console.log(`📊 Subscribers count in database before import: ${beforeCount}`);

  let inserted = 0;
  let updated = 0;
  let tagsLinked = 0;

  for (const c of customers) {
    const emailNorm = c.email.toLowerCase().trim();

    const upsertRes = await pool.query<{ id: number; xmax: string }>(
      `INSERT INTO subscribers (
         email,
         email_normalized,
         name,
         first_source,
         is_buyer,
         marketing_consent,
         marketing_consent_at,
         marketing_consent_source,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, 'voodoo808_v1', TRUE, TRUE, $4, 'voodoo808_v1_sales', $4, CURRENT_TIMESTAMP)
       ON CONFLICT (email_normalized) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, subscribers.name),
         is_buyer = TRUE,
         marketing_consent = TRUE,
         marketing_consent_at = COALESCE(subscribers.marketing_consent_at, EXCLUDED.marketing_consent_at),
         marketing_consent_source = COALESCE(subscribers.marketing_consent_source, EXCLUDED.marketing_consent_source),
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, (xmax = 0) AS is_insert`,
      [c.email, emailNorm, c.name, c.optinTime]
    );

    const subscriberId = upsertRes.rows[0].id;
    const isInsert = (upsertRes.rows[0] as any).is_insert;
    if (isInsert) inserted++;
    else updated++;

    // Add tags
    for (const tagSlug of c.tags) {
      const tagId = tagCache[tagSlug];
      if (tagId) {
        await pool.query(
          "INSERT INTO subscriber_tags (subscriber_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [subscriberId, tagId]
        );
        tagsLinked++;
      }
    }
  }

  const afterCountRes = await pool.query("SELECT COUNT(*) FROM subscribers");
  const afterCount = parseInt(afterCountRes.rows[0].count, 10);
  const buyerCountRes = await pool.query("SELECT COUNT(*) FROM subscribers WHERE is_buyer = TRUE");
  const buyerCount = parseInt(buyerCountRes.rows[0].count, 10);
  const consentCountRes = await pool.query("SELECT COUNT(*) FROM subscribers WHERE marketing_consent = TRUE");
  const consentCount = parseInt(consentCountRes.rows[0].count, 10);

  console.log("\n=========================================");
  console.log("✅ Customer Import Completed Successfully!");
  console.log("=========================================");
  console.log(`• Total CSV records processed: ${customers.length}`);
  console.log(`  - Subscribed: ${subRows.length}`);
  console.log(`  - Legacy Unsubscribed: ${unsubRows.length}`);
  console.log(`  - Legacy Cleaned/Bounced: ${cleanRows.length}`);
  console.log(`• Subscribers inserted newly: ${inserted}`);
  console.log(`• Subscribers updated: ${updated}`);
  console.log(`• Tag links created: ${tagsLinked}`);
  console.log(`• Total subscribers now in DB: ${afterCount} (was ${beforeCount})`);
  console.log(`• Total buyer customers in DB: ${buyerCount}`);
  console.log(`• Total marketing consented in DB: ${consentCount}`);
  console.log("=========================================\n");
}

if (process.argv[1]?.endsWith("importCustomers.ts") || process.argv[1]?.endsWith("importCustomers.js")) {
  importLegacyCustomers()
    .then(() => pool.end())
    .catch((err) => {
      console.error("❌ Import failed:", err);
      process.exit(1);
    });
}
