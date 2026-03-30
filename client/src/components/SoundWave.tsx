import { useRef, useEffect, useCallback, useState } from "react";

interface SoundWaveProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

const BAR_COUNT = 80;

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
  return Array.from({ length: count }, (_, i) => {
    const f = i / count;
    const envelope = Math.sin(f * Math.PI) * 0.75 + 0.25;
    return Math.min(1, (0.25 + rand() * 0.65) * envelope + rand() * 0.1);
  });
}

async function extractWaveform(url: string, count: number): Promise<number[] | null> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    await audioContext.close();

    const channelData = audioBuffer.getChannelData(0);
    const samplesPerBar = Math.floor(channelData.length / count);

    const peaks = Array.from({ length: count }, (_, i) => {
      const start = i * samplesPerBar;
      const end = Math.min(start + samplesPerBar, channelData.length);
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

function SoundWave({ audioRef, isPlaying }: SoundWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const peaksRef = useRef<number[]>([]);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const lastSrcRef = useRef<string>("");

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    peaksRef.current = peaks;
  }, [peaks]);

  const loadWaveform = useCallback(async (src: string) => {
    if (!src || src === lastSrcRef.current) return;
    lastSrcRef.current = src;
    setPeaks([]);

    const real = await extractWaveform(src, BAR_COUNT);
    if (real) {
      setPeaks(real);
    } else {
      setPeaks(seededFakeWaveform(src, BAR_COUNT));
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadStart = () => {
      const src = audio.src;
      if (src) loadWaveform(src);
    };

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    if (audio.src && audio.src !== lastSrcRef.current) {
      loadWaveform(audio.src);
    }

    return () => {
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [audioRef, loadWaveform]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cx = canvas.getContext("2d");
    if (!cx) return;

    cx.clearRect(0, 0, W, H);

    const bars = peaksRef.current;
    if (bars.length === 0) return;

    const prog = progressRef.current;
    const gap = 2;
    const barW = (W - gap * (bars.length - 1)) / bars.length;
    const playheadX = prog * W;

    bars.forEach((peak, i) => {
      const x = i * (barW + gap);
      const barH = Math.max(2, peak * (H - 4));
      const y = (H - barH) / 2;
      const barRight = x + barW;

      const isPlayed = barRight <= playheadX;
      const isAtPlayhead = x <= playheadX && barRight >= playheadX;

      if (isAtPlayhead) {
        const playedFrac = (playheadX - x) / barW;
        if (playedFrac > 0) {
          cx.fillStyle = "rgba(255,255,255,0.95)";
          cx.fillRect(x, y, barW * playedFrac, barH);
        }
        cx.fillStyle = "rgba(255,255,255,0.22)";
        cx.fillRect(x + barW * playedFrac, y, barW * (1 - playedFrac), barH);
      } else if (isPlayed) {
        cx.fillStyle = "rgba(255,255,255,0.95)";
        cx.fillRect(x, y, barW, barH);
      } else {
        cx.fillStyle = "rgba(255,255,255,0.22)";
        cx.fillRect(x, y, barW, barH);
      }
    });

    if (prog > 0 && prog < 1) {
      cx.fillStyle = "#fff";
      cx.fillRect(playheadX - 1, 0, 2, H);
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
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const audio = audioRef.current;
      if (audio && audio.duration) audio.currentTime = p * audio.duration;
    },
    [audioRef]
  );

  if (!isPlaying) return null;

  return (
    <div
      onClick={seek}
      onMouseMove={scrub}
      style={{
        position: "relative",
        height: 64,
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
