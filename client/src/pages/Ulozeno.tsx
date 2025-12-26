import { useState, useEffect, useRef } from "react";
import { useApp } from "../App";
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
    artwork_url?: string;
    type?: string;
    number_of_sounds?: number;
    is_free?: boolean;
  };
}

const typeLabels: Record<string, string> = {
  drum_kit: "Drum Kit",
  one_shot_kit: "One Shot Kit",
  loop_kit: "Loop Kit",
  one_shot_bundle: "One Shot Bundle",
  drum_kit_bundle: "Drum Kit Bundle",
};

function Ulozeno() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SavedItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, addToCart } = useApp();
  const [location] = useLocation();

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then(setSavedItems)
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
  }, [user]);

  const playPreview = (item: SavedItem) => {
    if (!item.item_data.preview_url) return;
    
    if (currentItem?.id === item.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentItem(item);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 100);
    }
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
    setSavedItems(savedItems.filter((s) => s.id !== item.id));
  };

  const handleAddToCart = (item: SavedItem) => {
    if (item.item_data.is_free) return;
    addToCart({
      productId: item.item_data.id,
      productType: item.item_type as "beat" | "sound_kit",
      title: item.item_data.title,
      price: Number(item.item_data.price),
      artworkUrl: item.item_data.artwork_url || "/uploads/artwork/metallic-logo.png",
    });
  };

  const beats = savedItems.filter((item) => item.item_type === "beat");
  const soundKits = savedItems.filter((item) => item.item_type === "sound_kit");

  const sectionStyle: React.CSSProperties = {
    width: "700px",
    margin: "0 auto",
    borderBottom: "0.5px solid #fff",
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

  return (
    <div className="min-h-screen bg-black text-white fade-in overflow-x-hidden relative flex flex-col" style={{ minHeight: 'calc(100vh - 42px)' }}>
      <audio
        ref={audioRef}
        src={currentItem?.item_data.preview_url}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Vertical lines effect */}
      <div className="hidden md:block" style={{
        position: 'absolute',
        left: 'calc(50vw - 350px)',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: '#fff',
        zIndex: 5,
        pointerEvents: 'none'
      }} />
      <div className="hidden md:block" style={{
        position: 'absolute',
        right: 'calc(50vw - 350px)',
        top: 0,
        bottom: 0,
        width: '1px',
        backgroundColor: '#fff',
        zIndex: 5,
        pointerEvents: 'none'
      }} />

      <div style={{ flex: 1 }}>
        {/* Section 1: Title */}
        <section style={{ ...sectionStyle, height: "224px" }}>
          <h1 style={{ ...titleFont, fontSize: "18px", letterSpacing: "0.1em" }}>ULOŽENÉ POLOŽKY</h1>
          {savedItems.length === 0 && (
            <p style={{ ...regularFont, fontSize: "12px", color: "#888", marginTop: "8px" }}>Váš list je prázdný</p>
          )}
        </section>

        {/* Section 2: Navigation Buttons */}
        <section style={{ ...sectionStyle, height: "44px", flexDirection: "row", gap: "24px" }}>
          <Link href="/ulozeno">
            <span style={{ 
              ...regularFont, 
              fontSize: "14px", 
              cursor: "pointer",
              color: "white",
              padding: "4px 12px",
              border: location === "/ulozeno" ? "1px solid #fff" : "none",
              borderRadius: "4px"
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
              border: location === "/kosik" ? "1px solid #fff" : "none",
              borderRadius: "4px"
            }}>
              KOŠÍK
            </span>
          </Link>
        </section>

        {/* Login CTA Section */}
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
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
                transform: translateY(-1px);
              }
            `}} />
          </section>
        )}

        {/* Section 4: How to Save */}
        <section style={{ ...sectionStyle, borderBottom: "none", height: "150px" }}>
          <h2 style={{ ...titleFont, fontSize: "14px", letterSpacing: "0.05em", marginBottom: "8px" }}>
            ULOŽTE SI VAŠE OBLÍBENÉ POLOŽKY
          </h2>
          <p style={{ ...regularFont, fontSize: "12px", color: "#888" }}>
            Klikněte na ikonu srdce a uložte si položky na tuto stránku
          </p>
        </section>

        {/* Items List (only shown if there are items) */}
        {savedItems.length > 0 && (
          <div style={{ width: "100%", margin: "0 auto", padding: "40px 0" }}>
            {beats.length > 0 && (
              <div style={{ marginBottom: "60px", width: "100%" }}>
                <h2 style={{ ...titleFont, fontSize: "14px", color: "#999", marginBottom: "32px", padding: "0 20px" }}>BEATY</h2>
                <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                  {beats.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "24px 20px",
                        borderBottom: "0.5px solid #222",
                        width: "100%",
                        gap: "20px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <button
                          onClick={() => playPreview(item)}
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            border: "1px solid #fff",
                            background: currentItem?.id === item.id && isPlaying ? "#fff" : "transparent",
                            color: currentItem?.id === item.id && isPlaying ? "#000" : "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                        >
                          {currentItem?.id === item.id && isPlaying ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}><path d="M5 3l14 9-14 9V3z"/></svg>
                          )}
                        </button>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ ...titleFont, fontSize: "16px", letterSpacing: "0.05em" }}>{item.item_data.title}</div>
                          <div style={{ ...regularFont, fontSize: "12px", color: "#666", marginTop: "4px" }}>
                            {item.item_data.artist} • {item.item_data.bpm} BPM • {item.item_data.key}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                        <span style={{ ...titleFont, fontSize: "14px" }}>{item.item_data.price} CZK</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <button
                            onClick={() => handleRemove(item)}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              padding: "8px",
                              color: "#ff4444"
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAddToCart(item)}
                            style={{
                              padding: "10px 20px",
                              background: "#fff",
                              color: "#000",
                              border: "none",
                              fontSize: "12px",
                              ...titleFont,
                              cursor: "pointer",
                              borderRadius: "4px",
                            }}
                          >
                            DO KOŠÍKU
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {soundKits.length > 0 && (
              <div style={{ width: "100%" }}>
                <h2 style={{ ...titleFont, fontSize: "14px", color: "#999", marginBottom: "32px", padding: "0 20px" }}>ZVUKOVÉ KITY</h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    width: "100%",
                  }}
                >
                  {soundKits.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "0.5px solid #222",
                        overflow: "hidden",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ width: "100%", aspectRatio: "1", background: "#111", position: "relative" }}>
                        <img
                          src={item.item_data.artwork_url || "/uploads/artwork/metallic-logo.png"}
                          alt={item.item_data.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <button
                          onClick={() => handleRemove(item)}
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
                            color: "#ff4444"
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                        </button>
                        {item.item_data.preview_url && (
                          <button
                            onClick={() => playPreview(item)}
                            style={{
                              position: "absolute",
                              bottom: "12px",
                              right: "12px",
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              border: "1px solid #fff",
                              background: currentItem?.id === item.id && isPlaying ? "#fff" : "rgba(0,0,0,0.6)",
                              color: currentItem?.id === item.id && isPlaying ? "#000" : "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                          >
                            {currentItem?.id === item.id && isPlaying ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}><path d="M5 3l14 9-14 9V3z"/></svg>
                            )}
                          </button>
                        )}
                      </div>

                      <div style={{ padding: "24px", width: "100%" }}>
                        <div style={{ ...regularFont, fontSize: "10px", color: "#666", marginBottom: "4px", textTransform: "uppercase" }}>
                          {typeLabels[item.item_data.type || ""] || item.item_data.type}
                        </div>
                        <h3 style={{ ...titleFont, fontSize: "16px", marginBottom: "8px" }}>{item.item_data.title}</h3>
                        <p style={{ ...regularFont, fontSize: "12px", color: "#888", marginBottom: "16px" }}>
                          {item.item_data.number_of_sounds} ZVUKŮ
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                          <span style={{ ...titleFont, fontSize: "14px" }}>
                            {item.item_data.is_free ? "ZDARMA" : `${item.item_data.price} CZK`}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            style={{
                              padding: "10px 20px",
                              background: "#fff",
                              color: "#000",
                              border: "none",
                              fontSize: "12px",
                              ...titleFont,
                              cursor: "pointer",
                              borderRadius: "4px",
                              width: "100%",
                            }}
                          >
                            {item.item_data.is_free ? "STÁHNOUT" : "DO KOŠÍKU"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Ulozeno;
