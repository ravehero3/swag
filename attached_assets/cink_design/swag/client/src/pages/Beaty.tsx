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
}

function Beaty() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { addToCart } = useApp();

  useEffect(() => {
    fetch("/api/beats")
      .then((res) => res.json())
      .then(setBeats)
      .catch(console.error);
  }, []);

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

  return (
    <div className="fade-in">
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <img
          src="/uploads/artwork/metallic-logo.png"
          alt="VOODOO808"
          style={{ maxWidth: "400px", width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>Všechny Beaty</h2>
      </div>

      <audio
        ref={audioRef}
        src={currentBeat?.preview_url}
        onEnded={() => setIsPlaying(false)}
      />

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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => playBeat(currentBeat)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid #fff",
                background: "transparent",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px",
                fontSize: "14px",
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
        {beats.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            Zatím nejsou k dispozici žádné beaty
          </p>
        ) : (
          beats.map((beat) => (
            <div
              key={beat.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: "1px solid #222",
                gap: "16px",
                borderRadius: "4px",
                border: currentBeat?.id === beat.id ? "1px solid #0066ff" : "1px solid transparent",
                boxShadow: currentBeat?.id === beat.id ? "0 0 0 1px #0066ff, 0 0 12px 0 rgba(0, 102, 255, 0.5)" : "none",
                transition: "all 0.2s",
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
                <span style={{ fontWeight: "normal", marginRight: "4px" }}>{beat.price} CZK</span>
                <button className="btn" onClick={() => handleAddToCart(beat)}>
                  <span style={{ marginRight: "4px" }}>+</span> DO KOŠÍKU
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
