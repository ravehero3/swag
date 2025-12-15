import { useState, useEffect, useRef } from "react";
import { useApp } from "../App";

interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  is_highlighted?: boolean;
}

function WaveVisualization({ audioUrl, isPlaying, audioRef }: { audioUrl: string; isPlaying: boolean; audioRef: React.RefObject<HTMLAudioElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!analyserRef.current || !ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.3)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying && !audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      if (!sourceRef.current) {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }
    }

    if (isPlaying) {
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (ctx) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barCount = 60;
        const barWidth = canvas.width / barCount;
        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.random() * canvas.height * 0.3 + 10;
          ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
          ctx.fillRect(i * barWidth + 1, canvas.height - barHeight, barWidth - 2, barHeight);
        }
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioRef]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={150}
      style={{ width: "100%", height: "150px", background: "#000" }}
    />
  );
}

function Beaty() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [highlightedBeat, setHighlightedBeat] = useState<Beat | null>(null);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedBeats, setSavedBeats] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart } = useApp();

  useEffect(() => {
    fetch("/api/beats")
      .then((res) => res.json())
      .then(setBeats)
      .catch(console.error);

    fetch("/api/beats/highlighted")
      .then((res) => res.json())
      .then((beat) => {
        if (beat) setHighlightedBeat(beat);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then((items) => {
          const beatIds = items
            .filter((item: { item_type: string }) => item.item_type === "beat")
            .map((item: { item_id: number }) => item.item_id);
          setSavedBeats(new Set(beatIds));
        })
        .catch(console.error);
    }
  }, [user]);

  const playBeat = (beat: Beat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentBeat(beat);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 100);
    }
  };

  const handleAddToCart = (beat: Beat) => {
    addToCart({
      productId: beat.id,
      productType: "beat",
      title: beat.title,
      price: Number(beat.price),
      artworkUrl: beat.artwork_url || "/uploads/artwork/metallic-logo.png",
    });
  };

  const toggleSave = async (beat: Beat) => {
    if (!user) return;

    try {
      if (savedBeats.has(beat.id)) {
        const res = await fetch(`/api/saved/beat/${beat.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          setSavedBeats((prev) => {
            const next = new Set(prev);
            next.delete(beat.id);
            return next;
          });
        }
      } else {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ itemId: beat.id, itemType: "beat" }),
        });
        if (res.ok) {
          setSavedBeats((prev) => new Set([...prev, beat.id]));
        }
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const otherBeats = beats.filter((b) => b.id !== highlightedBeat?.id);

  return (
    <div className="fade-in">
      <audio
        ref={audioRef}
        src={currentBeat?.preview_url}
        onEnded={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />

      {highlightedBeat && (
        <div
          style={{
            marginBottom: "48px",
            padding: "24px",
            border: "1px solid #333",
            background: "#0a0a0a",
          }}
        >
          <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
            <img
              src={highlightedBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
              alt={highlightedBeat.title}
              style={{ width: "200px", height: "200px", objectFit: "cover" }}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "10px", color: "#666", marginBottom: "8px", letterSpacing: "2px" }}>
                FEATURED BEAT
              </div>
              <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "8px" }}>
                {highlightedBeat.title}
              </h1>
              <div style={{ fontSize: "14px", color: "#999", marginBottom: "16px" }}>
                {highlightedBeat.artist} • {highlightedBeat.bpm} BPM • {highlightedBeat.key}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button
                  onClick={() => playBeat(highlightedBeat)}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    background: currentBeat?.id === highlightedBeat.id && isPlaying ? "#fff" : "transparent",
                    color: currentBeat?.id === highlightedBeat.id && isPlaying ? "#000" : "#fff",
                    fontSize: "20px",
                    cursor: "pointer",
                  }}
                >
                  {currentBeat?.id === highlightedBeat.id && isPlaying ? "⏸" : "▶"}
                </button>
                <span style={{ fontSize: "24px", fontWeight: "bold" }}>{highlightedBeat.price} CZK</span>
                {user && (
                  <button
                    onClick={() => toggleSave(highlightedBeat)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={savedBeats.has(highlightedBeat.id) ? "#ff4444" : "none"}
                      stroke={savedBeats.has(highlightedBeat.id) ? "#ff4444" : "#fff"}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}
                <button className="btn" onClick={() => handleAddToCart(highlightedBeat)}>
                  DO KOŠÍKU
                </button>
              </div>
            </div>
          </div>
          
          <WaveVisualization
            audioUrl={highlightedBeat.preview_url}
            isPlaying={currentBeat?.id === highlightedBeat.id && isPlaying}
            audioRef={audioRef}
          />
        </div>
      )}

      {!highlightedBeat && (
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <img
            src="/uploads/artwork/metallic-logo.png"
            alt="VOODOO808"
            style={{ maxWidth: "400px", width: "100%" }}
          />
        </div>
      )}

      {currentBeat && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#111",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #333",
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => playBeat(currentBeat)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "1px solid #fff",
                background: "transparent",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <div>
              <div style={{ fontWeight: "bold" }}>{currentBeat.title}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                {currentBeat.artist} • {currentBeat.bpm} BPM • {currentBeat.key}
              </div>
            </div>
          </div>
          <div style={{ fontWeight: "bold" }}>{currentBeat.price} CZK</div>
        </div>
      )}

      <div style={{ paddingBottom: currentBeat ? "80px" : "20px" }}>
        {otherBeats.length === 0 && !highlightedBeat ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            Zatím nejsou k dispozici žádné beaty
          </p>
        ) : (
          otherBeats.map((beat) => (
            <div
              key={beat.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #222",
                gap: "16px",
              }}
            >
              <button
                onClick={() => playBeat(beat)}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "1px solid #fff",
                  background:
                    currentBeat?.id === beat.id && isPlaying ? "#fff" : "transparent",
                  color: currentBeat?.id === beat.id && isPlaying ? "#000" : "#fff",
                  flexShrink: 0,
                }}
              >
                {currentBeat?.id === beat.id && isPlaying ? "⏸" : "▶"}
              </button>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>{beat.title}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {beat.artist} • {beat.bpm} BPM • {beat.key}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontWeight: "bold" }}>{beat.price} CZK</span>
                {user && (
                  <button
                    onClick={() => toggleSave(beat)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "8px",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={savedBeats.has(beat.id) ? "#ff4444" : "none"}
                      stroke={savedBeats.has(beat.id) ? "#ff4444" : "#fff"}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                )}
                <button className="btn" onClick={() => handleAddToCart(beat)}>
                  DO KOŠÍKU
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Beaty;
