import { useState, useEffect, useRef } from "react";
import { useApp } from "../App";
import ProductsGrid from "../components/ProductsGrid";

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

  const products = kits.map((kit) => ({
    id: kit.id,
    name: kit.title,
    price: kit.price,
    images: [kit.artwork_url || "/uploads/artwork/metallic-logo.png"],
    soundCount: kit.number_of_sounds,
    type: kit.type,
    isFree: kit.is_free,
    typeLabel: typeLabels[kit.type] || kit.type,
  }));

  return (
    <div className="fade-in" style={{ padding: "0 20px" }}>
      <audio
        ref={audioRef}
        src={currentKit?.preview_url}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>ZVUKY</h2>
      </div>

      {kits.length > 0 ? (
        <div style={{ maxWidth: "1400px", margin: "0 auto", marginBottom: "48px" }}>
          <ProductsGrid
            products={products}
            savedProducts={Array.from(savedKits)}
            onToggleSave={(id) => toggleSave(kits.find((k) => k.id === id)!)}
            onPlayClick={(id) => playPreview(kits.find((k) => k.id === id)!)}
            isPlaying={isPlaying}
            currentPlayingId={currentKit?.id}
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {Array(6).fill(null).map((_, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #333",
                overflow: "hidden",
                position: "relative",
                background: "#0a0a0a",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  aspectRatio: "1",
                  background: "#111",
                  position: "relative",
                }}
              />
              <div style={{ padding: "16px", height: "160px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ height: "12px", background: "#222", width: "60%", borderRadius: "2px" }} />
                <div style={{ height: "20px", background: "#222", width: "80%", borderRadius: "2px" }} />
                <div style={{ height: "12px", background: "#222", width: "40%", borderRadius: "2px" }} />
                <div style={{ marginTop: "auto", height: "40px", background: "#222", borderRadius: "2px" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Zvuky;
