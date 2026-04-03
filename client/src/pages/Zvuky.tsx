import { useState, useEffect, useRef } from "react";
import { useApp } from "../App.js";
import ProductsGrid from "../components/ProductsGrid.js";

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
  const [loading, setLoading] = useState(true);
  const [currentKit, setCurrentKit] = useState<SoundKit | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedKits, setSavedKits] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart, settings, refreshSavedCount } = useApp() as any;

  useEffect(() => {
    fetch("/api/sound-kits")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setKits(data);
        } else {
          setKits([]);
        }
        setLoading(false);
      })
      .catch(() => { setKits([]); setLoading(false); });
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
    } else {
      const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");
      const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];
      setSavedKits(new Set(savedKits.map((k: any) => k.id)));
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
    if (user) {
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
            refreshSavedCount();
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
            refreshSavedCount();
          }
        }
      } catch (error) {
        console.error("Error toggling save:", error);
      }
    } else {
      const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");
      const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];
      if (savedKits.find((k: any) => k.id === kit.id)) {
        const filtered = savedKits.filter((k: any) => k.id !== kit.id);
        localStorage.setItem("voodoo808_saved_kits", JSON.stringify(filtered));
        setSavedKits((prev) => {
          const next = new Set(prev);
          next.delete(kit.id);
          return next;
        });
      } else {
        savedKits.push(kit);
        localStorage.setItem("voodoo808_saved_kits", JSON.stringify(savedKits));
        setSavedKits((prev) => new Set([...prev, kit.id]));
      }
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
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "#000" }}>

      {/* Fixed wall background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(/attached_assets/wall_background_1768155050336.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at center, transparent 0%, rgba(13,13,13,0.4) 40%, rgba(13,13,13,0.9) 85%, black 100%)",
          }}
        />
      </div>

      {/* Fixed video background — behind content */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "70vh",
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <video
          key={settings?.zvuky_video}
          src={settings?.zvuky_video || "/uploads/hrad-na-web.mov"}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.7 }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            background: "linear-gradient(to bottom, transparent, #000)",
          }}
        />
      </div>

      <audio
        ref={audioRef}
        src={currentKit?.preview_url}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Content — above video */}
      <div style={{ position: "relative", zIndex: 2, paddingTop: "100px" }}>
        {loading ? null : kits.length > 0 ? (
          <div style={{ width: "100%", marginBottom: "48px" }}>
            <ProductsGrid
              products={products}
              savedProducts={Array.from(savedKits)}
              onToggleSave={(id) => toggleSave(kits.find((k) => k.id === id)!)}
              onPlayClick={(id) => playPreview(kits.find((k) => k.id === id)!)}
              isPlaying={isPlaying}
              currentPlayingId={currentKit?.id}
              onAddToCart={(id) => handleAddToCart(kits.find((k) => k.id === id)!)}
            />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "#fff" }}>
            <p style={{ opacity: 0.6, fontSize: "14px", letterSpacing: "1px" }}>Žádné zvukové kity nebyly nalezeny.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Zvuky;
