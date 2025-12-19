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
  const [savedKits, setSavedKits] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart } = useApp();

  useEffect(() => {
    fetch("/api/sound-kits")
      .then((res) => res.json())
      .then(setKits)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then((items) => {
          const kitIds = items
            .filter((item: { item_type: string }) => item.item_type === "sound_kit")
            .map((item: { item_id: number }) => item.item_id);
          setSavedKits(new Set(kitIds));
        })
        .catch(console.error);
    }
  }, [user]);

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

  const toggleSave = async (kit: SoundKit) => {
    if (!user) return;

    try {
      if (savedKits.has(kit.id)) {
        const res = await fetch(`/api/saved/sound_kit/${kit.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          setSavedKits((prev) => {
            const next = new Set(prev);
            next.delete(kit.id);
            return next;
          });
        }
      } else {
        const res = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ itemId: kit.id, itemType: "sound_kit" }),
        });
        if (res.ok) {
          setSavedKits((prev) => new Set([...prev, kit.id]));
        }
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  return (
    <div className="fade-in" style={{ padding: "0 20px" }}>
      <audio
        ref={audioRef}
        src={currentKit?.preview_url}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>ZVUKY</h2>
      </div>

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
                position: "relative",
              }}
            >
              {user && (
                <button
                  onClick={() => toggleSave(kit)}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    cursor: "pointer",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={savedKits.has(kit.id) ? "#ff4444" : "none"}
                    stroke={savedKits.has(kit.id) ? "#ff4444" : "#fff"}
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              )}

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
                    onClick={() => handleAddToCart(kit)}
                    className="btn-bounce"
                    style={{
                      padding: "12px 16px",
                      background: "#fff",
                      color: "#000",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {!kit.is_free && (
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span style={{ position: "absolute", top: "-2px", right: "16px", fontSize: "10px", fontWeight: "bold", color: "#fff", background: "#24e053", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</span>
                      </div>
                    )}
                    {kit.is_free ? "STÁHNOUT" : `${kit.price} CZK`}
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
