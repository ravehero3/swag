import { useState, useEffect, useRef } from "react";
import { useApp } from "../App";

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

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then(setSavedItems)
        .catch(console.error);
    } else {
      // Load saved items from localStorage for non-logged-in users
      const savedBeatsJson = localStorage.getItem("voodoo808_saved_beats");
      const savedKitsJson = localStorage.getItem("voodoo808_saved_kits");
      
      const savedBeats = savedBeatsJson ? JSON.parse(savedBeatsJson) : [];
      const savedKits = savedKitsJson ? JSON.parse(savedKitsJson) : [];
      
      // Combine and format for display
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
      // Remove from localStorage for non-logged-in users
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
  const isTemporary = !user;

  return (
    <div className="fade-in">
      <audio
        ref={audioRef}
        src={currentItem?.item_data.preview_url}
        onEnded={() => setIsPlaying(false)}
      />

      {savedItems.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "16px", textAlign: "center" }}>Uložené položky</h1>
          {isTemporary && (
            <p style={{ textAlign: "center", fontSize: "12px", color: "#888", marginBottom: "24px" }}>
              (Dočasné uložení - přihlaste se pro trvalé uložení)
            </p>
          )}
          <p style={{ textAlign: "center", color: "#666" }}>
            Zatím nemáte žádné uložené položky
          </p>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: "24px", marginBottom: "16px", textAlign: "center" }}>Uložené položky</h1>
          {isTemporary && (
            <p style={{ textAlign: "center", fontSize: "12px", color: "#888", marginBottom: "24px" }}>
              (Dočasné uložení - přihlaste se pro trvalé uložení)
            </p>
          )}
          {beats.length > 0 && (
            <div style={{ marginBottom: "48px" }}>
              <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "#999" }}>Beaty</h2>
              {beats.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #222",
                    gap: "16px",
                  }}
                >
                  <button
                    onClick={() => playPreview(item)}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid #fff",
                      background: currentItem?.id === item.id && isPlaying ? "#fff" : "transparent",
                      color: currentItem?.id === item.id && isPlaying ? "#000" : "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {currentItem?.id === item.id && isPlaying ? "⏸" : "▶"}
                  </button>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold" }}>{item.item_data.title}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {item.item_data.artist} • {item.item_data.bpm} BPM • {item.item_data.key}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontWeight: "bold" }}>{item.item_data.price} CZK</span>
                    <button
                      onClick={() => handleRemove(item)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "8px",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff4444" stroke="#ff4444" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="btn-bounce"
                      style={{
                        padding: "8px 8px 8px 16px",
                        background: "#fff",
                        color: "#000",
                        border: "none",
                        fontSize: "12px",
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                        fontWeight: 400,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        borderRadius: "4px",
                        position: "relative",
                        minWidth: "120px",
                        height: "32px",
                      }}
                    >
                      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginLeft: "-8px" }}>
                          <rect x="3" y="6" width="18" height="15" rx="2" />
                          <path d="M8 6V4a4 4 0 0 1 8 0v2" />
                        </svg>
                        <span style={{ position: "absolute", fontSize: "16px", fontWeight: "400", color: "#000", lineHeight: "1", right: "-10px", top: "-5px" }}>+</span>
                      </div>
                      <span style={{ marginLeft: "auto", fontWeight: 500, paddingRight: "8px" }}>DO KOŠÍKU</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {soundKits.length > 0 && (
            <div>
              <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "#999" }}>Zvukové kity</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px",
                }}
              >
                {soundKits.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #333",
                      overflow: "hidden",
                      position: "relative",
                      borderRadius: "4px",
                    }}
                  >
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
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff4444" stroke="#ff4444" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    <div style={{ aspectRatio: "1", background: "#000", position: "relative" }}>
                      <img
                        src={item.item_data.artwork_url || "/uploads/artwork/metallic-logo.png"}
                        alt={item.item_data.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px 4px 0 0" }}
                      />
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
                            background: currentItem?.id === item.id && isPlaying ? "#fff" : "rgba(0,0,0,0.8)",
                            color: currentItem?.id === item.id && isPlaying ? "#000" : "#fff",
                            fontSize: "18px",
                          }}
                        >
                          {currentItem?.id === item.id && isPlaying ? "⏸" : "▶"}
                        </button>
                      )}
                    </div>

                    <div style={{ padding: "16px" }}>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                        {typeLabels[item.item_data.type || ""] || item.item_data.type}
                      </div>
                      <h3 style={{ marginBottom: "8px" }}>{item.item_data.title}</h3>
                      <p style={{ fontSize: "14px", color: "#999", marginBottom: "12px" }}>
                        {item.item_data.number_of_sounds} zvuků
                      </p>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold" }}>
                          {item.item_data.is_free ? "ZDARMA" : `${item.item_data.price} CZK`}
                        </span>
                        <button className="btn btn-bounce" onClick={() => handleAddToCart(item)} style={{ borderRadius: "4px" }}>
                          {item.item_data.is_free ? "STÁHNOUT" : "DO KOŠÍKU"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Ulozeno;
