import { pool } from "../db.js";
import fs from "fs";
import path from "path";

/**
 * This migration fixes beat preview_url values in the database to match 
 * actual files on disk at /app/public/uploads/beats/
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
    const beatsResult = await pool.query("SELECT id, title, preview_url FROM beats WHERE is_published = true ORDER BY id");
    const beats = beatsResult.rows;
    console.log(`Found ${beats.length} published beats in database\n`);

    let updated = 0;

    for (const beat of beats) {
      const { id, title, preview_url } = beat;
      
      // Try to find a matching file by extracting the base name pattern
      // Most files follow pattern: "prefix-param1-param2-...-timestamp.mp3"
      // where timestamp is either 13 digits or 8 hex chars
      
      // Normalize title for matching
      const titleNorm = title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^\w_-]/g, '');

      let bestMatch = null;
      let matchingFile = null;

      // Exact match first: file starts with title
      matchingFile = files.find(f => 
        f.toLowerCase().startsWith(titleNorm)
      );

      if (!matchingFile) {
        // Fuzzy match: file contains most of the title words
        const titleWords = titleNorm.split(/[_-]/).filter(w => w.length > 2);
        matchingFile = files.find(f => {
          const fileNorm = f.toLowerCase().replace(/\.mp3$/, '');
          const matches = titleWords.filter(word => fileNorm.includes(word));
          return matches.length >= Math.max(1, Math.ceil(titleWords.length * 0.6));
        });
      }

      if (matchingFile) {
        const newUrl = `/uploads/beats/${matchingFile}`;
        if (preview_url !== newUrl) {
          await pool.query("UPDATE beats SET preview_url = $1 WHERE id = $2", [newUrl, id]);
          console.log(`✓ ${id.toString().padStart(3)}: ${matchingFile}`);
          updated++;
        }
      } else {
        console.log(`✗ ${id.toString().padStart(3)}: No match for "${title}"`);
      }
    }

    console.log(`\n✅ Migration complete: ${updated} beats updated`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

fixBeatUrls().then(() => process.exit(0));
