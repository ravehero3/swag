import { useState, useEffect } from "react";
import { useApp } from "../App.js";
import { Link, useLocation } from "wouter";

interface SavedItem {
  id: number;
  item_id: number;
  item_type: string;
  item_data: {
    id: number;
    title: string;
    artist?: string;
    bpm?: number;
    key?: string;
    price: number;
    preview_url?: string;
    preview_urls?: string[];
    artwork_url?: string;
    type?: string;
    number_of_sounds?: number;
    is_free?: boolean;
  };
}

const typeLabels: Record<string, string> = {
  free: "FREE",
  drum_kit: "Drum Kit",
  one_shot_kit: "One Shot Kit",
  loop_kit: "Loop Kit",
  one_shot_bundle: "One Shot Bundle",
  drum_kit_bundle: "Drum Kit Bundle",
};

function Ulozeno() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [removingItems, setRemovingItems] = useState<Set<number>>(new Set());
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());
  const { user, addToCart, cart, authLoading, refreshSavedCount, previewPlayer } = useApp() as any;
  const [location] = useLocation();

  const cartCount = cart.length;

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSavedItems(data.filter((item: SavedItem) => item.item_data != null));
          }
        })
        .catch(console.error);
    } else {
      const savedBeatsJson = localStorage.getItem("voodoo808_saved_beats");
      const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");

      const savedBeats = savedBeatsJson ? JSON.parse(savedBeatsJson) : [];
      const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];

      const combined = [
        ...savedBeats.map((beat: any, idx: number) => ({
          id: -(idx + 1),
          item_id: beat.id,
          item_type: "beat",
          item_data: beat,
        })),
        ...savedKits.map((kit: any, idx: number) => ({
          id: -1000 - (idx + 1),
          item_id: kit.id,
          item_type: "sound_kit",
          item_data: kit,
        })),
      ];
      setSavedItems(combined);
    }
  }, [user, authLoading]);

  const getPreviewUrl = (item: SavedItem) => {
    const urls = [
      ...(Array.isArray(item.item_data.preview_urls) ? item.item_data.preview_urls : []),
      item.item_data.preview_url,
    ].filter((url): url is string => typeof url === "string" && url.trim().length > 0);
    return urls[0] || "";
  };

  const toPreviewPlayerItem = (item: SavedItem) => {
    const previewUrl = getPreviewUrl(item);
    if (!previewUrl) return null;
    return {
      id: item.item_data.id,
      title: item.item_data.title,
      artist: item.item_type === "beat" ? item.item_data.artist || "Beat" : typeLabels[item.item_data.type || ""] || "Sound Kit",
      bpm: item.item_data.bpm || 0,
      key: item.item_data.key || "",
      price: Number(item.item_data.price),
      preview_url: previewUrl,
      artwork_url: item.item_data.artwork_url || "/uploads/artwork/metallic-logo.png",
      product_type: item.item_type === "beat" ? "beat" as const : "sound_kit" as const,
    };
  };

  const playPreview = (item: SavedItem) => {
    const previewItem = toPreviewPlayerItem(item);
    if (!previewItem) return;
    const queue = savedItems.map(toPreviewPlayerItem).filter(Boolean);
    previewPlayer.playPreview(previewItem, queue);
  };

  const handleRemove = async (item: SavedItem) => {
    if (user) {
      await fetch(`/api/saved/${item.item_type}/${item.item_id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } else {
      if (item.item_type === "beat") {
        const savedBeatsJson = localStorage.getItem("voodoo808_saved_beats");
        const savedBeats = savedBeatsJson ? JSON.parse(savedBeatsJson) : [];
        const filtered = savedBeats.filter((b: any) => b.id !== item.item_id);
        localStorage.setItem("voodoo808_saved_beats", JSON.stringify(filtered));
      } else {
        const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");
        const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];
        const filtered = savedKits.filter((k: any) => k.id !== item.item_id);
        localStorage.setItem("voodoo808_saved_kits", JSON.stringify(filtered));
      }
    }
    setSavedItems((prev) => prev.filter((s) => s.id !== item.id));
    refreshSavedCount();
  };

  const handleAddToCart = (item: SavedItem) => {
    if (item.item_data.is_free) return;
    if (removingItems.has(item.id)) return;

    addToCart({
      productId: item.item_data.id,
      productType: item.item_type as "beat" | "sound_kit",
      title: item.item_data.title,
      price: Number(item.item_data.price),
      artworkUrl: item.item_data.artwork_url || "/uploads/artwork/metallic-logo.png",
    });

    // Phase 1: flash the button green
    setAddedItems((prev) => new Set(prev).add(item.id));

    // Phase 2: after brief pause, start the card exit animation
    setTimeout(() => {
      setRemovingItems((prev) => new Set(prev).add(item.id));
    }, 320);

    // Phase 3: after animation completes, remove from saved list + server
    setTimeout(() => {
      handleRemove(item);
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      setAddedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 820);
  };

  const sectionStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "700px",
    margin: "0 auto",
    borderBottom: "0.5px solid #333",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "0 20px",
    position: "relative",
    zIndex: 10,
  };

  const titleFont = {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight: 700,
    textTransform: "uppercase" as const,
  };

  const regularFont = {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight: 400,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center" style={{ minHeight: "calc(100vh - 42px)" }}>
        <style>{`
          @keyframes vu-dot { 0%,80%,100%{transform:translateY(0);opacity:.3} 40%{transform:translateY(-6px);opacity:1} }
          .vu-dot{width:6px;height:6px;border-radius:50%;background:#fff;animation:vu-dot 1.2s ease-in-out infinite}
          .vu-dot:nth-child(2){animation-delay:.2s}.vu-dot:nth-child(3){animation-delay:.4s}
        `}</style>
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="vu-dot" />
          <div className="vu-dot" />
          <div className="vu-dot" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black text-white fade-in overflow-x-hidden relative flex flex-col"
      style={{ minHeight: "calc(100vh - 42px)" }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cartOut {
          0%   { opacity: 1; transform: scale(1) translateY(0); }
          40%  { opacity: 0.6; transform: scale(0.94) translateY(-6px); }
          100% { opacity: 0; transform: scale(0.84) translateY(-18px); }
        }
        .ulozeno-card {
          transition: transform 0.2s ease;
          cursor: default;
        }
        .ulozeno-card:hover {
          transform: scale(1.015);
        }
        .ulozeno-card.removing {
          animation: cartOut 0.48s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          pointer-events: none;
        }
        .ulozeno-cart-btn {
          padding: 8px 0;
          border: none;
          font-size: 12px;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-weight: 700;
          cursor: pointer;
          border-radius: 4px;
          width: 100%;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: background 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
        }
        .ulozeno-cart-btn.default {
          background: #fff;
          color: #000;
        }
        .ulozeno-cart-btn.added {
          background: #24e053;
          color: #000;
          box-shadow: 0 0 14px rgba(36, 224, 83, 0.45);
        }
      `}} />

      {/* Vertical lines */}
      <div className="hidden md:block" style={{
        position: "absolute",
        left: "calc(50vw - 350px)",
        top: 0,
        bottom: 0,
        width: "0.5px",
        backgroundColor: "#333",
        zIndex: 5,
        pointerEvents: "none",
      }} />
      <div className="hidden md:block" style={{
        position: "absolute",
        right: "calc(50vw - 350px)",
        top: 0,
        bottom: 0,
        width: "0.5px",
        backgroundColor: "#333",
        zIndex: 5,
        pointerEvents: "none",
      }} />

      <div style={{ flex: 1 }}>
        {/* Section 1: Title */}
        <section style={{ ...sectionStyle, height: "224px" }}>
          <h1 style={{ ...titleFont, fontSize: "18px", letterSpacing: "0.1em" }}>ULOŽENÉ POLOŽKY</h1>
          {savedItems.length === 0 && (
            <p style={{ ...regularFont, fontSize: "12px", color: "#888", marginTop: "8px" }}>Váš list je prázdný</p>
          )}
        </section>

        {/* Section 2: Navigation */}
        <section style={{ ...sectionStyle, height: "44px", flexDirection: "row", gap: "24px" }}>
          <Link href="/ulozeno">
            <span style={{
              ...regularFont,
              fontSize: "14px",
              cursor: "pointer",
              color: "white",
              padding: "4px 12px",
              border: location === "/ulozeno" ? "0.5px solid #333" : "none",
              borderRadius: "4px",
            }}>
              ULOŽENÉ PRODUKTY
            </span>
          </Link>
          <Link href="/kosik">
            <span style={{
              ...regularFont,
              fontSize: "14px",
              cursor: "pointer",
              color: "white",
              padding: "4px 12px",
              border: location === "/kosik" ? "0.5px solid #333" : "none",
              borderRadius: "4px",
            }}>
              KOŠÍK {cartCount > 0 && `(${cartCount})`}
            </span>
          </Link>
        </section>

        {/* Login CTA */}
        {!user && (
          <section style={{ ...sectionStyle, height: "224px" }}>
            <h2 style={{ ...titleFont, fontSize: "14px", letterSpacing: "0.05em", marginBottom: "8px" }}>
              HLEDÁTE SVÉ ULOŽENÉ PŘEDMĚTY?
            </h2>
            <p style={{ ...regularFont, fontSize: "12px", color: "#aaa", maxWidth: "400px" }}>
              Přihlaste se a pokračujte kde jste přestali nebo začněte budovat nový wishlist.
            </p>
            <div style={{ height: "16px" }} />
            <Link href="/prihlasit-se">
              <span className="login-glow-button" style={{
                backgroundColor: "white",
                color: "black",
                padding: "10px 24px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "all 0.3s ease",
              }}>
                PŘIHLÁSIT SE
              </span>
            </Link>
            <style dangerouslySetInnerHTML={{ __html: `
              .login-glow-button:hover {
                box-shadow: 0 0 15px rgba(255,255,255,0.8);
                transform: translateY(-1px);
              }
            `}} />
          </section>
        )}

        {/* Empty state */}
        {savedItems.length === 0 && (
          <section style={{ ...sectionStyle, borderBottom: "none", height: "150px" }}>
            <h2 style={{ ...titleFont, fontSize: "14px", letterSpacing: "0.05em", marginBottom: "8px" }}>
              ULOŽTE SI VAŠE OBLÍBENÉ POLOŽKY
            </h2>
            <p style={{ ...regularFont, fontSize: "12px", color: "#888" }}>
              Klikněte na ikonu srdce a uložte si položky na tuto stránku
            </p>
          </section>
        )}

        {/* Items grid — 2 columns, aligned to vertical lines */}
        {savedItems.length > 0 && (
          <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px 80px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
              {savedItems.map((item) => {
                const isRemoving = removingItems.has(item.id);
                const isAdded = addedItems.has(item.id);
                const previewUrl = getPreviewUrl(item);
                const itemPlaying =
                  previewPlayer.currentItem?.id === item.item_data.id &&
                  previewPlayer.currentItem?.product_type === (item.item_type === "beat" ? "beat" : "sound_kit") &&
                  previewPlayer.isPlaying;
                return (
                  <div
                    key={item.id}
                    className={`ulozeno-card${isRemoving ? " removing" : ""}`}
                    style={{
                      padding: "16px",
                      background: "#111111",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Artwork */}
                    <div className="voodoo-play-surface" style={{ position: "relative", width: "100%", aspectRatio: "1/1", marginBottom: "12px", overflow: "hidden", borderRadius: "4px", background: "#050505" }}>
                      <img
                        src={item.item_data.artwork_url || "/uploads/artwork/metallic-logo.png"}
                        alt={item.item_data.title}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                      {/* Play button */}
                      {previewUrl && (
                        <>
                          <div className={`voodoo-play-ring${itemPlaying ? " is-visible" : ""}`} />
                          <button
                            onClick={() => playPreview(item)}
                            className={`ulozeno-play-btn voodoo-play-button${itemPlaying ? " is-playing is-visible" : ""}`}
                            style={{ paddingLeft: itemPlaying ? 0 : "3px" }}
                            data-testid={`button-play-saved-${item.item_id}`}
                          >
                            {itemPlaying ? "⏸" : "▶"}
                          </button>
                        </>
                      )}
                      {/* Remove (heart) button */}
                      <button
                        onClick={() => handleRemove(item)}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "0",
                          background: "rgba(13,13,13,0.6)",
                          border: "none",
                          borderRadius: "50%",
                          width: "28px",
                          height: "28px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#fff",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>

                    {/* Title */}
                    <h3 style={{ ...titleFont, fontSize: "14px", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.item_data.title}
                    </h3>

                    {/* Type + detail */}
                    <p style={{ ...regularFont, fontSize: "12px", color: "#666", margin: "0 0 12px 0", textTransform: "capitalize" }}>
                      {item.item_type === "beat"
                        ? `Beat${item.item_data.bpm ? " • " + item.item_data.bpm + " BPM" : ""}${item.item_data.key ? " • " + item.item_data.key : ""}`
                        : typeLabels[item.item_data.type || ""] || "Sound Kit"}
                    </p>

                    {/* Price + cart button */}
                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ ...titleFont, fontSize: "13px", color: "#fff" }}>
                        {item.item_data.is_free ? "ZDARMA" : `${item.item_data.price} CZK`}
                      </span>
                      {!item.item_data.is_free && (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className={`ulozeno-cart-btn ${isAdded ? "added" : "default"}`}
                          data-testid={`button-add-to-cart-${item.item_id}`}
                        >
                          {isAdded ? "✓ PŘIDÁNO" : "DO KOŠÍKU"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Ulozeno;
