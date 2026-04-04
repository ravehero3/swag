import { useRef, useEffect, useCallback } from "react";
import { getWaveform, preloadWaveform } from "../lib/waveformCache.js";

interface SoundWaveProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  audioUrl?: string;
}

const BAR_COUNT = 480;

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

    for (let i = 0; i < count; i++) {
      const x = i * slotW + gap / 2;
      const peak = peaks[i];
      const topAmp = Math.max(peak * topMaxAmp, 1.2);
      const botAmp = Math.max(peak * botMaxAmp, 0.5);
      const isPlayed = i < playheadBar;
      const isHead = Math.abs(i - playheadBar) < 1.2;

      if (isHead) {
        cx.fillStyle = "rgba(255,255,255,1)";
      } else if (isPlayed) {
        cx.fillStyle = "rgba(255,255,255,0.85)";
      } else {
        cx.fillStyle = "rgba(255,255,255,0.28)";
      }

      const barH = topAmp + botAmp;
      const barY = divY - topAmp;
      const radius = Math.min(barW / 2, 1.5);
      cx.beginPath();
      if (cx.roundRect) {
        cx.roundRect(x, barY, barW, barH, radius);
      } else {
        cx.rect(x, barY, barW, barH);
      }
      cx.fill();
    }

    cx.fillStyle = "#000";
    cx.fillRect(0, divY, W, 1);
  }, []);

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
