/**
 * Audio analysis: extracts BPM and musical key from an audio file or URL.
 *
 * Strategy:
 *  1. Read embedded ID3/vorbis metadata (music-metadata) — fast, reliable for DAW exports
 *  2. Fallback: ffmpeg-decoded PCM → energy-envelope autocorrelation (BPM)
 *                                   → Goertzel chromagram + Krumhansl-Schmuckler (Key)
 */

import { spawn } from "child_process";
import { createRequire } from "module";
import path from "path";
import fs from "fs";

// ---------- constants -------------------------------------------------------

// Krumhansl-Schmuckler 1982 key profiles
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const PC    = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

// ---------- helpers ---------------------------------------------------------

function getFfmpegPath(): string {
  try {
    const require = createRequire(import.meta.url);
    const p = require("ffmpeg-static");
    if (p && typeof p === "string") return p;
  } catch { /* fall through */ }
  return "ffmpeg";
}

function resolveInput(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) return path.join(process.cwd(), "public", url);
  return url;
}

/**
 * Decode audio to mono Float32 PCM at `sr` Hz.
 * Optionally capped to the first `maxSecs` seconds.
 */
function decodePCM(url: string, sr: number, maxSecs?: number): Promise<Float32Array | null> {
  const ffmpegPath = getFfmpegPath();
  const input = resolveInput(url);
  const args: string[] = ["-i", input];
  if (maxSecs) args.push("-t", String(maxSecs));
  args.push("-ac", "1", "-ar", String(sr), "-f", "f32le", "pipe:1");

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => { proc.kill(); resolve(null); }, 120_000);

    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "ignore"] });
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 || chunks.length === 0) return resolve(null);
      const raw = Buffer.concat(chunks);
      resolve(new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4));
    });
    proc.on("error", () => { clearTimeout(timer); resolve(null); });
  });
}

// ---------- BPM detection ---------------------------------------------------

/**
 * Energy-envelope autocorrelation beat tracker.
 * Returns BPM in [60, 200] or null.
 */
function detectBPM(pcm: Float32Array, sr: number): number | null {
  // RMS energy envelope at ~200 fps
  const frameLen = Math.max(1, Math.floor(sr / 200));
  const envLen   = Math.floor(pcm.length / frameLen);
  if (envLen < 120) return null;

  const env = new Float32Array(envLen);
  for (let i = 0; i < envLen; i++) {
    let sum = 0;
    const base = i * frameLen;
    for (let j = 0; j < frameLen; j++) sum += pcm[base + j] ** 2;
    env[i] = Math.sqrt(sum / frameLen);
  }

  // Half-wave rectified first-difference → onset strength function
  const odf = new Float32Array(envLen);
  for (let i = 1; i < envLen; i++) odf[i] = Math.max(0, env[i] - env[i - 1]);

  // Autocorrelation in BPM range [55, 210] (lags in samples at 200 fps)
  const minLag = Math.max(1, Math.floor(200 * 60 / 210)); // fastest tempo
  const maxLag = Math.ceil(200 * 60 / 55);                // slowest tempo
  const n = envLen - maxLag;
  if (n < 10) return null;

  let bestCorr = -1, bestLag = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < n; i++) corr += odf[i] * odf[i + lag];
    if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
  }
  if (bestLag < 1) return null;

  // Convert lag (frames at 200 fps) → BPM
  let bpm = Math.round((200 * 60) / bestLag);

  // Fold into [70, 170]
  while (bpm > 175) bpm = Math.round(bpm / 2);
  while (bpm < 65)  bpm = bpm * 2;

  return (bpm >= 55 && bpm <= 220) ? bpm : null;
}

// ---------- Key detection ---------------------------------------------------

/**
 * Goertzel-based chromagram → Krumhansl-Schmuckler key finding.
 * Returns e.g. "Am", "C#", "Gm" or null.
 */
function detectKey(pcm: Float32Array, sr: number): string | null {
  const frameLen = 4096;
  const numFrames = Math.floor(pcm.length / frameLen);
  if (numFrames < 2) return null;

  const chroma = new Float32Array(12);

  // MIDI 36 (C2 ≈ 65 Hz) through MIDI 84 (C6 ≈ 1047 Hz)
  for (let f = 0; f < numFrames; f++) {
    const base = f * frameLen;
    for (let midi = 36; midi <= 84; midi++) {
      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      if (freq >= sr / 2) continue;

      // Goertzel DFT at `freq`
      const omega = (2 * Math.PI * freq) / sr;
      const coeff = 2 * Math.cos(omega);
      let s1 = 0, s2 = 0;
      for (let n = 0; n < frameLen; n++) {
        const s0 = (pcm[base + n] || 0) + coeff * s1 - s2;
        s2 = s1; s1 = s0;
      }
      const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
      chroma[midi % 12] += Math.sqrt(Math.max(0, power));
    }
  }

  // Normalize
  const maxC = Math.max(...chroma);
  if (maxC < 1e-10) return null;
  const cn = Array.from(chroma).map(v => v / maxC);

  // K-S profile correlation
  let bestScore = -Infinity, bestKey = "";
  for (let root = 0; root < 12; root++) {
    let maj = 0, min = 0;
    for (let i = 0; i < 12; i++) {
      maj += cn[i] * MAJOR[(i - root + 12) % 12];
      min += cn[i] * MINOR[(i - root + 12) % 12];
    }
    if (maj > bestScore) { bestScore = maj; bestKey = PC[root]; }
    if (min > bestScore) { bestScore = min; bestKey = PC[root] + "m"; }
  }

  return bestKey || null;
}

// ---------- public API ------------------------------------------------------

export interface AudioAnalysisResult {
  bpm:    number | null;
  key:    string | null;
  /** How the values were obtained */
  source: "metadata" | "analysis" | "mixed";
}

export async function analyzeAudio(url: string): Promise<AudioAnalysisResult> {
  let bpm: number | null = null;
  let key: string | null = null;
  let fromMeta = false;

  // ── 1. Embedded metadata (ID3 / Vorbis) ───────────────────────────────────
  try {
    // Dynamic import so the module is only loaded when needed
    const mm = await import("music-metadata") as any;

    let meta: any;
    if (/^https?:\/\//i.test(url)) {
      // Fetch the first 512 KB — enough for most ID3 headers
      const resp = await fetch(url, { headers: { Range: "bytes=0-524287" } });
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer());
        meta = await mm.parseBuffer(buf);
      }
    } else {
      const fPath = url.startsWith("/uploads/")
        ? path.join(process.cwd(), "public", url)
        : url;
      if (fs.existsSync(fPath)) meta = await mm.parseFile(fPath);
    }

    if (meta?.common?.bpm) bpm = Math.round(Number(meta.common.bpm));
    if (meta?.common?.key)  key = String(meta.common.key);
    if (bpm || key) fromMeta = true;
    if (bpm && key) return { bpm, key, source: "metadata" };
  } catch (e) {
    console.error("[AudioAnalysis] metadata error:", e);
  }

  // ── 2. FFmpeg-based audio analysis (fallback) ─────────────────────────────
  try {
    if (!bpm) {
      // 8 kHz mono, first 90 s — sufficient for beat tracking
      const pcm = await decodePCM(url, 8000, 90);
      if (pcm) bpm = detectBPM(pcm, 8000);
    }
    if (!key) {
      // 11025 Hz mono, first 60 s — sufficient for chroma analysis
      const pcm = await decodePCM(url, 11025, 60);
      if (pcm) key = detectKey(pcm, 11025);
    }
  } catch (e) {
    console.error("[AudioAnalysis] analysis error:", e);
  }

  return {
    bpm,
    key,
    source: fromMeta ? "mixed" : "analysis",
  };
}
