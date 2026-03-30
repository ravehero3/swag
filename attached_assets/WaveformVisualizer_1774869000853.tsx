import { useRef, useEffect, useCallback } from 'react';

interface WaveformVisualizerProps {
  /** 0–1 playback progress */
  progress: number;
  /** Called with 0–1 when user clicks or scrubs */
  onSeek: (progress: number) => void;
  /** Optional: live AnalyserNode from Web Audio API.
   *  If omitted, a simulated wave is drawn (useful for dev/preview). */
  analyser?: AnalyserNode;
  height?: number;
  className?: string;
}

export default function WaveformVisualizer({
  progress,
  onSeek,
  analyser,
  height = 56,
  className = '',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef<number>(0);
  const progressRef = useRef<number>(progress);

  // Keep progressRef in sync so the draw loop always has the latest value
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // --- Point generation ---
  // When a real AnalyserNode is provided, sample it directly.
  // Otherwise fall back to a deterministic sine-based simulation.
  const getPoints = useCallback(
    (W: number, H: number, count: number): { x: number; y: number }[] => {
      if (analyser) {
        const buf = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buf);
        return Array.from({ length: count + 1 }, (_, i) => {
          const idx = Math.floor((i / count) * (buf.length - 1));
          const y = H / 2 + buf[idx] * H * 0.38;
          return { x: (i / count) * W, y };
        });
      }

      // Simulated wave — replace with real data in production
      const t = tRef.current;
      return Array.from({ length: count + 1 }, (_, i) => {
        const f = i / count;
        const y =
          H / 2 +
          Math.sin(f * 18 + t * 3) * H * 0.18 +
          Math.sin(f * 7 - t * 1.5) * H * 0.10 +
          Math.sin(f * 40 + t * 5) * H * 0.06;
        return { x: f * W, y };
      });
    },
    [analyser]
  );

  // --- Draw ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cx = canvas.getContext('2d');
    if (!cx) return;

    cx.clearRect(0, 0, W, H);

    const prog = progressRef.current;
    const px = prog * W;
    const pts = getPoints(W, H, 200);

    // --- Unplayed: flat hairline ---
    const unplayed = pts.filter(p => p.x >= px - 1);
    if (unplayed.length > 1) {
      cx.beginPath();
      unplayed.forEach((p, i) => (i === 0 ? cx.moveTo(p.x, p.y) : cx.lineTo(p.x, p.y)));
      cx.strokeStyle = '#282828';
      cx.lineWidth = 0.75;
      cx.lineJoin = 'round';
      cx.lineCap = 'round';
      cx.stroke();
    }

    // --- Played: tapered stroke — thin at start, thick at playhead ---
    const played = pts.filter(p => p.x <= px + 1);
    if (played.length >= 2) {
      for (let i = 0; i < played.length - 1; i++) {
        const frac = px > 0 ? played[i].x / px : 0;
        cx.beginPath();
        cx.moveTo(played[i].x, played[i].y);
        cx.lineTo(played[i + 1].x, played[i + 1].y);
        cx.strokeStyle = `rgba(255,255,255,${0.5 + frac * 0.5})`;
        cx.lineWidth = 0.5 + frac * 3.5;
        cx.lineJoin = 'round';
        cx.lineCap = 'round';
        cx.stroke();
      }
    }
  }, [getPoints]);

  // --- Animation loop ---
  useEffect(() => {
    const loop = () => {
      if (!analyser) tRef.current += 0.016; // only advance sim time when no real analyser
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, analyser]);

  // --- Resize observer ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const wrap = canvas.parentElement;
      if (!wrap) return;
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;
      const cx = canvas.getContext('2d');
      if (cx) cx.scale(dpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  // --- Seek interaction ---
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(p);
    },
    [onSeek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return; // only while mouse button held
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(p);
    },
    [onSeek]
  );

  return (
    <div
      onClick={handleSeek}
      onMouseMove={handleMouseMove}
      className={className}
      style={{
        position: 'relative',
        height,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
