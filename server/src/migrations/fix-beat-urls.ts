import { pool } from "../db.js";
import fs from "fs";
import path from "path";

/**
 * This migration fixes beat preview_url values by mapping each beat 
 * to the actual file on disk using the beat code (e.g., VB4874_6, VB4797_2).
 * 
 * Strategy: For each beat, extract the beat code from the title,
 * then find the matching .mp3 file on disk.
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
      
      // Extract beat code from title (e.g., "VB4874_6 152BPM d minor" → "vb4874_6")
      const beatCodeMatch = title.match(/^([A-Za-z0-9_-]+)/);
      if (!beatCodeMatch) {
        console.log(`✗ ${id.toString().padStart(3)}: Could not extract beat code from "${title}"`);
        continue;
      }

      const beatCode = beatCodeMatch[1].toLowerCase();
      
      // Find all files matching this beat code
      const matchingFiles = files.filter(f => 
        f.toLowerCase().startsWith(beatCode + '-') || 
        f.toLowerCase().startsWith(beatCode.replace(/_/g, '') + '-')
      );

      if (matchingFiles.length === 0) {
        console.log(`✗ ${id.toString().padStart(3)}: No file for "${title}" (code: ${beatCode})`);
        continue;
      }

      // Pick the file with the earliest timestamp (most likely the original)
      const sortedFiles = matchingFiles.sort();
      const bestFile = sortedFiles[0];
      const newUrl = `/uploads/beats/${bestFile}`;

      if (preview_url !== newUrl) {
        await pool.query("UPDATE beats SET preview_url = $1 WHERE id = $2", [newUrl, id]);
        console.log(`✓ ${id.toString().padStart(3)}: ${bestFile}`);
        updated++;
      } else {
        console.log(`= ${id.toString().padStart(3)}: Already correct`);
      }
    }

    console.log(`\n✅ Migration complete: ${updated} beats updated`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

fixBeatUrls().then(() => process.exit(0));
