import fs from "fs";
import pg from "pg";
const { Pool } = pg;

// Read database URL from .env
const envContent = fs.readFileSync(".env", "utf8");
const dbMatch = envContent.match(/DATABASE_URL=(.+)/);
if (!dbMatch) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
const connectionString = dbMatch[1].trim();
const pool = new Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
});

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function readCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ""));
  const emailIdx = header.indexOf("Email Address");
  const firstIdx = header.indexOf("First Name");
  const lastIdx = header.indexOf("Last Name");
  const optinIdx = header.indexOf("OPTIN_TIME");
  const confirmIdx = header.indexOf("CONFIRM_TIME");

  const records = [];
  const seen = new Set();
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const email = (row[emailIdx] || "").trim().toLowerCase();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);

    const firstName = (row[firstIdx] || "").trim();
    const lastName = (row[lastIdx] || "").trim();
    const name = [firstName, lastName].filter(Boolean).join(" ").trim() || null;
    const optinTime = (row[confirmIdx] || row[optinIdx] || "").trim() || null;

    records.push({ email, name, optinTime });
  }
  return records;
}

async function run() {
  console.log("=== Starting Audience Bulk Import ===");
  const baseDir = "/Users/voodoo808/Downloads/audience_export_d2f83d6160";

  const subscribedRecords = readCSV(`${baseDir}/subscribed_email_audience_export_d2f83d6160.csv`);
  const unsubscribedRecords = readCSV(`${baseDir}/unsubscribed_email_audience_export_d2f83d6160.csv`);
  const cleanedRecords = readCSV(`${baseDir}/cleaned_email_audience_export_d2f83d6160.csv`);

  console.log(`Found:
  - ${subscribedRecords.length} unique subscribed contacts
  - ${unsubscribedRecords.length} unique unsubscribed contacts
  - ${cleanedRecords.length} unique cleaned / bounced contacts
  `);

  const client = await pool.connect();
  try {
    // Ensure tags exist
    console.log("Ensuring tags exist...");
    const requiredTags = ["freebie", "beatstars", "imported", "subscribed", "unsubscribed"];
    const tagIdMap = {};
    for (const tagName of requiredTags) {
      const res = await client.query(
        "INSERT INTO tags (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id",
        [tagName, tagName]
      );
      tagIdMap[tagName] = res.rows[0].id;
    }

    // 1. Bulk import subscribed contacts
    console.log("Importing subscribed contacts in bulk chunks...");
    const chunkSize = 250;
    let totalImportedSub = 0;

    for (let i = 0; i < subscribedRecords.length; i += chunkSize) {
      const chunk = subscribedRecords.slice(i, i + chunkSize);
      
      // Build parameterized bulk query
      const valueRows = [];
      const params = [];
      let paramIdx = 1;

      for (const rec of chunk) {
        const optinDate = rec.optinTime ? new Date(rec.optinTime) : new Date();
        const validOptin = isNaN(optinDate.getTime()) ? new Date() : optinDate;

        valueRows.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, TRUE, $${paramIdx + 3}, 'beatstars_import', 'beatstars_free_download', 'beatstars', FALSE, $${paramIdx + 3}, NOW())`);
        params.push(rec.email, rec.email, rec.name, validOptin);
        paramIdx += 4;
      }

      const query = `
        INSERT INTO subscribers 
          (email, email_normalized, name, marketing_consent, marketing_consent_at, marketing_consent_source, first_source, first_freebie, is_buyer, created_at, updated_at)
        VALUES ${valueRows.join(", ")}
        ON CONFLICT (email_normalized) DO UPDATE SET
          marketing_consent = CASE WHEN subscribers.unsubscribed_at IS NULL THEN TRUE ELSE subscribers.marketing_consent END,
          marketing_consent_source = COALESCE(subscribers.marketing_consent_source, 'beatstars_import'),
          name = COALESCE(subscribers.name, EXCLUDED.name),
          updated_at = NOW()
        RETURNING id;
      `;

      const subRes = await client.query(query, params);
      const insertedIds = subRes.rows.map((r) => r.id);
      totalImportedSub += insertedIds.length;

      // Bulk link tags: freebie, beatstars, imported, subscribed
      const tagRows = [];
      const tagParams = [];
      let tagParamIdx = 1;
      const targetTags = ["freebie", "beatstars", "imported", "subscribed"];

      for (const subId of insertedIds) {
        for (const t of targetTags) {
          tagRows.push(`($${tagParamIdx}, $${tagParamIdx + 1})`);
          tagParams.push(subId, tagIdMap[t]);
          tagParamIdx += 2;
        }
      }

      if (tagRows.length > 0) {
        await client.query(
          `INSERT INTO subscriber_tags (subscriber_id, tag_id)
           VALUES ${tagRows.join(", ")}
           ON CONFLICT DO NOTHING`,
          tagParams
        );
      }

      console.log(`  Processed ${Math.min(i + chunkSize, subscribedRecords.length)} / ${subscribedRecords.length} subscribed...`);
    }

    // 2. Unsubscribed contacts
    console.log("Importing unsubscribed contacts...");
    for (const rec of unsubscribedRecords) {
      const res = await client.query(
        `INSERT INTO subscribers 
         (email, email_normalized, name, marketing_consent, first_source, first_freebie, is_buyer, unsubscribed_at, unsubscribe_reason, created_at, updated_at)
         VALUES ($1, $2, $3, FALSE, 'beatstars_free_download', 'beatstars', FALSE, NOW(), 'beatstars_export_unsubscribed', NOW(), NOW())
         ON CONFLICT (email_normalized) DO UPDATE SET
           marketing_consent = FALSE,
           unsubscribed_at = COALESCE(subscribers.unsubscribed_at, NOW()),
           unsubscribe_reason = COALESCE(subscribers.unsubscribe_reason, 'beatstars_export_unsubscribed'),
           updated_at = NOW()
         RETURNING id`,
        [rec.email, rec.email, rec.name]
      );
      const subId = res.rows[0]?.id;
      if (subId) {
        for (const t of ["freebie", "beatstars", "imported", "unsubscribed"]) {
          await client.query(
            "INSERT INTO subscriber_tags (subscriber_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [subId, tagIdMap[t]]
          );
        }
      }
    }

    // 3. Cleaned / bounced contacts
    console.log("Importing cleaned / bounced contacts...");
    for (const rec of cleanedRecords) {
      await client.query(
        `INSERT INTO subscribers 
         (email, email_normalized, name, marketing_consent, first_source, first_freebie, is_buyer, suppressed_at, suppressed_reason, created_at, updated_at)
         VALUES ($1, $2, $3, FALSE, 'beatstars_free_download', 'beatstars', FALSE, NOW(), 'beatstars_export_cleaned', NOW(), NOW())
         ON CONFLICT (email_normalized) DO UPDATE SET
           suppressed_at = COALESCE(subscribers.suppressed_at, NOW()),
           suppressed_reason = COALESCE(subscribers.suppressed_reason, 'beatstars_export_cleaned'),
           updated_at = NOW()`,
        [rec.email, rec.email, rec.name]
      );
    }

    console.log("=== Import Finished Successfully ===");

    // Verify stats
    const totalRes = await client.query("SELECT COUNT(*) FROM subscribers");
    const activeRes = await client.query("SELECT COUNT(*) FROM subscribers WHERE marketing_consent = TRUE AND unsubscribed_at IS NULL AND suppressed_at IS NULL");
    const buyersRes = await client.query("SELECT COUNT(*) FROM subscribers WHERE is_buyer = TRUE");
    const freebiesRes = await client.query("SELECT COUNT(*) FROM subscribers WHERE first_source IN ('freebie_download', 'beatstars_free_download', 'checkout_free_item')");

    console.log("\n📊 New Database Stats:");
    console.log(`  Total Subscribers:     ${totalRes.rows[0].count}`);
    console.log(`  Active Marketing:      ${activeRes.rows[0].count}`);
    console.log(`  Paid Buyers:           ${buyersRes.rows[0].count}`);
    console.log(`  Free Downloaders:      ${freebiesRes.rows[0].count}`);
  } catch (err) {
    console.error("Import failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
