import { useRef, useState, useEffect, useCallback } from "react";
import { getWaveform, preloadWaveform } from "../lib/waveformCache.js";

const BAR_COUNT = 480;

// Deterministic skeleton waveform shown while real peaks load. We layer
// a couple of low-frequency sines plus a hashed jitter so it reads as a
// realistic-looking wave shape (not a flat bar or a spinner) but is the
// exact same on every render — no flicker.
let _skeletonCache: number[] | null = null;
function getSkeletonPeaks(count: number): number[] {
  if (_skeletonCache && _skeletonCache.length === count) return _skeletonCache;
  const out: number[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    // Smooth body envelope (fade in/out at the edges, fuller in the middle).
    const envelope = 0.45 + 0.35 * Math.sin(Math.PI * t);
    // A few overlaid sines give it a music-like texture.
    const wave =
      0.55 +
      0.20 * Math.sin(t * Math.PI * 14) +
      0.12 * Math.sin(t * Math.PI * 33 + 1.3) +
      0.08 * Math.sin(t * Math.PI * 71 + 0.7);
    // Cheap deterministic jitter (no Math.random — must be stable).
    const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const j = (jitter < 0 ? jitter + 1 : jitter) * 0.20;
    out[i] = Math.max(0.05, Math.min(1, envelope * (wave + j) * 0.85));
  }
  _skeletonCache = out;
  return out;
}

interface MiniWavePlayerProps {
  url: string;
  label?: string;
}

function MiniWavePlayer({ url, label }: MiniWavePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const peaksRef = useRef<number[]>([]);
  const lastUrlRef = useRef<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playError, setPlayError] = useState("");

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = url;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration) {
        progressRef.current = audio.currentTime / audio.duration;
        setCurrentTime(audio.currentTime);
      }
    };
    const onDurationChange = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      progressRef.current = 0;
      setCurrentTime(0);
    };
    const onError = () => {
      setIsPlaying(false);
      setPlayError("Audio preview se nepodařilo načíst");
    };
    const onPause = () => setIsPlaying(false);
    const onPlay = () => {
      setPlayError("");
      setIsPlaying(true);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    const stopOthers = (e: Event) => {
      if ((e as CustomEvent).detail !== audio) {
        audio.pause();
      }
    };
    window.addEventListener("miniwave:play", stopOthers);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      window.removeEventListener("miniwave:play", stopOthers);
    };
  }, [url]);

  const loadWaveform = useCallback(async (src: string) => {
    if (!src || src === lastUrlRef.current) return;
    lastUrlRef.current = src;
    const cached = getWaveform(src);
    if (cached !== undefined) {
      peaksRef.current = cached ?? [];
      return;
    }
    peaksRef.current = [];
    await preloadWaveform(src);
    if (lastUrlRef.current === src) {
      const result = getWaveform(src);
      if (result) peaksRef.current = result;
    }
  }, []);

  useEffect(() => {
    if (url) loadWaveform(url);
  }, [url, loadWaveform]);

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const drawTimePill = (
    cx: CanvasRenderingContext2D,
    lbl: string,
    centerX: number,
    baseY: number,
    canvasW: number
  ) => {
    const pillH = 16;
    const paddingX = 6;
    cx.font = "bold 9px monospace";
    const textW = cx.measureText(lbl).width;
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
    cx.fillText(lbl, px + paddingX, py + pillH / 2);
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

    // While the real peaks load (or if they failed to load), draw a static
    // skeleton waveform that spans the full width using a deterministic
    // pseudo-random pattern. This ensures the user sees a wave from the very
    // first paint instead of a loading indicator.
    const peaks = peaksRef.current;
    const isSkeleton = peaks.length === 0;
    const sourcePeaks: number[] = isSkeleton ? getSkeletonPeaks(count) : peaks;

    const prog = progressRef.current;
    const playheadBar = prog * count;
    const radius = Math.min(barW / 2, 1.5);

    // Tone the skeleton waveform down so it reads as "loading data" rather
    // than a real waveform — but it's still a full waveform shape.
    const baseTopAlpha = isSkeleton ? 0.18 : 0.28;
    const baseBotAlpha = isSkeleton ? 0.08 : 0.13;
    const playedTopAlpha = isSkeleton ? 0.18 : 0.85;
    const playedBotAlpha = isSkeleton ? 0.08 : 0.61;

    for (let i = 0; i < count; i++) {
      const x = i * slotW + gap / 2;
      const peak = sourcePeaks[i] ?? 0;
      const topAmp = Math.max(peak * topMaxAmp, 1.2);
      const botAmp = Math.max(peak * botMaxAmp, 0.5);
      const isPlayed = !isSkeleton && i < playheadBar;
      const isHead = !isSkeleton && Math.abs(i - playheadBar) < 1.2;
      const topBarY = divY - topAmp;
      const botBarY = divY;

      if (isHead) {
        cx.fillStyle = "rgba(255,255,255,1)";
        cx.beginPath();
        if (cx.roundRect) cx.roundRect(x, topBarY, barW, topAmp + botAmp, radius);
        else cx.rect(x, topBarY, barW, topAmp + botAmp);
        cx.fill();
      } else {
        cx.fillStyle = `rgba(255,255,255,${isPlayed ? playedTopAlpha : baseTopAlpha})`;
        cx.beginPath();
        if (cx.roundRect) cx.roundRect(x, topBarY, barW, topAmp, radius);
        else cx.rect(x, topBarY, barW, topAmp);
        cx.fill();

        cx.fillStyle = `rgba(255,255,255,${isPlayed ? playedBotAlpha : baseBotAlpha})`;
        cx.beginPath();
        if (cx.roundRect) cx.roundRect(x, botBarY, barW, botAmp, radius);
        else cx.rect(x, botBarY, barW, botAmp);
        cx.fill();
      }
    }

    cx.fillStyle = "#000";
    cx.fillRect(0, divY, W, 1);

    const playheadX = prog * W + gap / 2;
    cx.fillStyle = "rgba(255,255,255,0.95)";
    cx.fillRect(playheadX - 0.75, 0, 1.5, H);

    const audio = audioRef.current;
    const dur = audio?.duration ?? 0;
    const cur = audio?.currentTime ?? 0;
    if (isFinite(dur) && dur > 0) {
      drawTimePill(cx, formatTime(cur), 0, divY, W);
      drawTimePill(cx, formatTime(dur), W - 4, divY, W);
    }
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
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [draw]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      window.dispatchEvent(new CustomEvent("miniwave:play", { detail: audio }));
      try {
        setPlayError("");
        await audio.play();
      } catch (err) {
        console.error("Mini preview play failed:", err, "| src:", url);
        setIsPlaying(false);
        setPlayError("Audio preview se nepodařilo přehrát");
      }
    }
  };

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    progressRef.current = p;
    if (audio.duration) audio.currentTime = p * audio.duration;
    draw();
  }, [draw]);

  const scrub = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    seek(e);
  }, [seek]);

  const filename = label ?? url.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={togglePlay}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
          data-testid={`btn-preview-play-${filename}`}
        >
          {isPlaying ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <rect x="1" y="0" width="3" height="10" />
              <rect x="6" y="0" width="3" height="10" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <polygon points="1,0 10,5 1,10" />
            </svg>
          )}
        </button>
        <span
          style={{
            fontSize: "11px",
            color: "#555",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {filename}
        </span>
        {duration > 0 && !isPlaying && (
          <span style={{ fontSize: "10px", color: "#444", fontFamily: "monospace", flexShrink: 0 }}>
            {formatTime(duration)}
          </span>
        )}
        {isPlaying && (
          <span style={{ fontSize: "10px", color: "#888", fontFamily: "monospace", flexShrink: 0 }}>
            {formatTime(currentTime)}
          </span>
        )}
      </div>

      <div
        onClick={seek}
        onMouseMove={scrub}
        style={{
          position: "relative",
          height: 56,
          cursor: "pointer",
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
      {playError && (
        <span style={{ fontSize: "11px", color: "#b85c5c" }}>
          {playError}
        </span>
      )}
    </div>
  );
}

export default MiniWavePlayer;
