import { useRef, useEffect, useCallback } from "react";

interface SoundWaveProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  audioUrl?: string;
}

const BAR_COUNT = 160;
const FETCH_TIMEOUT_MS = 6000;

function seededFakeWaveform(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >> 17;
    h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
  const raw = Array.from({ length: count }, (_, i) => {
    const f = i / count;
    const envelope = Math.pow(Math.sin(f * Math.PI), 0.35);
    return (0.15 + rand() * 0.75) * envelope + rand() * 0.06;
  });
  const max = Math.max(...raw, 0.001);
  return raw.map((v) => v / max);
}

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

    // Use both channels if available for a more accurate reading
    const channels = [];
    for (let c = 0; c < Math.min(audioBuffer.numberOfChannels, 2); c++) {
      channels.push(audioBuffer.getChannelData(c));
    }
    const length = channels[0].length;
    const samplesPerBin = Math.floor(length / count);

    const peaks = Array.from({ length: count }, (_, i) => {
      const start = i * samplesPerBin;
      const end = Math.min(start + samplesPerBin, length);
      let max = 0;
      for (let j = start; j < end; j++) {
        for (const ch of channels) {
          const abs = Math.abs(ch[j]);
          if (abs > max) max = abs;
        }
      }
      return max;
    });

    const maxPeak = Math.max(...peaks, 0.001);
    return peaks.map((p) => p / maxPeak);
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

  const loadWaveform = useCallback(async (url: string) => {
    if (!url || url === lastUrlRef.current) return;
    lastUrlRef.current = url;

    peaksRef.current = seededFakeWaveform(url, BAR_COUNT);

    const real = await extractWaveform(url, BAR_COUNT);
    if (real && lastUrlRef.current === url) {
      peaksRef.current = real;
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

    cx.clearRect(0, 0, canvas.width / dpr * dpr, canvas.height / dpr * dpr);

    const peaks = peaksRef.current;
    if (peaks.length === 0) return;

    const prog = progressRef.current;
    const count = peaks.length;
    const midY = H / 2;
    const maxAmp = midY * 0.92;

    // Bar geometry: thin bars with small gap between them
    const slotW = W / count;
    const barW = Math.max(1.5, slotW * 0.52);
    const gap = slotW - barW;

    const playheadBar = prog * count;

    for (let i = 0; i < count; i++) {
      const x = i * slotW + gap / 2;
      const amp = Math.max(peaks[i] * maxAmp, 1.5);

      const isPlayed = i < playheadBar;
      const isHead = Math.abs(i - playheadBar) < 1.0;

      if (isHead) {
        // Playhead bar — bright white
        cx.fillStyle = "rgba(255,255,255,1)";
      } else if (isPlayed) {
        // Played bars — solid white
        cx.fillStyle = "rgba(255,255,255,0.85)";
      } else {
        // Unplayed bars — dim
        cx.fillStyle = "rgba(255,255,255,0.18)";
      }

      // Draw bar symmetrically from center
      const barH = amp * 2;
      const barY = midY - amp;

      // Rounded bar using rounded rect
      const radius = Math.min(barW / 2, 2);
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
