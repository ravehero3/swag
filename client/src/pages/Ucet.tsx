import { useState, useEffect, useRef } from "react";
import { useApp } from "../App.js";
import { useLocation, Link } from "wouter";

interface OrderItem {
  productId: number;
  title: string;
  price: number;
  productType: string;
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function Ucet() {
  const { user } = useApp() as any;
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) {
      setLocation("/prihlasit-se");
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersRes, savedRes] = await Promise.all([
          fetch("/api/orders/my", { credentials: "include" }),
          fetch("/api/saved", { credentials: "include" })
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }

        if (savedRes.ok) {
          const savedData = await savedRes.json();
          setSavedItems(savedData);
        }
      } catch (err) {
        console.error("Error fetching account data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, setLocation]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSavedItemClick = (item: any) => {
    const previewUrl = item.item_data?.preview_url;
    if (!previewUrl) return;

    const itemId = item.item_id;

    if (playingId === itemId) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audio.volume = 0.8;
    audioRef.current = audio;

    audio.play().then(() => {
      setPlayingId(itemId);
      setIsPlaying(true);
    }).catch(() => {});

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setPlayingId(null);
    });
  };

  const handlePayOrder = async (orderId: number) => {
    setPayingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.gw_url) {
        window.location.href = data.gw_url;
      } else {
        alert(data.error || "Nepodařilo se zahájit platbu.");
      }
    } catch {
      alert("Chyba při připojování k platební bráně.");
    } finally {
      setPayingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: "#666" }}>
        Načítání...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: "1000px", margin: "0 auto", padding: "100px 20px 120px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .ucet-order-card {
          padding: 24px;
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          cursor: default;
        }
        .ucet-order-card:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 32px rgba(13,13,13,0.5);
          border-color: #555;
        }
        .ucet-saved-item {
          position: relative;
          transition: transform 0.2s ease;
          cursor: pointer;
        }
        .ucet-saved-item:hover {
          transform: scale(1.02);
        }
        .ucet-saved-item:hover .ucet-play-overlay {
          opacity: 1;
        }
        .ucet-play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 4px;
          background: rgba(13,13,13,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .ucet-saved-item.is-playing .ucet-play-overlay {
          opacity: 1;
        }
        .ucet-pay-btn {
          background: #24e053;
          color: #000;
          border: none;
          padding: 8px 20px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          letter-spacing: 0.5px;
          transition: opacity 0.2s ease, transform 0.15s ease;
          white-space: nowrap;
        }
        .ucet-pay-btn:hover {
          opacity: 0.85;
          transform: scale(1.03);
        }
        .ucet-pay-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}} />

      <h1 style={{ fontSize: "32px", marginBottom: "32px", fontWeight: "400" }}>Můj účet</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "48px" }}>
        <div style={{ padding: "24px", background: "#111111", border: "1px solid #333", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "#999", fontWeight: "400" }}>Osobní údaje</h2>
          <p style={{ color: "#fff", margin: "0 0 8px 0" }}>Email: {user?.email}</p>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>ID uživatele: #{user?.id}</p>
        </div>

        <div style={{ padding: "24px", background: "#111111", border: "1px solid #333", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "#999", fontWeight: "400" }}>Statistiky</h2>
          <p style={{ color: "#fff", margin: "0 0 8px 0" }}>Objednávky: {orders.length}</p>
          <p style={{ color: "#fff", margin: 0 }}>Uložené položky: {savedItems.length}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "48px" }}>
        <section>
          <h2 style={{ fontSize: "24px", marginBottom: "24px", fontWeight: "400" }}>Moje objednávky</h2>
          {orders.length === 0 ? (
            <p style={{ color: "#666" }}>Zatím nemáte žádné objednávky.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {orders.map((order) => {
                const isPaid = order.status === "completed" || order.status === "paid";
                const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
                return (
                  <div key={order.id} className="ucet-order-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "16px" }}>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>ČÍSLO OBJEDNÁVKY</p>
                        <p style={{ color: "#fff", fontSize: "16px", margin: 0 }}>#{order.id}</p>
                      </div>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>DATUM</p>
                        <p style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{new Date(order.created_at).toLocaleDateString("cs-CZ")}</p>
                      </div>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>STAV</p>
                        <p style={{ 
                          color: isPaid ? "#24e053" : "#facc15", 
                          fontSize: "14px", 
                          margin: 0,
                          textTransform: "uppercase",
                          letterSpacing: "1px"
                        }}>
                          {isPaid ? "Dokončeno" : "Čeká na platbu"}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>CELKEM</p>
                        <p style={{ color: "#fff", fontSize: "16px", margin: 0, fontWeight: "500" }}>{Number(order.total).toFixed(0)} CZK</p>
                      </div>
                      {!isPaid && (
                        <div style={{ display: "flex", alignItems: "flex-end" }}>
                          <button
                            className="ucet-pay-btn"
                            disabled={payingOrderId === order.id}
                            onClick={() => handlePayOrder(order.id)}
                            data-testid={`button-pay-order-${order.id}`}
                          >
                            {payingOrderId === order.id ? "Přesměrování..." : "Zaplatit přes GoPay"}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ borderTop: "1px solid #222", paddingTop: "16px" }}>
                      <p style={{ color: "#666", fontSize: "12px", marginBottom: "12px" }}>POLOŽKY</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {items.length === 0 ? (
                          <p style={{ color: "#555", fontSize: "14px", margin: 0 }}>—</p>
                        ) : items.map((item, idx) => (
                          <div key={`${item.productId ?? idx}-${idx}`} style={{ display: "flex", justifyContent: "space-between", color: "#ccc", fontSize: "14px" }}>
                            <span>{item.title || "—"}</span>
                            <span>{item.price} CZK</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", margin: 0, fontWeight: "400" }}>Uložené produkty</h2>
            <Link href="/ulozeno" style={{ color: "#24e053", fontSize: "14px", textDecoration: "none" }}>Zobrazit vše</Link>
          </div>
          {savedItems.length === 0 ? (
            <p style={{ color: "#666" }}>Nemáte žádné uložené produkty.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
              {savedItems.slice(0, 4).map((item) => {
                const hasAudio = !!item.item_data?.preview_url && item.item_type === "beat";
                const itemPlaying = playingId === item.item_id && isPlaying;
                return (
                  <div
                    key={`${item.item_type}-${item.item_id}`}
                    className={`ucet-saved-item${itemPlaying ? " is-playing" : ""}`}
                    onClick={() => hasAudio && handleSavedItemClick(item)}
                    style={{ padding: "16px", background: "#111111", border: "1px solid #333", borderRadius: "8px" }}
                    data-testid={`card-saved-${item.item_type}-${item.item_id}`}
                  >
                    <div style={{ position: "relative", marginBottom: "12px" }}>
                      <img 
                        src={item.item_data?.artwork_url || "/uploads/artwork/metallic-logo.png"}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                        alt={item.item_data?.title || "Product"} 
                        style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "4px", display: "block" }} 
                      />
                      {hasAudio && (
                        <div className="ucet-play-overlay">
                          {itemPlaying ? (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.95)">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    <h3 style={{ fontSize: "14px", color: "#fff", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.item_data?.title}</h3>
                    <p style={{ fontSize: "12px", color: "#666", margin: 0, textTransform: "capitalize" }}>{item.item_type === 'beat' ? 'Beat' : 'Sound Kit'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
