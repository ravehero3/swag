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
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const setupFailedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) return;

    const setupAudioContext = async () => {
      if (setupFailedRef.current) return;
      try {
        if (!audioContextRef.current) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)() as AudioContext;
          audioContextRef.current = audioContext;
        }

        if (!sourceRef.current) {
          const source = audioContextRef.current.createMediaElementSource(audioRef.current!);
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.78;
          source.connect(analyser);
          analyser.connect(audioContextRef.current.destination);
          analyserRef.current = analyser;
          sourceRef.current = source;
        }

        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
      } catch (error) {
        console.warn("SoundWave: audio context setup failed, waveform disabled:", error);
        setupFailedRef.current = true;
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch (_) {}
          audioContextRef.current = null;
        }
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
      setupAudioContext().then(() => {
        if (!setupFailedRef.current) updateWaveform();
      });
    } else {
      setFrequencyData(null);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, audioRef]);

  if (!isPlaying || !frequencyData) return null;

  const bars = 80;
  const step = Math.floor(frequencyData.length / bars);
  const maxBarHalf = 44;

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      margin: "20px auto 4px",
      maxWidth: "1200px",
      padding: "0 16px",
    }}>
      <div style={{
        width: "100%",
        height: `${maxBarHalf * 2 + 2}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        gap: "2px",
        position: "relative",
      }}>
        {/* Center line */}
        <div style={{
          position: "absolute",
          left: 8,
          right: 8,
          top: "50%",
          height: "1px",
          background: "rgba(255,255,255,0.06)",
          pointerEvents: "none",
        }} />

        {Array.from({ length: bars }).map((_, i) => {
          const dataIndex = i * step;
          const value = frequencyData[dataIndex] || 0;
          const intensity = value / 255;

          const upHeight = Math.max(1, intensity * maxBarHalf);
          const downHeight = Math.max(1, upHeight * 0.55);

          const r = Math.round(11 + (255 - 11) * Math.min(1, intensity * 1.4));
          const g = Math.round(153 + (255 - 153) * Math.min(1, intensity * 1.2));
          const bVal = 252;
          const baseColor = `rgb(${r}, ${g}, ${bVal})`;
          const glowColor = `rgba(${r}, ${g}, ${bVal}, 0.6)`;
          const glow = intensity > 0.55 ? `0 0 ${Math.round(intensity * 8)}px ${glowColor}` : "none";

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                minWidth: 0,
              }}
            >
              <div style={{
                width: "100%",
                height: `${upHeight}px`,
                background: baseColor,
                borderRadius: "2px 2px 0 0",
                boxShadow: glow,
                alignSelf: "flex-end",
                flexShrink: 0,
              }} />
              <div style={{
                width: "100%",
                height: `${downHeight}px`,
                background: `rgba(${r}, ${g}, ${bVal}, 0.35)`,
                borderRadius: "0 0 2px 2px",
                alignSelf: "flex-start",
                flexShrink: 0,
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SoundWave;
