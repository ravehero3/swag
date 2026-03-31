const cache = new Map<string, number[] | null>();
const inFlight = new Set<string>();

const BAR_COUNT = 480;
const FETCH_TIMEOUT_MS = 8000;

async function extractWaveform(url: string): Promise<number[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(url, { mode: "cors", signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();

    const channels: Float32Array[] = [];
    for (let c = 0; c < Math.min(audioBuffer.numberOfChannels, 2); c++) {
      channels.push(audioBuffer.getChannelData(c));
    }
    const sampleRate = audioBuffer.sampleRate;
    const length = channels[0].length;
    const samplesPerBin = Math.floor(length / BAR_COUNT);
    const alpha = 1 - Math.exp(-2 * Math.PI * 100 / sampleRate);
    const rawPeaks = new Float32Array(BAR_COUNT);
    const bassPeaks = new Float32Array(BAR_COUNT);
    let lpState = 0;

    for (let i = 0; i < BAR_COUNT; i++) {
      const start = i * samplesPerBin;
      const end = Math.min(start + samplesPerBin, length);
      let maxRaw = 0;
      let maxBass = 0;
      for (let j = start; j < end; j++) {
        let s = 0;
        for (const ch of channels) {
          const abs = Math.abs(ch[j]);
          if (abs > s) s = abs;
        }
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

    return Array.from({ length: BAR_COUNT }, (_, i) =>
      Math.min(1, (rawPeaks[i] / maxR) * 0.60 + (bassPeaks[i] / maxB) * 0.55)
    );
  } catch {
    return null;
  }
}

export function getWaveform(url: string): number[] | null | undefined {
  if (!url) return undefined;
  return cache.has(url) ? cache.get(url)! : undefined;
}

export async function preloadWaveform(url: string): Promise<void> {
  if (!url || cache.has(url) || inFlight.has(url)) return;
  inFlight.add(url);
  try {
    const result = await extractWaveform(url);
    cache.set(url, result);
  } finally {
    inFlight.delete(url);
  }
}
