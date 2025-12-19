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
  const [playlistBeats, setPlaylistBeats] = useState<Beat[]>([]);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { addToCart } = useApp();

  useEffect(() => {
    fetch("/api/beats")
      .then((res) => res.json())
      .then((beats) => {
        const featured = beats.find((b: Beat) => b.featured) || beats[0];
        setFeaturedBeat(featured);
        // Get up to 13 beats for the playlist (excluding featured beat if it's in the list)
        const remaining = beats.filter((b: Beat) => b.id !== featured.id).slice(0, 13);
        setPlaylistBeats(remaining);
      })
      .catch(console.error);
  }, []);

  const playFeaturedBeat = () => {
    if (!featuredBeat) return;
    if (currentBeat?.id === featuredBeat.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentBeat(featuredBeat);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 100);
    }
  };

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

      <audio
        ref={audioRef}
        src={currentBeat?.preview_url}
        onEnded={() => setIsPlaying(false)}
      />

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
                  onClick={playFeaturedBeat}
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
                  {currentBeat?.id === featuredBeat.id && isPlaying ? "⏸" : "▶"}
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
                <button className="btn" onClick={() => handleAddToCart(featuredBeat)}>
                  <span style={{ marginRight: "4px" }}>+</span> DO KOŠÍKU
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {playlistBeats.length > 0 && (
        <div
          style={{
            marginBottom: "60px",
            paddingBottom: "40px",
            borderBottom: "1px solid #222",
          }}
        >
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
            Beaty Playlist
          </h2>

          <div style={{ paddingBottom: "20px" }}>
            {playlistBeats.map((beat) => (
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
                  marginBottom: "4px",
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
                    cursor: "pointer",
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
                  <span style={{ fontWeight: "normal", marginRight: "4px" }}>
                    {beat.price} CZK
                  </span>
                  <button className="btn" onClick={() => handleAddToCart(beat)}>
                    <span style={{ marginRight: "4px" }}>+</span> DO KOŠÍKU
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "20px" }}>Chceš vidět všechny beaty?</h2>
        <Link href="/beaty">
          <button className="btn">Jdi do Beaty →</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
