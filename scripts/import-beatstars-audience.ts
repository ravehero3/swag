/**
 * Import BeatStars audience to marketing_subscribers
 * Usage: npx ts-node scripts/import-beatstars-audience.ts
 * 
 * Imports 5000+ customers who downloaded free files from BeatStars
 * Tags them appropriately: freebie, beatstars, imported
 * Sets marketing_consent based on subscription status
 */

import { createReadStream } from "fs";
import { resolve } from "path";
import { parse } from "csv-parse";
import { pool } from "../server/src/db.js";

interface BeatStarsRecord {
  Email_Address: string;
  First_Name?: string;
  Last_Name?: string;
  OPTIN_TIME?: string;
  SOURCE?: string;
  TAGS?: string;
  subscribed: boolean; // We'll add this based on which file
}

async function importCSV(filePath: string, subscribed: boolean): Promise<number> {
  return new Promise((resolve, reject) => {
    let count = 0;
    const records: BeatStarsRecord[] = [];

    createReadStream(filePath)
      .pipe(
        parse({
          columns: (header) =>
            header.map((h: string) =>
              h
                .replace(/^"/, "")
                .replace(/"$/, "")
                .replace(/\s+/g, "_")
            ),
          skip_empty_lines: true,
        })
      )
      .on("data", (record) => {
        records.push({ ...record, subscribed });
      })
      .on("end", async () => {
        try {
          count = await processRecords(records, subscribed);
          resolve(count);
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
}

async function processRecords(
  records: BeatStarsRecord[],
  subscribed: boolean
): Promise<number> {
  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    try {
      const email = (record.Email_Address || "").trim().toLowerCase();

      // Validate email
      if (!email || !email.includes("@")) {
        skipped++;
        continue;
      }

      const name = [record.First_Name, record.Last_Name]
        .filter(Boolean)
        .join(" ")
        .trim() || null;

      // Check if already exists
      const existing = await pool.query(
        "SELECT id FROM subscribers WHERE email_normalized = $1",
        [email]
      );

      let subscriberId: number;

      if (existing.rows.length > 0) {
        subscriberId = existing.rows[0].id;
        // Update subscription status if needed
        if (subscribed) {
          await pool.query(
            `UPDATE subscribers 
             SET marketing_consent = TRUE, 
                 marketing_consent_at = COALESCE(marketing_consent_at, NOW()),
                 marketing_consent_source = COALESCE(marketing_consent_source, 'beatstars_import'),
                 unsubscribed_at = NULL,
                 updated_at = NOW()
             WHERE id = $1`,
            [subscriberId]
          );
        } else {
          await pool.query(
            `UPDATE subscribers 
             SET unsubscribed_at = COALESCE(unsubscribed_at, NOW()),
                 unsubscribe_reason = 'beatstars_export_unsubscribed',
                 updated_at = NOW()
             WHERE id = $1`,
            [subscriberId]
          );
        }
      } else {
        // Insert new subscriber
        const insertResult = await pool.query(
          `INSERT INTO subscribers 
           (email, email_normalized, name, marketing_consent, marketing_consent_at, marketing_consent_source, first_source, unsubscribed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            email,
            email,
            name,
            subscribed, // marketing_consent = subscribed status
            subscribed ? new Date().toISOString() : null,
            "beatstars_import",
            "beatstars_free_download",
            subscribed ? null : new Date().toISOString(),
          ]
        );
        subscriberId = insertResult.rows[0].id;
      }

      // Add tags
      await addTag(subscriberId, "freebie");
      await addTag(subscriberId, "beatstars");
      await addTag(subscriberId, "imported");

      // Add source tag based on file
      if (subscribed) {
        await addTag(subscriberId, "subscribed");
      } else {
        await addTag(subscriberId, "unsubscribed");
      }

      imported++;

      // Log progress every 500
      if (imported % 500 === 0) {
        console.log(
          `[BeatStars Import] Processed ${imported} records from ${subscribed ? "subscribed" : "unsubscribed"} file...`
        );
      }
    } catch (err) {
      console.error(`[BeatStars Import] Error processing record:`, err);
      skipped++;
    }
  }

  console.log(
    `[BeatStars Import] ${subscribed ? "Subscribed" : "Unsubscribed"} file: imported=${imported}, skipped=${skipped}`
  );
  return imported;
}

async function addTag(subscriberId: number, tagName: string): Promise<void> {
  try {
    // Ensure tag exists
    const tagResult = await pool.query(
      "INSERT INTO tags (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id",
      [tagName, tagName.toLowerCase()]
    );

    const tagId = tagResult.rows[0].id;

    // Add to subscriber
    await pool.query(
      "INSERT INTO subscriber_tags (subscriber_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [subscriberId, tagId]
    );
  } catch (err) {
    console.error(`[BeatStars Import] Error adding tag ${tagName}:`, err);
  }
}

async function main() {
  try {
    console.log("[BeatStars Import] Starting import of BeatStars audience...");
    const startTime = Date.now();

    const basePath = resolve(
      "/Users/voodoo808/Downloads/audience_export_d2f83d6160"
    );

    // Import subscribed (active customers)
    console.log(
      "[BeatStars Import] Importing subscribed emails (active customers)..."
    );
    const subscribedCount = await importCSV(
      `${basePath}/subscribed_email_audience_export_d2f83d6160.csv`,
      true
    );

    // Import unsubscribed (inactive customers)
    console.log(
      "[BeatStars Import] Importing unsubscribed emails (inactive customers)..."
    );
    const unsubscribedCount = await importCSV(
      `${basePath}/unsubscribed_email_audience_export_d2f83d6160.csv`,
      false
    );

    // Get final stats
    const statsResult = await pool.query(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE marketing_consent = TRUE) as active,
         COUNT(*) FILTER (WHERE unsubscribed_at IS NOT NULL) as inactive
       FROM subscribers WHERE first_source = 'beatstars_free_download'`
    );

    const stats = statsResult.rows[0];
    const duration = (Date.now() - startTime) / 1000;

    console.log("\n✅ BeatStars Audience Import Complete!");
    console.log("═".repeat(60));
    console.log(
      `Total Imported:        ${subscribedCount + unsubscribedCount} customers`
    );
    console.log(`Active (Subscribed):   ${subscribedCount} customers`);
    console.log(`Inactive (Unsubscr):   ${unsubscribedCount} customers`);
    console.log(`Total in Database:     ${stats.total}`);
    console.log(`Active in Database:    ${stats.active}`);
    console.log(`Inactive in Database:  ${stats.inactive}`);
    console.log(`Duration:              ${duration.toFixed(2)}s`);
    console.log("═".repeat(60));
    console.log("\n📊 Tags Applied:");
    console.log("   - freebie (free download source)");
    console.log("   - beatstars (source platform)");
    console.log("   - imported (bulk import)");
    console.log("   - subscribed/unsubscribed (current status)");
    console.log("\n🎯 These customers can now be:");
    console.log("   - Enrolled in Free Beat/Kit Onboarding journeys");
    console.log("   - Targeted with re-engagement campaigns");
    console.log("   - Segmented by subscription status");
    console.log("   - Added to marketing campaigns");

    process.exit(0);
  } catch (err) {
    console.error("[BeatStars Import] Fatal error:", err);
    process.exit(1);
  }
}

main();
