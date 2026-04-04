import { useRef, useEffect, useCallback } from "react";
import { getWaveform, preloadWaveform } from "../lib/waveformCache.js";

interface SoundWaveProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  audioUrl?: string;
  children?: React.ReactNode;
}

const BAR_COUNT = 480;

function SoundWave({ audioRef, isPlaying, audioUrl, children }: SoundWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const peaksRef = useRef<number[]>([]);
  const lastUrlRef = useRef<string>("");
  const isLoadingRef = useRef<boolean>(false);

  const loadWaveform = useCallback(async (url: string) => {
    if (!url || url === lastUrlRef.current) return;
    lastUrlRef.current = url;

    const cached = getWaveform(url);
    if (cached !== undefined) {
      peaksRef.current = cached ?? [];
      isLoadingRef.current = false;
      return;
    }

    peaksRef.current = [];
    isLoadingRef.current = true;
    await preloadWaveform(url);
    if (lastUrlRef.current === url) {
      isLoadingRef.current = false;
      const result = getWaveform(url);
      if (result) peaksRef.current = result;
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

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const drawTimePill = (
    cx: CanvasRenderingContext2D,
    label: string,
    centerX: number,
    baseY: number,
    canvasW: number
  ) => {
    const pillH = 16;
    const paddingX = 6;
    cx.font = "bold 9px monospace";
    const textW = cx.measureText(label).width;
    const pillW = textW + paddingX * 2;
    const pillR = 4;
    const margin = 4;
    let px = centerX - pillW / 2;
    px = Math.max(margin, Math.min(canvasW - pillW - margin, px));
    const py = baseY - pillH - 4;

    cx.fillStyle = "#0C0C0C";
    cx.beginPath();
    if (cx.roundRect) {
      cx.roundRect(px, py, pillW, pillH, pillR);
    } else {
      cx.rect(px, py, pillW, pillH);
    }
    cx.fill();

    cx.fillStyle = "rgba(255,255,255,0.85)";
    cx.textBaseline = "middle";
    cx.fillText(label, px + paddingX, py + pillH / 2);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cx = canvas.getContext("2d");
    if (!cx) return;

    cx.clearRect(0, 0, W, H);

    const divY = H * 0.70;
    const topMaxAmp = divY * 0.90;
    const botMaxAmp = (H - divY) * 0.90;
    const count = BAR_COUNT;
    const slotW = W / count;
    const barW = Math.max(1, slotW * 0.55);
    const gap = slotW - barW;

    if (isLoadingRef.current) {
      const t = Date.now() / 1000;
      const numBars = 7;
      const iconBarW = 3;
      const iconGap = 4;
      const totalIconW = numBars * iconBarW + (numBars - 1) * iconGap;
      const startX = (W - totalIconW) / 2;
      const heightProfile = [0.30, 0.55, 0.78, 1.0, 0.78, 0.55, 0.30];
      const pulse = 0.70 + Math.sin(t * 2.2) * 0.30;

      for (let i = 0; i < numBars; i++) {
        const phase = (i / numBars) * Math.PI * 2;
        const ripple = 0.85 + Math.sin(t * 3.5 + phase) * 0.15;
        const topAmp = heightProfile[i] * topMaxAmp * 0.62 * pulse * ripple;
        const botAmp = heightProfile[i] * botMaxAmp * 0.62 * pulse * ripple;
        const x = startX + i * (iconBarW + iconGap);
        const barH = Math.max(topAmp + botAmp, 3);
        const barY = divY - topAmp;
        const radius = iconBarW / 2;
        cx.fillStyle = `rgba(255,255,255,0.70)`;
        cx.beginPath();
        if (cx.roundRect) {
          cx.roundRect(x, barY, iconBarW, barH, radius);
        } else {
          cx.rect(x, barY, iconBarW, barH);
        }
        cx.fill();
      }

      cx.fillStyle = "#000";
      cx.fillRect(0, divY, W, 1);
      return;
    }

    const peaks = peaksRef.current;
    if (peaks.length === 0) return;

    const prog = progressRef.current;
    const playheadBar = prog * count;
    const radius = Math.min(barW / 2, 1.5);

    for (let i = 0; i < count; i++) {
      const x = i * slotW + gap / 2;
      const peak = peaks[i];
      const topAmp = Math.max(peak * topMaxAmp, 1.2);
      const botAmp = Math.max(peak * botMaxAmp, 0.5);
      const isPlayed = i < playheadBar;
      const isHead = Math.abs(i - playheadBar) < 1.2;

      const topBarY = divY - topAmp;
      const botBarY = divY;

      if (isHead) {
        cx.fillStyle = "rgba(255,255,255,1)";
        cx.beginPath();
        if (cx.roundRect) {
          cx.roundRect(x, topBarY, barW, topAmp + botAmp, radius);
        } else {
          cx.rect(x, topBarY, barW, topAmp + botAmp);
        }
        cx.fill();
      } else {
        const topColor = isPlayed ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)";
        const botColor = isPlayed ? "rgba(255,255,255,0.61)" : "rgba(255,255,255,0.13)";

        cx.fillStyle = topColor;
        cx.beginPath();
        if (cx.roundRect) {
          cx.roundRect(x, topBarY, barW, topAmp, radius);
        } else {
          cx.rect(x, topBarY, barW, topAmp);
        }
        cx.fill();

        cx.fillStyle = botColor;
        cx.beginPath();
        if (cx.roundRect) {
          cx.roundRect(x, botBarY, barW, botAmp, radius);
        } else {
          cx.rect(x, botBarY, barW, botAmp);
        }
        cx.fill();
      }
    }

    cx.fillStyle = "#000";
    cx.fillRect(0, divY, W, 1);

    const playheadX = prog * W;
    cx.fillStyle = "rgba(255,255,255,0.95)";
    cx.fillRect(playheadX - 0.75, 0, 1.5, H);

    const audio = audioRef.current;
    const currentTime = audio ? audio.currentTime : 0;
    const duration = audio ? audio.duration : 0;

    if (isFinite(duration) && duration > 0) {
      drawTimePill(cx, formatTime(currentTime), 0, divY, W);
    }

    if (isFinite(duration) && duration > 0) {
      drawTimePill(cx, formatTime(duration), W - 4, divY, W);
    }
  }, [audioRef]);

  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        draw();
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      cancelAnimationFrame(rafRef.current);
      draw();
    }
  }, [draw, isPlaying]);

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
      progressRef.current = p;
      draw();
      const audio = audioRef.current;
      if (audio && audio.duration) audio.currentTime = p * audio.duration;
    },
    [audioRef, draw]
  );

  const scrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      seek(e);
    },
    [seek]
  );

  return (
    <div
      onClick={seek}
      onMouseMove={scrub}
      style={{
        position: "relative",
        height: 72,
        cursor: "pointer",
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
      {children}
    </div>
  );
}

export default SoundWave;
