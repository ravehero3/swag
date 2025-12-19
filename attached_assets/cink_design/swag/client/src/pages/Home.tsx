import { useState, useEffect, useRef } from "react";
import { useApp } from "../App";
import { Link } from "wouter";

interface Beat {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  price: number;
  preview_url: string;
  artwork_url: string;
  featured: boolean;
}

function Home() {
  const [featuredBeat, setFeaturedBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { addToCart } = useApp();

  useEffect(() => {
    fetch("/api/beats")
      .then((res) => res.json())
      .then((beats) => {
        const featured = beats.find((b: Beat) => b.featured) || beats[0];
        setFeaturedBeat(featured);
      })
      .catch(console.error);
  }, []);

  const playBeat = () => {
    if (!featuredBeat) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleAddToCart = () => {
    if (!featuredBeat) return;
    addToCart({
      productId: featuredBeat.id,
      productType: "beat",
      title: featuredBeat.title,
      price: Number(featuredBeat.price),
      artworkUrl: featuredBeat.artwork_url || "/uploads/artwork/metallic-logo.png",
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

      {featuredBeat && (
        <div
          style={{
            marginBottom: "60px",
            paddingBottom: "40px",
            borderBottom: "1px solid #222",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
            Beat týdne
          </h2>

          <audio
            ref={audioRef}
            src={featuredBeat.preview_url}
            onEnded={() => setIsPlaying(false)}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              alignItems: "center",
            }}
          >
            <div style={{ aspectRatio: "1", position: "relative" }}>
              <img
                src={featuredBeat.artwork_url || "/uploads/artwork/metallic-logo.png"}
                alt={featuredBeat.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div>
              <h3 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "12px" }}>
                {featuredBeat.title}
              </h3>
              <p style={{ color: "#666", marginBottom: "20px", fontSize: "16px" }}>
                {featuredBeat.artist} • {featuredBeat.bpm} BPM • {featuredBeat.key}
              </p>

              <div style={{ marginBottom: "20px" }}>
                <button
                  onClick={playBeat}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    border: "1px solid #fff",
                    background: "transparent",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    cursor: "pointer",
                    marginBottom: "20px",
                  }}
                >
                  {isPlaying ? "⏸" : "▶"}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <span style={{ fontSize: "24px", fontWeight: "bold" }}>
                  {featuredBeat.price} CZK
                </span>
                <button className="btn" onClick={handleAddToCart}>
                  <span style={{ marginRight: "4px" }}>+</span> DO KOŠÍKU
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Chceš vidět více beatů?</h2>
        <Link href="/beaty">
          <button className="btn">Jdi do Beaty →</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
