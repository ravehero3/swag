import { useEffect, useRef } from "react";

interface SoundWaveProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

function SoundWave({ audioRef, isPlaying }: SoundWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return;

    const setupAudioContext = () => {
      if (audioContextRef.current) return;

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)() as AudioContext;
        const source = audioContext.createMediaElementAudioSource(audioRef.current!);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyserRef.current = analyser;
        audioContextRef.current = audioContext;
      } catch (error) {
        console.error("Error setting up audio context:", error);
      }
    };

    const drawWaveform = () => {
      if (!analyserRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) * 2.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        const hue = (i / dataArray.length) * 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawWaveform);
      }
    };

    if (isPlaying) {
      setupAudioContext();
      drawWaveform();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioRef]);

  if (!isPlaying) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
      <canvas
        ref={canvasRef}
        width={1000}
        height={120}
        style={{
          width: "100%",
          maxWidth: "1000px",
          height: "120px",
          borderRadius: "4px",
          background: "linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.05) 100%)",
          border: "1px solid #333",
        }}
      />
    </div>
  );
}

export default SoundWave;
