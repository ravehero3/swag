#!/usr/bin/env node
/**
 * Import BeatStars audience to marketing_subscribers
 * ESM Node.js script - no external dependencies
 * Usage: node scripts/import-beatstars-audience.js
 */

import fs from "fs";
import path from "path";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL?.includes("localhost") ||
    process.env.DATABASE_URL?.includes("127.0.0.1")
      ? undefined
      : { rejectUnauthorized: false },
  statement_timeout: 30000,
});

// Parse CSV manually (handles quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

async function importCSV(filePath, subscribed) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    console.log(`[Import] File is empty: ${filePath}`);
    return 0;
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) =>
    h.replace(/^"/, "").replace(/"$/, "")
  );

  const emailIdx = headers.findIndex((h) =>
    h.toLowerCase().includes("email")
  );
  const firstNameIdx = headers.findIndex((h) =>
    h.toLowerCase().includes("first")
  );
  const lastNameIdx = headers.findIndex((h) =>
    h.toLowerCase().includes("last")
  );

  if (emailIdx === -1) {
    console.error(`[Import] Could not find email column in ${filePath}`);
    return 0;
  }

  let imported = 0;
  let skipped = 0;

  console.log(
    `[Import] Processing ${lines.length - 1} records from ${path.basename(filePath)}...`
  );

  for (let lineNum = 1; lineNum < lines.length; lineNum++) {
    try {
      const fields = parseCSVLine(lines[lineNum]);

      const email = (fields[emailIdx] || "")
        .trim()
        .toLowerCase()
        .replace(/^"/, "")
        .replace(/"$/, "");

      // Validate email
      if (!email || !email.includes("@")) {
        skipped++;
        continue;
      }

      const firstName =
        firstNameIdx >= 0 && fields[firstNameIdx]
          ? fields[firstNameIdx]
              .trim()
              .replace(/^"/, "")
              .replace(/"$/, "")
          : null;
      const lastName =
        lastNameIdx >= 0 && fields[lastNameIdx]
          ? fields[lastNameIdx]
              .trim()
              .replace(/^"/, "")
              .replace(/"$/, "")
          : null;
      const name = [firstName, lastName].filter(Boolean).join(" ") || null;

      // Check if already exists
      const existing = await pool.query(
        "SELECT id FROM subscribers WHERE email_normalized = $1",
        [email]
      );

      let subscriberId;

      if (existing.rows.length > 0) {
        subscriberId = existing.rows[0].id;

        // Update subscription status
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
      const tagNames = [
        "freebie",
        "beatstars",
        "imported",
        subscribed ? "subscribed" : "unsubscribed",
      ];

      for (const tagName of tagNames) {
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
          // Tag error is non-fatal
        }
      }

      imported++;

      // Log progress every 500
      if (imported % 500 === 0) {
        console.log(
          `  [${subscribed ? "SUBSCRIBED" : "UNSUBSCRIBED"}] Progress: ${imported} imported, ${skipped} skipped...`
        );
      }
    } catch (err) {
      console.error(
        `[Import] Error processing line ${lineNum}:`,
        err.message
      );
      skipped++;
    }
  }

  console.log(
    `[Import] ${subscribed ? "Subscribed" : "Unsubscribed"}: imported=${imported}, skipped=${skipped}`
  );
  return imported;
}

async function main() {
  try {
    console.log("[Import] Starting BeatStars audience import...");
    const startTime = Date.now();

    const basePath =
      "/Users/voodoo808/Downloads/audience_export_d2f83d6160";

    // Import subscribed (active customers)
    console.log("[Import] Step 1: Importing subscribed emails (active)...");
    const subscribedCount = await importCSV(
      path.join(basePath, "subscribed_email_audience_export_d2f83d6160.csv"),
      true
    );

    // Import unsubscribed (inactive customers)
    console.log("[Import] Step 2: Importing unsubscribed emails (inactive)...");
    const unsubscribedCount = await importCSV(
      path.join(basePath, "unsubscribed_email_audience_export_d2f83d6160.csv"),
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
    console.log("═".repeat(70));
    console.log(
      `Total Imported:              ${subscribedCount + unsubscribedCount} customers`
    );
    console.log(
      `  ✓ Active (Marketing Consent):     ${subscribedCount} customers`
    );
    console.log(
      `  ✓ Inactive (Unsubscribed):      ${unsubscribedCount} customers`
    );
    console.log(`Duration:                        ${duration.toFixed(2)}s`);
    console.log("═".repeat(70));

    console.log("\n📊 Database Stats:");
    console.log(`  Total BeatStars Subscribers:     ${stats.total}`);
    console.log(`  Active (can receive email):      ${stats.active}`);
    console.log(`  Inactive (suppressed):           ${stats.inactive}`);

    console.log("\n🏷️  Tags Applied to All:");
    console.log("  ✓ freebie (free download source)");
    console.log("  ✓ beatstars (source platform)");
    console.log("  ✓ imported (bulk import)");
    console.log("  ✓ subscribed/unsubscribed (status)");

    console.log("\n🎯 What You Can Do Now:");
    console.log("  1. Create re-engagement campaign for inactive (unsubscribed)");
    console.log("  2. Enroll active subscribers in Free Beat Onboarding journey");
    console.log("  3. Send targeted campaigns to active + freebie tag");
    console.log("  4. Run analytics on engagement by source");
    console.log("  5. Segment by beatstars tag for platform-specific content");

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("[Import] Fatal error:", err);
    process.exit(1);
  }
}

main();
