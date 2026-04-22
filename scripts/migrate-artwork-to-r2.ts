/**
 * One-time migration: copy artwork + audio previews from Backblaze B2 into Cloudflare R2,
 * then rewrite the URLs stored in the database so the public site loads from R2.
 *
 * Safe to re-run: it skips anything already on R2.
 *
 * Usage (with the production DATABASE_URL exported in the shell):
 *   node_modules/.bin/tsx scripts/migrate-artwork-to-r2.ts
 *
 * Optional flags:
 *   --dry-run        Print what would change without touching R2 or the database.
 *   --table=beats    Only migrate one table. Repeatable. Defaults to all.
 */

import { pool } from "../server/src/db.js";
import {
  uploadFile,
  getPublicUrl,
  STORAGE_BUCKETS,
  R2_IS_ENABLED,
} from "../server/src/lib/storage.js";
import { v4 as uuidv4 } from "uuid";

const DRY_RUN = process.argv.includes("--dry-run");
const tableFlags = process.argv
  .filter((a) => a.startsWith("--table="))
  .map((a) => a.replace("--table=", ""));

const B2_PUBLIC = (process.env.B2_PUBLIC_BASE_URL || "").replace(/\/$/, "");
const B2_ENDPOINT = process.env.B2_ENDPOINT || "";
const R2_PUBLIC = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/$/, "");

if (!R2_IS_ENABLED) {
  console.error("❌ R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL.");
  process.exit(1);
}

function isR2Url(url: string): boolean {
  return !!R2_PUBLIC && url.startsWith(R2_PUBLIC);
}

function isB2Url(url: string): boolean {
  if (!url) return false;
  if (B2_PUBLIC && url.startsWith(B2_PUBLIC)) return true;
  if (B2_ENDPOINT && url.includes(B2_ENDPOINT)) return true;
  // Bare key (no protocol) — legacy stored as just an object key
  if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) return true;
  return false;
}

function isLocalOrExternal(url: string): boolean {
  if (!url) return true;
  if (url.startsWith("/")) return true; // local /uploads/...
  if (/drive\.google\.com|dropbox\.com|wetransfer\.com/i.test(url)) return true;
  return false;
}

function extOf(url: string): string {
  const clean = url.split("?")[0];
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "bin";
}

function guessContentType(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
  };
  return map[ext] || "application/octet-stream";
}

const cache = new Map<string, string>();
let copied = 0;
let skipped = 0;
let failed = 0;

async function copyToR2(originalUrl: string): Promise<string | null> {
  if (!originalUrl) return null;
  if (isR2Url(originalUrl)) return originalUrl;
  if (isLocalOrExternal(originalUrl)) return originalUrl;
  if (!isB2Url(originalUrl)) return originalUrl;

  if (cache.has(originalUrl)) return cache.get(originalUrl)!;

  // Build the actual fetch URL — handle bare keys
  const fetchUrl = /^https?:\/\//i.test(originalUrl)
    ? originalUrl
    : (B2_PUBLIC ? `${B2_PUBLIC}/${originalUrl}` : `https://${B2_ENDPOINT}/${process.env.B2_PREVIEW_BUCKET}/${originalUrl}`);

  try {
    const resp = await fetch(fetchUrl);
    if (!resp.ok) {
      console.warn(`  ⚠️  fetch ${resp.status} ${fetchUrl}`);
      failed++;
      return null;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    const ext = extOf(fetchUrl);
    const key = `${uuidv4()}.${ext}`;
    if (DRY_RUN) {
      console.log(`  [dry] would copy ${fetchUrl} -> r2://${STORAGE_BUCKETS.ARTWORK}/${key} (${buf.length}B)`);
      const url = getPublicUrl(STORAGE_BUCKETS.ARTWORK, key);
      cache.set(originalUrl, url);
      copied++;
      return url;
    }
    await uploadFile(STORAGE_BUCKETS.ARTWORK, key, buf, guessContentType(ext));
    const newUrl = getPublicUrl(STORAGE_BUCKETS.ARTWORK, key);
    cache.set(originalUrl, newUrl);
    copied++;
    console.log(`  ✓ ${fetchUrl}\n    -> ${newUrl}`);
    return newUrl;
  } catch (err) {
    console.warn(`  ⚠️  copy failed for ${originalUrl}: ${(err as Error).message}`);
    failed++;
    return null;
  }
}

async function migrateScalar(
  table: string,
  idCol: string,
  col: string,
  rows: Array<Record<string, any>>
) {
  for (const row of rows) {
    const original = row[col];
    if (!original || typeof original !== "string") continue;
    if (isR2Url(original) || isLocalOrExternal(original) || !isB2Url(original)) {
      skipped++;
      continue;
    }
    const newUrl = await copyToR2(original);
    if (!newUrl || newUrl === original) continue;
    if (DRY_RUN) continue;
    await pool.query(`UPDATE ${table} SET ${col} = $1 WHERE ${idCol} = $2`, [newUrl, row[idCol]]);
  }
}

async function migrateArray(
  table: string,
  idCol: string,
  col: string,
  rows: Array<Record<string, any>>
) {
  for (const row of rows) {
    const arr: unknown = row[col];
    if (!Array.isArray(arr) || arr.length === 0) continue;
    let changed = false;
    const next: string[] = [];
    for (const item of arr) {
      if (typeof item !== "string" || !isB2Url(item) || isR2Url(item) || isLocalOrExternal(item)) {
        next.push(item as string);
        skipped++;
        continue;
      }
      const newUrl = await copyToR2(item);
      if (newUrl && newUrl !== item) {
        next.push(newUrl);
        changed = true;
      } else {
        next.push(item);
      }
    }
    if (changed && !DRY_RUN) {
      await pool.query(`UPDATE ${table} SET ${col} = $1 WHERE ${idCol} = $2`, [next, row[idCol]]);
    }
  }
}

async function migrateSettings() {
  const result = await pool.query(
    "SELECT key, value FROM settings WHERE key IN ('header_logo','seo_og_image','ig_story_logo_url')"
  );
  for (const row of result.rows) {
    const original = row.value;
    if (!original || typeof original !== "string") continue;
    if (isR2Url(original) || isLocalOrExternal(original) || !isB2Url(original)) {
      skipped++;
      continue;
    }
    const newUrl = await copyToR2(original);
    if (newUrl && newUrl !== original && !DRY_RUN) {
      await pool.query("UPDATE settings SET value = $1 WHERE key = $2", [newUrl, row.key]);
    }
  }
}

async function main() {
  const tables = tableFlags.length ? tableFlags : ["beats", "sound_kits", "assets", "settings"];
  console.log(`R2 bucket: ${STORAGE_BUCKETS.ARTWORK}`);
  console.log(`R2 public base: ${R2_PUBLIC}`);
  console.log(`Tables: ${tables.join(", ")}${DRY_RUN ? "  [DRY RUN]" : ""}`);
  console.log("");

  if (tables.includes("beats")) {
    console.log("== beats ==");
    const r = await pool.query("SELECT id, artwork_url, preview_url FROM beats");
    await migrateScalar("beats", "id", "artwork_url", r.rows);
    await migrateScalar("beats", "id", "preview_url", r.rows);
  }

  if (tables.includes("sound_kits")) {
    console.log("== sound_kits ==");
    const r = await pool.query("SELECT id, artwork_url, preview_url, preview_urls FROM sound_kits");
    await migrateScalar("sound_kits", "id", "artwork_url", r.rows);
    await migrateScalar("sound_kits", "id", "preview_url", r.rows);
    await migrateArray("sound_kits", "id", "preview_urls", r.rows);
  }

  if (tables.includes("assets")) {
    console.log("== assets ==");
    const r = await pool.query("SELECT id, url FROM assets");
    await migrateScalar("assets", "id", "url", r.rows);
  }

  if (tables.includes("settings")) {
    console.log("== settings ==");
    await migrateSettings();
  }

  console.log("");
  console.log(`Done. Copied: ${copied}, skipped: ${skipped}, failed: ${failed}.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
