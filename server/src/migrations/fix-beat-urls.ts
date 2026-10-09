import { pool } from "../db.js";
import fs from "fs";
import path from "path";

/**
 * This migration fixes beat preview_url values in the database to match 
 * actual files on disk at /app/public/uploads/beats/
 * 
 * Problem: Beats were stored with wrong filenames in the database.
 * Solution: Match beat titles to filenames on disk and update URLs.
 */

async function fixBeatUrls() {
  try {
    const beatsDir = "/app/public/uploads/beats";
    
    if (!fs.existsSync(beatsDir)) {
      console.log(`❌ Beats directory not found: ${beatsDir}`);
      return;
    }

    // Get all .mp3 files from disk
    const files = fs.readdirSync(beatsDir).filter(f => f.endsWith('.mp3'));
    console.log(`Found ${files.length} beat files on disk`);

    // Get all beats from database
    const beatsResult = await pool.query("SELECT id, title, preview_url FROM beats ORDER BY id");
    const beats = beatsResult.rows;
    console.log(`Found ${beats.length} beats in database`);

    let updated = 0;

    for (const beat of beats) {
      const { id, title, preview_url } = beat;
      
      // Try to find a matching file by title
      // Remove special characters and match fuzzy
      const titleNorm = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim();

      const matchingFile = files.find(f => {
        const fileNorm = f
          .toLowerCase()
          .replace(/\d{13,}\.mp3$/i, '.mp3') // Remove timestamps
          .replace(/[a-f0-9]{8}\.mp3$/i, '.mp3') // Remove UUIDs
          .replace(/[^\w\s-]/g, '')
          .trim();
        return fileNorm.includes(titleNorm) || titleNorm.includes(fileNorm);
      });

      if (matchingFile) {
        const newUrl = `/uploads/beats/${matchingFile}`;
        if (preview_url !== newUrl) {
          await pool.query("UPDATE beats SET preview_url = $1 WHERE id = $2", [newUrl, id]);
          console.log(`✓ Beat ${id} (${title}): ${matchingFile}`);
          updated++;
        }
      } else {
        console.log(`✗ No match for beat ${id}: "${title}"`);
      }
    }

    console.log(`\n✅ Migration complete: ${updated} beats updated`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

fixBeatUrls().then(() => process.exit(0));
