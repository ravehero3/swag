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
        analyser.fftSize = 512;
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
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        const hue = (i / dataArray.length) * 360;
        ctx.fillStyle = `hsl(${hue}, 100%, ${40 + (barHeight / canvas.height) * 20}%)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 10;
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
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
    <div style={{ display: "flex", justifyContent: "center", margin: "24px auto", maxWidth: "1200px", padding: "0 16px" }}>
      <canvas
        ref={canvasRef}
        width={1000}
        height={150}
        style={{
          width: "100%",
          height: "150px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(36,224,83,0.05) 100%)",
          border: "1px solid rgba(36, 224, 83, 0.2)",
          boxShadow: "0 0 20px rgba(36, 224, 83, 0.1)",
        }}
      />
    </div>
  );
}

export default SoundWave;
