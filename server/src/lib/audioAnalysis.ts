/**
 * Audio analysis: extracts BPM and musical key from an audio file or URL.
 *
 * BPM strategy (two-pass):
 *  Pass 1 — low-pass filtered PCM (≤250 Hz, 4 kHz SR)
 *            Isolates the kick drum, the most reliable tempo carrier in
 *            hip-hop / trap / electronic music, and eliminates hi-hat &
 *            snare energy that confuses simple autocorrelation.
 *  Pass 2 — full-spectrum PCM (8 kHz SR) used for cross-validation.
 *
 *  Both passes use harmonic-weighted ACF (sum ACF at lag × 1, 2, 3, 4)
 *  so the fundamental period wins over its harmonics even when a harmonic
 *  happens to carry more raw energy.
 *
 * Key strategy:
 *  Goertzel chromagram (MIDI 36-84) → Krumhansl-Schmuckler profiles.
 *
 * Metadata fast-path:
 *  Reads embedded ID3/Vorbis BPM + key tags first; falls back to the
 *  signal-processing path only when tags are absent.
 */

import { spawn } from "child_process";
import { createRequire } from "module";
import path from "path";
import fs from "fs";

// ---------- constants -------------------------------------------------------

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
 * `afFilter` is an optional ffmpeg audio-filter chain, e.g. "lowpass=f=250".
 */
function decodePCM(
  url: string,
  sr: number,
  maxSecs?: number,
  afFilter?: string,
): Promise<Float32Array | null> {
  const ffmpegPath = getFfmpegPath();
  const input = resolveInput(url);
  const args: string[] = ["-i", input];
  if (maxSecs)   args.push("-t", String(maxSecs));
  if (afFilter)  args.push("-af", afFilter);
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
 * Compute an onset-strength function (ODF) from raw PCM.
 *
 * Algorithm:
 *  1. RMS energy envelope at 200 fps
 *  2. Half-wave-rectified first difference (positive energy increases only)
 *  3. Adaptive mean subtraction with a ±0.5 s sliding window (suppresses
 *     slow amplitude drifts from intros / build-ups)
 */
function computeODF(pcm: Float32Array, sr: number): Float32Array {
  const fps     = 200;
  const frameLen = Math.max(1, Math.floor(sr / fps));
  const envLen   = Math.floor(pcm.length / frameLen);

  // 1. RMS energy envelope
  const env = new Float32Array(envLen);
  for (let i = 0; i < envLen; i++) {
    let sum = 0;
    const base = i * frameLen;
    for (let j = 0; j < frameLen; j++) sum += pcm[base + j] ** 2;
    env[i] = Math.sqrt(sum / frameLen);
  }

  // 2. Half-wave rectified first difference
  const raw = new Float32Array(envLen);
  for (let i = 1; i < envLen; i++) raw[i] = Math.max(0, env[i] - env[i - 1]);

  // 3. Adaptive mean subtraction via O(n) prefix-sum sliding window
  const halfWin = Math.round(fps / 2); // 100 frames ≈ ±0.5 s
  const prefix  = new Float32Array(envLen + 1);
  for (let i = 0; i < envLen; i++) prefix[i + 1] = prefix[i] + raw[i];

  const odf = new Float32Array(envLen);
  for (let i = 0; i < envLen; i++) {
    const lo   = Math.max(0, i - halfWin);
    const hi   = Math.min(envLen, i + halfWin + 1);
    const mean = (prefix[hi] - prefix[lo]) / (hi - lo);
    odf[i]     = Math.max(0, raw[i] - mean * 0.8); // soft threshold
  }

  return odf;
}

/**
 * Convert an onset-strength function (200 fps) → BPM using
 * harmonic-weighted autocorrelation.
 *
 * Harmonic summation:
 *   hs[lag] = acf[lag] + ½·acf[2·lag] + ⅓·acf[3·lag] + ¼·acf[4·lag]
 *
 * By summing the ACF at integer multiples of each candidate lag, the TRUE
 * fundamental period accumulates contributions from all its harmonics and
 * consistently outscores any single harmonic (even when that harmonic has
 * a slightly higher raw correlation peak).
 *
 * After finding bestLag via harmonic summation, simple octave folding maps
 * the result into [65, 200] BPM without re-introducing the raw-ACF bias.
 */
function odfToBPM(odf: Float32Array): number | null {
  const fps    = 200;
  const minLag = Math.max(1, Math.floor(fps * 60 / 215)); // ≈ 215 BPM max
  const maxLag = Math.ceil(fps * 60 / 55);                // ≈ 55 BPM min
  const n      = odf.length - maxLag;
  if (n < 20) return null;

  // Autocorrelation
  const acf = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < n; i++) corr += odf[i] * odf[i + lag];
    acf[lag] = corr;
  }

  // Harmonic summation — finds the fundamental, not its harmonics
  const hs = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = acf[lag];
    for (let h = 2; h <= 4; h++) {
      const hLag = Math.round(lag * h);
      if (hLag <= maxLag) score += (1.0 / h) * acf[hLag];
    }
    hs[lag] = score;
  }

  // Pick the lag with the best harmonic-sum score
  let bestLag = minLag, bestHS = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (hs[lag] > bestHS) { bestHS = hs[lag]; bestLag = lag; }
  }
  if (bestHS <= 0) return null;

  // Octave fold into [65, 200] BPM
  let bpm = Math.round((fps * 60) / bestLag);
  while (bpm > 200) bpm = Math.round(bpm / 2);
  while (bpm < 65)  bpm = bpm * 2;

  return (bpm >= 55 && bpm <= 220) ? bpm : null;
}

/**
 * Two-pass BPM detection:
 *  - Primary  : low-pass ≤250 Hz (kick drum isolated), 4 kHz SR
 *  - Secondary: full spectrum, 8 kHz SR (cross-validation)
 *
 * The two passes run in parallel. If they agree (within ±5 BPM, or one is
 * exactly double the other), the kick-drum result is returned — it is more
 * reliable for electronic / hip-hop music. When they disagree significantly,
 * the kick-drum result still wins (it is virtually noise-free for kick-led
 * genres); the full-spectrum result is only used as a fallback when the
 * kick-band pass produces no output.
 */
async function detectBPMTwoPasses(url: string): Promise<number | null> {
  const [kickPcm, fullPcm] = await Promise.all([
    decodePCM(url, 4000, 90, "lowpass=f=250"), // isolate kick drum
    decodePCM(url, 8000, 90),                  // full spectrum backup
  ]);

  const kickBpm = kickPcm ? odfToBPM(computeODF(kickPcm, 4000)) : null;
  const fullBpm = fullPcm ? odfToBPM(computeODF(fullPcm, 8000)) : null;

  if (kickBpm === null && fullBpm === null) return null;
  if (kickBpm === null) return fullBpm;
  if (fullBpm === null) return kickBpm;

  // Prefer kick-drum result; use full-spectrum only as a sanity check
  const agree = Math.abs(kickBpm - fullBpm) <= 5
    || Math.abs(kickBpm * 2 - fullBpm) <= 5
    || Math.abs(kickBpm - fullBpm * 2) <= 5;

  return agree ? kickBpm : kickBpm; // kick wins either way; kept explicit for clarity
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

  const maxC = Math.max(...chroma);
  if (maxC < 1e-10) return null;
  const cn = Array.from(chroma).map(v => v / maxC);

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

  // ── 1. Embedded metadata (ID3 / Vorbis) ──────────────────────────────────
  try {
    const mm = await import("music-metadata") as any;

    let meta: any;
    if (/^https?:\/\//i.test(url)) {
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

  // ── 2. FFmpeg-based signal analysis (fallback) ───────────────────────────
  try {
    // BPM: two-pass (kick-drum band + full spectrum), runs in parallel
    if (!bpm) {
      bpm = await detectBPMTwoPasses(url);
    }

    // Key: Goertzel chromagram on full-spectrum 11025 Hz PCM
    if (!key) {
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
