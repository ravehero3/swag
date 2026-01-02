import { useEffect, useRef, useState } from "react";

interface SoundWaveProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

function SoundWave({ audioRef, isPlaying }: SoundWaveProps) {
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const setupAudioContext = () => {
      if (audioContextRef.current) return;

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)() as AudioContext;
        const source = audioContext.createMediaElementSource(audioRef.current!);
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

    const updateWaveform = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      setFrequencyData(new Uint8Array(dataArray));

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateWaveform);
      }
    };

    if (isPlaying) {
      setupAudioContext();
      updateWaveform();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioRef]);

  if (!isPlaying || !frequencyData) return null;

  const bars = 120;
  const step = Math.floor(frequencyData.length / bars);

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "24px auto", maxWidth: "1200px", padding: "0 16px" }}>
      <div
        style={{
          width: "100%",
          height: "80px",
          backgroundColor: "#0a0a0a",
          border: "1px solid #262626",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 4px",
          gap: "1px",
        }}
      >
        {Array.from({ length: bars }).map((_, i) => {
          const dataIndex = i * step;
          const value = frequencyData[dataIndex] || 0;
          const height = (value / 255) * 100;
          
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${height}%`,
                backgroundColor: "#fff",
                opacity: Math.max(0.2, height / 100),
                transition: "all 0.05s linear",
                minWidth: "1px",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default SoundWave;
