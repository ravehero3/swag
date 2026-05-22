import { useState, useEffect } from "react";
import { useApp } from "../App.js";
import { useLocation } from "wouter";
import ProductsGrid from "../components/ProductsGrid.js";
import { preloadWaveform, seedWaveformCache } from "../lib/waveformCache.js";

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
  preview_urls?: string[];
  artwork_url: string;
  waveform_data?: number[] | null;
}

const typeLabels: Record<string, string> = {
  drum_kit: "Drum Kit",
  one_shot_kit: "One Shot Kit",
  loop_kit: "Loop Kit",
  one_shot_bundle: "One Shot Bundle",
  drum_kit_bundle: "Drum Kit Bundle",
  free: "FREE",
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
        // Seed waveform cache so the player draws the same wave as for beats.
        // For kits without precomputed data, schedule background extraction
        // and persist the result via the kit-aware POST endpoint.
        _kitsCache.forEach((kit, i) => {
          // Preload artwork image into browser cache
          if (kit.artwork_url) {
            const img = new Image();
            img.src = kit.artwork_url;
          }
          const url = (Array.isArray(kit.preview_urls) && kit.preview_urls[0]) || kit.preview_url;
          if (!url) return;
          if (kit.waveform_data && Array.isArray(kit.waveform_data)) {
            seedWaveformCache(url, kit.waveform_data);
          } else {
            setTimeout(() => preloadWaveform(url, kit.id, "sound_kit"), i * 120);
          }
        });
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
  const [savedKits, setSavedKits] = useState<Set<number>>(new Set());
  const [saveToast, setSaveToast] = useState<{ text: string; saved: boolean } | null>(null);
  const { user, addToCart, settings, refreshSavedCount, previewPlayer } = useApp() as any;
  const [, setLocation] = useLocation();

  const getKitPreviewUrl = (kit: SoundKit) => {
    const urls = [
      ...(Array.isArray(kit.preview_urls) ? kit.preview_urls : []),
      kit.preview_url,
    ].filter((url): url is string => typeof url === "string" && url.trim().length > 0);
    return urls[0] || "";
  };

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

  const playPreview = async (kit: SoundKit) => {
    const previewUrl = getKitPreviewUrl(kit);
    if (!previewUrl) {
      console.error("Sound kit has no preview URL:", kit.title);
      return;
    }
    const queue = kits
      .map((item) => {
        const url = getKitPreviewUrl(item);
        if (!url) return null;
        return {
          id: item.id,
          title: item.title,
          artist: typeLabels[item.type] || "Sound Kit",
          bpm: 0,
          key: "",
          price: Number(item.price),
          preview_url: url,
          artwork_url: item.artwork_url || "/uploads/artwork/metallic-logo.png",
          product_type: "sound_kit" as const,
        };
      })
      .filter(Boolean);
    await previewPlayer.playPreview({
      id: kit.id,
      title: kit.title,
      artist: typeLabels[kit.type] || "Sound Kit",
      bpm: 0,
      key: "",
      price: Number(kit.price),
      preview_url: previewUrl,
      artwork_url: kit.artwork_url || "/uploads/artwork/metallic-logo.png",
      product_type: "sound_kit",
    }, queue);
  };

  const handleAddToCart = (kit: SoundKit) => {
    addToCart({
      productId: kit.id,
      productType: "sound_kit",
      title: kit.title,
      price: kit.is_free ? 0 : Number(kit.price),
      artworkUrl: kit.artwork_url || "/uploads/artwork/metallic-logo.png",
    });
    if (kit.is_free) {
      setLocation("/pokladna");
    }
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
    hasPreview: !!getKitPreviewUrl(kit),
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

      {/* Content — above video */}
      <div style={{ position: "relative", zIndex: 2, paddingTop: "100px" }}>
        <SpecialOfferBanner settings={settings} />
        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 20px" }}>
            <p style={{ color: "#555", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", margin: 0 }}>
              Načítání…
            </p>
          </div>
        ) : kits.length > 0 ? (
          <div style={{ width: "100%", marginBottom: "48px" }}>
            <ProductsGrid
              products={products}
              savedProducts={Array.from(savedKits)}
              onToggleSave={(id) => toggleSave(kits.find((k) => k.id === id)!)}
              onPlayClick={(id) => playPreview(kits.find((k) => k.id === id)!)}
              isPlaying={previewPlayer.isPlaying && previewPlayer.currentItem?.product_type === "sound_kit"}
              currentPlayingId={previewPlayer.currentItem?.product_type === "sound_kit" ? previewPlayer.currentItem?.id : undefined}
              onAddToCart={(id) => handleAddToCart(kits.find((k) => k.id === id)!)}
              compactCards
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

function SpecialOfferBanner({ settings }: { settings: Record<string, string> }) {
  const isEnabled = settings?.special_offer_enabled === "true";
  const percentage = parseInt(settings?.special_offer_percentage || "15", 10);
  const text = settings?.special_offer_text || "SPECIÁLNÍ AKCE! Omezená nabídka končí za chvíli. Využijte slevový kód:";
  const durationMinutes = parseInt(settings?.special_offer_duration_minutes || "45", 10);

  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Check if permanently expired
    if (localStorage.getItem("voodoo_special_offer_expired") === "true") {
      setIsExpired(true);
      return;
    }

    let code = localStorage.getItem("voodoo_temp_promo");
    let expiresStr = localStorage.getItem("voodoo_temp_promo_expires");
    let expiresAt = expiresStr ? parseInt(expiresStr, 10) : 0;

    const registerCodeOnBackend = async (newCode: string) => {
      try {
        await fetch("/api/promo-codes/register-temp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: newCode }),
        });
      } catch (err) {
        console.error("Chyba při registraci dočasného kódu:", err);
      }
    };

    if (!code || !expiresAt || Date.now() > expiresAt) {
      if (expiresAt && Date.now() > expiresAt) {
        // Expired! Mark as expired forever
        localStorage.setItem("voodoo_special_offer_expired", "true");
        localStorage.removeItem("voodoo_temp_promo");
        localStorage.removeItem("voodoo_temp_promo_expires");
        setIsExpired(true);
        return;
      }

      // Generate new code
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      code = `VOODOO${randomNum}`;
      expiresAt = Date.now() + durationMinutes * 60 * 1000;

      localStorage.setItem("voodoo_temp_promo", code);
      localStorage.setItem("voodoo_temp_promo_expires", expiresAt.toString());
      
      // Register with the backend database
      registerCodeOnBackend(code);
    }

    setPromoCode(code);
    setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt! - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        localStorage.setItem("voodoo_special_offer_expired", "true");
        localStorage.removeItem("voodoo_temp_promo");
        localStorage.removeItem("voodoo_temp_promo_expires");
        setIsExpired(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isEnabled, durationMinutes]);

  const handleCopy = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isEnabled || isExpired || !promoCode || timeLeft <= 0) return null;

  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  const timeString = `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;

  return (
    <div style={{
      maxWidth: "1100px",
      margin: "0 auto 32px auto",
      padding: "20px 24px",
      borderRadius: "16px",
      background: "linear-gradient(135deg, rgba(232, 48, 74, 0.15) 0%, rgba(20, 20, 20, 0.85) 100%)",
      border: "1px solid rgba(232, 48, 74, 0.45)",
      boxShadow: "0 8px 32px 0 rgba(232, 48, 74, 0.15), inset 0 0 12px rgba(232, 48, 74, 0.1)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
      color: "#fff",
      fontFamily: "Outfit, Inter, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow highlight */}
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "-20%",
        width: "50%",
        height: "200%",
        background: "radial-gradient(ellipse at center, rgba(232, 48, 74, 0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 500px", position: "relative", zIndex: 1 }}>
        <div style={{
          background: "rgba(232, 48, 74, 0.2)",
          border: "1px solid rgba(232, 48, 74, 0.5)",
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 10px rgba(232, 48, 74, 0.3)",
        }}>
          <span style={{ fontSize: "24px", fontWeight: "bold", color: "#e8304a" }}>%</span>
        </div>
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700, letterSpacing: "0.5px" }}>
            {percentage}% SLEVA PRO VÁS!
          </h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}>
            {text}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
        {/* Countdown */}
        <div style={{
          background: "rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8304a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1.5s infinite" }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 700, color: "#e8304a", letterSpacing: "1px" }}>
            {timeString}
          </span>
        </div>

        {/* Promo code display + Copy button */}
        <div style={{ display: "flex", gap: "2px" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRight: "none",
            borderRadius: "8px 0 0 8px",
            padding: "8px 16px",
            fontFamily: "monospace",
            fontSize: "16px",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
          }}>
            {promoCode}
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#22c55e" : "#e8304a",
              color: "#fff",
              border: "none",
              borderRadius: "0 8px 8px 0",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              boxShadow: "0 4px 12px rgba(232, 48, 74, 0.2)",
            }}
          >
            {copied ? "Kopírováno!" : "Kopírovat"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default Zvuky;
