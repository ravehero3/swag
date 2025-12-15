import { useState, useEffect, useRef } from "react";
import { useApp } from "../App";

interface SoundKit {
  id: number;
  title: string;
  description: string;
  type: string;
  price: number;
  is_free: boolean;
  number_of_sounds: number;
  tags: string[];
  preview_url: string;
  artwork_url: string;
}

const typeLabels: Record<string, string> = {
  drum_kit: "Drum Kit",
  one_shot_kit: "One Shot Kit",
  loop_kit: "Loop Kit",
  one_shot_bundle: "One Shot Bundle",
  drum_kit_bundle: "Drum Kit Bundle",
};

function Zvuky() {
  const [kits, setKits] = useState<SoundKit[]>([]);
  const [currentKit, setCurrentKit] = useState<SoundKit | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { addToCart } = useApp();

  useEffect(() => {
    fetch("/api/sound-kits")
      .then((res) => res.json())
      .then(setKits)
      .catch(console.error);
  }, []);

  const playPreview = (kit: SoundKit) => {
    if (!kit.preview_url) return;
    
    if (currentKit?.id === kit.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentKit(kit);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 100);
    }
  };

  const handleAddToCart = (kit: SoundKit) => {
    if (kit.is_free) return;
    addToCart({
      productId: kit.id,
      productType: "sound_kit",
      title: kit.title,
      price: Number(kit.price),
      artworkUrl: kit.artwork_url || "/uploads/artwork/metallic-logo.png",
    });
  };

  return (
    <div className="fade-in">
      <audio
        ref={audioRef}
        src={currentKit?.preview_url}
        onEnded={() => setIsPlaying(false)}
      />

      {kits.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666", padding: "40px" }}>
          Zatím nejsou k dispozici žádné zvukové kity
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {kits.map((kit) => (
            <div
              key={kit.id}
              style={{
                border: "1px solid #333",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  aspectRatio: "1",
                  background: "#111",
                  position: "relative",
                }}
              >
                <img
                  src={kit.artwork_url || "/uploads/artwork/metallic-logo.png"}
                  alt={kit.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {kit.preview_url && (
                  <button
                    onClick={() => playPreview(kit)}
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      right: "12px",
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      border: "1px solid #fff",
                      background: currentKit?.id === kit.id && isPlaying ? "#fff" : "rgba(0,0,0,0.8)",
                      color: currentKit?.id === kit.id && isPlaying ? "#000" : "#fff",
                      fontSize: "18px",
                    }}
                  >
                    {currentKit?.id === kit.id && isPlaying ? "⏸" : "▶"}
                  </button>
                )}
              </div>

              <div style={{ padding: "16px" }}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                  {typeLabels[kit.type] || kit.type}
                </div>
                <h3 style={{ marginBottom: "8px" }}>{kit.title}</h3>
                <p style={{ fontSize: "14px", color: "#999", marginBottom: "12px" }}>
                  {kit.number_of_sounds} zvuků
                </p>

                {kit.tags && kit.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                    {kit.tags.slice(0, 5).map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          border: "1px solid #444",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "bold" }}>
                    {kit.is_free ? "ZDARMA" : `${kit.price} CZK`}
                  </span>
                  <button
                    className="btn"
                    onClick={() => handleAddToCart(kit)}
                  >
                    {kit.is_free ? "STÁHNOUT" : "DO KOŠÍKU"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Zvuky;
