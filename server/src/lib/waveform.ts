import { spawn } from "child_process";
import { createRequire } from "module";
import path from "path";

const BAR_COUNT = 480;

function getFfmpegPath(): string {
  try {
    const require = createRequire(import.meta.url);
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && typeof ffmpegStatic === "string") return ffmpegStatic;
  } catch {
    // fall through to system ffmpeg
  }
  return "ffmpeg";
}

// Locally-stored beat/kit previews come back from the upload API as a
// relative web path like "/uploads/beats/previews/foo.mp3". ffmpeg has no
// concept of that — it either needs a real http(s) URL or a filesystem path.
// Resolve "/uploads/..." straight to the file on disk (public/uploads/...)
// instead of round-tripping through HTTP; leave real http(s) URLs untouched.
function resolveFfmpegInput(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads/")) {
    return path.join(process.cwd(), "public", url);
  }
  return url;
}

export async function computeWaveformFromUrl(url: string): Promise<number[] | null> {
  const ffmpegPath = getFfmpegPath();
  const input = resolveFfmpegInput(url);
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      ffmpeg.kill();
      resolve(null);
    }, 60000);

    const ffmpeg = spawn(ffmpegPath, [
      "-i", input,
      "-ac", "1",
      "-ar", "22050",
      "-f", "f32le",
      "pipe:1",
    ], { stdio: ["ignore", "pipe", "ignore"] });

    ffmpeg.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));

    ffmpeg.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0 || chunks.length === 0) return resolve(null);

      const raw = Buffer.concat(chunks);
      const sampleCount = raw.byteLength / 4;
      if (sampleCount < BAR_COUNT) return resolve(null);

      const samplesPerBin = Math.floor(sampleCount / BAR_COUNT);
      const rawPeaks = new Float32Array(BAR_COUNT);
      const bassPeaks = new Float32Array(BAR_COUNT);
      const alpha = 1 - Math.exp(-2 * Math.PI * 100 / 22050);
      let lpState = 0;

      for (let i = 0; i < BAR_COUNT; i++) {
        const start = i * samplesPerBin;
        const end = Math.min(start + samplesPerBin, sampleCount);
        let maxRaw = 0;
        let maxBass = 0;
        for (let j = start; j < end; j++) {
          const s = Math.abs(raw.readFloatLE(j * 4));
          lpState = lpState * (1 - alpha) + s * alpha;
          if (s > maxRaw) maxRaw = s;
          if (lpState > maxBass) maxBass = lpState;
        }
        rawPeaks[i] = maxRaw;
        bassPeaks[i] = maxBass;
      }

      let maxR = 0.001, maxB = 0.001;
      for (let i = 0; i < BAR_COUNT; i++) {
        if (rawPeaks[i] > maxR) maxR = rawPeaks[i];
        if (bassPeaks[i] > maxB) maxB = bassPeaks[i];
      }

      const result = Array.from({ length: BAR_COUNT }, (_, i) =>
        Math.min(1, (rawPeaks[i] / maxR) * 0.60 + (bassPeaks[i] / maxB) * 0.55)
      );
      resolve(result);
    });

    ffmpeg.on("error", (err) => {
      clearTimeout(timeout);
      console.error("[Waveform] ffmpeg spawn error:", err.message);
      resolve(null);
    });
  });
}
