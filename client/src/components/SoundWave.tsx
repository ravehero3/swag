import { useRef, useEffect, useCallback } from "react";

interface SoundWaveProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  audioUrl?: string;
}

const SAMPLE_COUNT = 300;
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
    const envelope = Math.pow(Math.sin(f * Math.PI), 0.4);
    return (0.2 + rand() * 0.7) * envelope + rand() * 0.08;
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
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerBin = Math.floor(channelData.length / count);
    const peaks = Array.from({ length: count }, (_, i) => {
      const start = i * samplesPerBin;
      const end = Math.min(start + samplesPerBin, channelData.length);
      let max = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }
      return max;
    });
    const maxPeak = Math.max(...peaks, 0.001);
    return peaks.map((p) => p / maxPeak);
  } catch {
    return null;
  }
}

function buildPath(cx: CanvasRenderingContext2D, xs: number[], ys: number[]) {
  if (xs.length === 0) return;
  cx.moveTo(xs[0], ys[0]);
  for (let i = 1; i < xs.length - 1; i++) {
    const cpx = (xs[i] + xs[i + 1]) / 2;
    const cpy = (ys[i] + ys[i + 1]) / 2;
    cx.quadraticCurveTo(xs[i], ys[i], cpx, cpy);
  }
  const last = xs.length - 1;
  cx.lineTo(xs[last], ys[last]);
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

    // Show seeded waveform immediately so there's never a blank state
    peaksRef.current = seededFakeWaveform(url, SAMPLE_COUNT);

    // Silently try to upgrade to real audio data in the background
    const real = await extractWaveform(url, SAMPLE_COUNT);
    if (real && lastUrlRef.current === url) {
      peaksRef.current = real;
    }
  }, []);

  // Load whenever audioUrl prop changes
  useEffect(() => {
    if (audioUrl) loadWaveform(audioUrl);
  }, [audioUrl, loadWaveform]);

  // Also listen to loadstart on the audio element as a fallback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoadStart = () => { if (audio.src) loadWaveform(audio.src); };
    const onTimeUpdate = () => {
      if (audio.duration) progressRef.current = audio.currentTime / audio.duration;
    };
    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("timeupdate", onTimeUpdate);
    // Seed from current src if already set and we haven't loaded yet
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

    const peaks = peaksRef.current;
    if (peaks.length === 0) return;

    const prog = progressRef.current;
    const playheadX = prog * W;
    const midY = H / 2;
    const maxAmp = midY * 0.9;

    const xAt = (i: number) => (i / (peaks.length - 1)) * W;
    const ampAt = (i: number) => peaks[i] * maxAmp;

    const playedEndIdx = Math.min(
      peaks.length - 1,
      Math.ceil(prog * (peaks.length - 1))
    );

    // Played: solid filled envelope
    if (playedEndIdx >= 1) {
      const pxs: number[] = [];
      const tops: number[] = [];
      const bots: number[] = [];
      for (let i = 0; i <= playedEndIdx; i++) {
        const x = Math.min(xAt(i), playheadX);
        pxs.push(x);
        tops.push(midY - ampAt(i));
        bots.push(midY + ampAt(i));
      }
      cx.beginPath();
      cx.moveTo(pxs[0], midY);
      buildPath(cx, pxs, tops);
      cx.lineTo(playheadX, midY);
      const rxs = [...pxs].reverse();
      const rbots = [...bots].reverse();
      buildPath(cx, rxs, rbots);
      cx.closePath();
      cx.fillStyle = "rgba(255,255,255,0.88)";
      cx.fill();
    }

    // Unplayed: dim outline (top + bottom mirror)
    const upxs: number[] = [];
    const utops: number[] = [];
    const ubots: number[] = [];
    for (let i = playedEndIdx; i < peaks.length; i++) {
      const x = Math.max(xAt(i), playheadX);
      upxs.push(x);
      utops.push(midY - ampAt(i));
      ubots.push(midY + ampAt(i));
    }
    if (upxs.length >= 2) {
      cx.beginPath();
      buildPath(cx, upxs, utops);
      cx.strokeStyle = "rgba(255,255,255,0.28)";
      cx.lineWidth = 1.2;
      cx.lineJoin = "round";
      cx.lineCap = "round";
      cx.stroke();

      cx.beginPath();
      buildPath(cx, upxs, ubots);
      cx.strokeStyle = "rgba(255,255,255,0.28)";
      cx.lineWidth = 1.2;
      cx.lineJoin = "round";
      cx.lineCap = "round";
      cx.stroke();

      cx.beginPath();
      cx.moveTo(playheadX, midY);
      cx.lineTo(W, midY);
      cx.strokeStyle = "rgba(255,255,255,0.07)";
      cx.lineWidth = 0.5;
      cx.stroke();
    }

    // Playhead
    if (prog > 0 && prog < 1) {
      cx.beginPath();
      cx.moveTo(playheadX, 0);
      cx.lineTo(playheadX, H);
      cx.strokeStyle = "rgba(255,255,255,0.9)";
      cx.lineWidth = 1.5;
      cx.stroke();
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
      const cx = canvas.getContext("2d");
      if (cx) cx.scale(dpr, dpr);
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
