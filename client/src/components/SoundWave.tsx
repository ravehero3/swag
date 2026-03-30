import { useRef, useEffect, useCallback } from "react";

interface SoundWaveProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  audioUrl?: string;
}

const BAR_COUNT = 480;
const FETCH_TIMEOUT_MS = 8000;

async function extractWaveform(url: string, count: number): Promise<number[] | null> {
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
    const samplesPerBin = Math.floor(length / count);

    const alpha = 1 - Math.exp(-2 * Math.PI * 100 / sampleRate);

    const rawPeaks = new Float32Array(count);
    const bassPeaks = new Float32Array(count);
    let lpState = 0;

    for (let i = 0; i < count; i++) {
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
    for (let i = 0; i < count; i++) {
      if (rawPeaks[i] > maxR) maxR = rawPeaks[i];
      if (bassPeaks[i] > maxB) maxB = bassPeaks[i];
    }

    return Array.from({ length: count }, (_, i) =>
      Math.min(1, (rawPeaks[i] / maxR) * 0.60 + (bassPeaks[i] / maxB) * 0.55)
    );
  } catch {
    return null;
  }
}

function SoundWave({ audioRef, isPlaying, audioUrl }: SoundWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const peaksRef = useRef<number[]>([]);
  const lastUrlRef = useRef<string>("");
  const isLoadingRef = useRef<boolean>(false);

  const loadWaveform = useCallback(async (url: string) => {
    if (!url || url === lastUrlRef.current) return;
    lastUrlRef.current = url;
    peaksRef.current = [];
    isLoadingRef.current = true;

    const real = await extractWaveform(url, BAR_COUNT);
    if (lastUrlRef.current === url) {
      isLoadingRef.current = false;
      if (real) {
        peaksRef.current = real;
      }
    }
  }, []);

  useEffect(() => {
    if (audioUrl) loadWaveform(audioUrl);
  }, [audioUrl, loadWaveform]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoadStart = () => { if (audio.src) loadWaveform(audio.src); };
    const onTimeUpdate = () => {
      if (audio.duration) progressRef.current = audio.currentTime / audio.duration;
    };
    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("timeupdate", onTimeUpdate);
    if (audio.src && !audioUrl && audio.src !== lastUrlRef.current) {
      loadWaveform(audio.src);
    }
    return () => {
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [audioRef, audioUrl, loadWaveform]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cx = canvas.getContext("2d");
    if (!cx) return;

    cx.clearRect(0, 0, W, H);

    const midY = H / 2;
    const maxAmp = midY * 0.92;
    const count = BAR_COUNT;
    const slotW = W / count;
    const barW = Math.max(1, slotW * 0.55);
    const gap = slotW - barW;

    if (isLoadingRef.current) {
      // Animated loading: flowing sine-wave bars with a shimmer sweep
      const t = Date.now() / 1000;
      const shimmerPos = ((t * 0.5) % 1.3) - 0.15;

      for (let i = 0; i < count; i++) {
        const x = i * slotW + gap / 2;
        const f = i / count;

        // Layered sine waves for organic pulsing shape
        const wave =
          Math.sin(t * 1.8 + f * Math.PI * 6) * 0.30 +
          Math.sin(t * 2.9 + f * Math.PI * 10) * 0.15 +
          Math.sin(t * 0.9 + f * Math.PI * 3) * 0.20;
        const amp = Math.max((0.28 + wave) * maxAmp, 1.5);

        // Shimmer: a bright band sweeping left to right
        const distFromShimmer = Math.abs(f - shimmerPos);
        const shimmer = Math.max(0, 1 - distFromShimmer * 28) * 0.45;

        cx.fillStyle = `rgba(255,255,255,${0.10 + shimmer})`;

        const barH = amp * 2;
        const barY = midY - amp;
        const radius = Math.min(barW / 2, 1.5);
        cx.beginPath();
        if (cx.roundRect) {
          cx.roundRect(x, barY, barW, barH, radius);
        } else {
          cx.rect(x, barY, barW, barH);
        }
        cx.fill();
      }
      return;
    }

    const peaks = peaksRef.current;
    if (peaks.length === 0) return;

    const prog = progressRef.current;
    const playheadBar = prog * count;

    for (let i = 0; i < count; i++) {
      const x = i * slotW + gap / 2;
      const amp = Math.max(peaks[i] * maxAmp, 1.2);

      const isPlayed = i < playheadBar;
      const isHead = Math.abs(i - playheadBar) < 1.2;

      if (isHead) {
        cx.fillStyle = "rgba(255,255,255,1)";
      } else if (isPlayed) {
        cx.fillStyle = "rgba(255,255,255,0.85)";
      } else {
        cx.fillStyle = "rgba(255,255,255,0.09)";
      }

      const barH = amp * 2;
      const barY = midY - amp;
      const radius = Math.min(barW / 2, 1.5);

      cx.beginPath();
      if (cx.roundRect) {
        cx.roundRect(x, barY, barW, barH, radius);
      } else {
        cx.rect(x, barY, barW, barH);
      }
      cx.fill();
    }
  }, []);

  useEffect(() => {
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const wrap = canvas.parentElement;
      if (!wrap) return;
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const audio = audioRef.current;
      if (audio && audio.duration) audio.currentTime = p * audio.duration;
    },
    [audioRef]
  );

  const scrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      seek(e);
    },
    [seek]
  );

  if (!isPlaying) return null;

  return (
    <div
      onClick={seek}
      onMouseMove={scrub}
      style={{
        position: "relative",
        height: 72,
        cursor: "pointer",
        overflow: "hidden",
        margin: "20px auto 4px",
        maxWidth: "1200px",
        padding: "0 16px",
        width: "100%",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

export default SoundWave;
