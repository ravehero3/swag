import { useState, useEffect, useRef } from "react";
import { useApp } from "../App.js";
import { useLocation } from "wouter";
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

// Module-level cache — starts fetching the moment this file is imported,
// which happens when the router matches /zvuky, before any render occurs.
let _kitsCache: SoundKit[] | null = null;
let _kitsFetchPromise: Promise<SoundKit[]> | null = null;

function prefetchKits(): Promise<SoundKit[]> {
  if (_kitsCache !== null) return Promise.resolve(_kitsCache);
  if (!_kitsFetchPromise) {
    _kitsFetchPromise = fetch("/api/sound-kits")
      .then((res) => res.json())
      .then((data: SoundKit[]) => {
        _kitsCache = Array.isArray(data) && data.length > 0 ? data : [];
        return _kitsCache;
      })
      .catch(() => {
        _kitsCache = [];
        return _kitsCache;
      });
  }
  return _kitsFetchPromise;
}

// Kick off the request immediately at import time.
prefetchKits();

function Zvuky() {
  const [kits, setKits] = useState<SoundKit[]>(() => _kitsCache ?? []);
  const [loading, setLoading] = useState(() => _kitsCache === null);
  const [currentKit, setCurrentKit] = useState<SoundKit | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedKits, setSavedKits] = useState<Set<number>>(new Set());
  const [saveToast, setSaveToast] = useState<{ text: string; saved: boolean } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart, settings, refreshSavedCount } = useApp() as any;
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If the cache was already populated before the first render, skip waiting.
    if (_kitsCache !== null) return;
    prefetchKits().then((data) => {
      setKits(data);
      setLoading(false);
    });
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

  const showToast = (text: string, saved: boolean) => {
    setSaveToast({ text, saved });
    setTimeout(() => setSaveToast(null), 2200);
  };

  const toggleSave = async (kit: SoundKit) => {
    if (!user) {
      showToast("Přihlaste se pro ukládání", false);
      setTimeout(() => setLocation("/prihlasit-se"), 1200);
      return;
    }
    try {
      if (savedKits.has(kit.id)) {
        const res = await fetch(`/api/saved/sound_kit/${kit.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          setSavedKits((prev) => { const next = new Set(prev); next.delete(kit.id); return next; });
          refreshSavedCount();
          showToast("Odebráno z uložených", false);
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
          showToast(`Uloženo: ${kit.title}`, true);
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
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "#000" }}>

      {/* Save toast */}
      {saveToast && (
        <div style={{
          position: "fixed",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          background: saveToast.saved ? "rgba(232,48,74,0.15)" : "rgba(40,40,40,0.95)",
          border: `1px solid ${saveToast.saved ? "rgba(232,48,74,0.4)" : "#333"}`,
          color: saveToast.saved ? "#e8304a" : "#aaa",
          padding: "10px 20px",
          borderRadius: "20px",
          fontSize: "13px",
          zIndex: 1000,
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
          transition: "opacity 0.3s",
        }}>
          {saveToast.saved && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#e8304a"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          )}
          {saveToast.text}
        </div>
      )}

      {/* Fixed wall background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: `url(/wall_background_new.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none",
        }}
      >
        {/* Top fade */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, black 0%, transparent 35%)", pointerEvents: "none" }} />
        {/* Bottom fade */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, black 0%, transparent 35%)", pointerEvents: "none" }} />
        {/* Left fade */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, black 0%, transparent 30%)", pointerEvents: "none" }} />
        {/* Right fade */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, black 0%, transparent 30%)", pointerEvents: "none" }} />
      </div>

      <audio
        ref={audioRef}
        src={currentKit?.preview_url}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Content — above video */}
      <div style={{ position: "relative", zIndex: 2, paddingTop: "100px" }}>
        {loading ? (
          <div style={{ width: "100%", padding: "0 20px", display: "flex", justifyContent: "center" }}>
            <style>{`
              @keyframes skeletonPulse {
                0%, 100% { opacity: 0.04; }
                50% { opacity: 0.10; }
              }
              .sk { background: #fff; border-radius: 4px; animation: skeletonPulse 1.6s ease-in-out infinite; }
            `}</style>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0", maxWidth: "1200px", width: "100%" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding: "8px", animationDelay: `${i * 80}ms` }}>
                  <div className="sk" style={{ aspectRatio: "1", borderRadius: "4px", animationDelay: `${i * 80}ms` }} />
                  <div style={{ padding: "16px 0 8px" }}>
                    <div className="sk" style={{ height: "10px", width: "40%", marginBottom: "10px", animationDelay: `${i * 80 + 60}ms` }} />
                    <div className="sk" style={{ height: "14px", width: "70%", marginBottom: "10px", animationDelay: `${i * 80 + 120}ms` }} />
                    <div className="sk" style={{ height: "10px", width: "30%", animationDelay: `${i * 80 + 180}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : kits.length > 0 ? (
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
