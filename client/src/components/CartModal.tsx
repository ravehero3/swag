import { useApp } from "../App.js";
import { useEffect, useState } from "react";

interface CartItem {
  productId: number;
  productType: string;
  title: string;
  price: number;
  artworkUrl: string;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, removeFromCart } = useApp();
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      const viewed = localStorage.getItem("voodoo808_recently_viewed");
      if (viewed) {
        setRecentlyViewed(JSON.parse(viewed));
      }
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const total = cart.reduce((sum: number, item: CartItem) => sum + Number(item.price), 0);

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 768px) {
          .cart-modal-panel { width: 100% !important; }
        }
        .recently-viewed-item:hover { opacity: 1 !important; cursor: pointer; }
      `}</style>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(13, 13, 13, 0.5)",
            zIndex: 9998,
            animation: "fadeIn 0.3s ease-out",
          }}
          onClick={onClose}
        >
          <div
            className="cart-modal-panel"
            style={{
              position: "fixed",
              top: 0, right: 0,
              height: "100vh",
              width: "min(100%, 33.333%)",
              backgroundColor: "#000",
              boxShadow: "-10px 0 40px rgba(13,13,13,0.8)",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.3s ease-out",
              zIndex: 9999,
              borderLeft: "1px solid #333",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: "#24e053",
                padding: "0 16px",
                textAlign: "center",
                borderBottom: "1px solid #333",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <h2 style={{
                fontSize: "12px",
                fontFamily: "Helvetica Neue Condensed, Helvetica, Arial, sans-serif",
                fontWeight: "bold",
                margin: 0,
                color: "#000",
                letterSpacing: "0.5px",
              }}>
                NÁKUPNÍ KOŠÍK
              </h2>
              <button
                onClick={onClose}
                style={{
                  position: "absolute", right: "12px",
                  background: "transparent", border: "none",
                  color: "#000", fontSize: "18px",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  padding: "4px", fontWeight: "bold",
                }}
                aria-label="Zavřít"
              >
                ✕
              </button>
            </div>

            {/* Cart items — scrollable */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "16px",
              }}
            >
              {cart.length === 0 ? (
                <div>
                  <p style={{ color: "#666", textAlign: "center", marginTop: "40px" }}>
                    Váš košík je prázdný
                  </p>
                  <div style={{ marginTop: "24px", textAlign: "center" }}>
                    <div style={{
                      color: "#666", fontSize: "11px", marginBottom: "12px",
                      fontFamily: "Helvetica Neue Condensed, Helvetica, Arial, sans-serif",
                    }}>
                      Soubory obdržíte na email během pár vteřin
                    </div>
                    <img
                      src="/payment-methods.jpg"
                      alt="Payment Methods"
                      style={{ maxWidth: "50%", height: "auto", opacity: 0.8 }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {cart.map((item: CartItem) => (
                    <div
                      key={`${item.productId}-${item.productType}`}
                      style={{
                        display: "flex", gap: "12px",
                        padding: "12px",
                        backgroundColor: "#111111",
                        borderRadius: "4px",
                        border: "1px solid #333",
                      }}
                    >
                      <img
                        src={item.artworkUrl}
                        alt={item.title}
                        style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "2px", flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "13px", color: "#fff", marginBottom: "8px" }}>
                          {Number(item.price).toLocaleString("cs-CZ")} CZK
                        </div>
                        <button
                          onClick={() => setItemToRemove(item)}
                          style={{
                            background: "transparent", border: "1px solid #666",
                            color: "#fff", fontSize: "11px",
                            padding: "4px 8px", borderRadius: "2px",
                            cursor: "pointer", transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#fff")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#666")}
                        >
                          Odebrat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prohlíželi jste — below cart items, above buttons */}
            <div style={{
              flexShrink: 0,
              borderTop: "1px solid #333",
              padding: "16px",
              backgroundColor: "#050505",
            }}>
              <h3 style={{ fontSize: "12px", color: "#666", marginBottom: "12px", letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 12px 0" }}>
                PROHLÍŽELI JSTE
              </h3>
              {recentlyViewed.length === 0 ? (
                <p style={{ color: "#333", fontSize: "11px" }}>Žádné nedávno zobrazené produkty</p>
              ) : (
                <div
                  className="hide-scrollbar"
                  style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}
                >
                  {recentlyViewed.map((item: any) => (
                    <div
                      key={item.id}
                      className="recently-viewed-item"
                      onClick={() => {
                        onClose();
                        const path = item.type === "beat"
                          ? `/produkt/beat/${item.id}`
                          : `/produkt/sound_kit/${item.id}`;
                        window.location.href = path;
                      }}
                      style={{
                        flex: "0 0 90px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        opacity: 0.75,
                        transition: "opacity 0.2s ease",
                      }}
                    >
                      <img
                        src={item.artworkUrl || item.images?.[0] || "/uploads/artwork/metallic-logo.png"}
                        alt={item.title || item.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/uploads/artwork/metallic-logo.png"; }}
                        style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "2px" }}
                      />
                      <div style={{ fontSize: "10px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title || item.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total — only when cart has items */}
            {cart.length > 0 && (
              <div style={{ padding: "16px", borderTop: "1px solid #333", flexShrink: 0 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: "16px", fontWeight: "bold",
                }}>
                  <span>Celkem:</span>
                  <span style={{ color: "#fff" }}>
                    {total.toLocaleString("cs-CZ")} CZK
                  </span>
                </div>
              </div>
            )}

            {/* Nav buttons — always visible */}
            <div style={{ padding: "16px", borderTop: "1px solid #333", display: "flex", gap: "16px", flexShrink: 0 }}>
              <button
                onClick={() => { onClose(); window.location.href = "/pokladna"; }}
                style={{
                  flex: 1, padding: "8px",
                  backgroundColor: "#fff", color: "#000",
                  border: "none", borderRadius: "4px",
                  fontSize: "12px",
                  fontFamily: "BB-Regular, Helvetica, Arial, sans-serif",
                  fontWeight: "normal", cursor: "pointer",
                  transition: "all 0.3s ease", textTransform: "uppercase",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.8)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                PŘEJÍT K POKLADNĚ ({cart.length})
              </button>
              <button
                onClick={() => { onClose(); window.location.href = "/kosik"; }}
                style={{
                  flex: 1, padding: "8px",
                  backgroundColor: "#000", color: "#fff",
                  border: "1px solid #333", borderRadius: "4px",
                  fontSize: "12px",
                  fontFamily: "BB-Regular, Helvetica, Arial, sans-serif",
                  fontWeight: "normal", cursor: "pointer",
                  transition: "all 0.3s ease", textTransform: "uppercase",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#666")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
              >
                ZOBRAZIT KOŠÍK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirmation dialog */}
      {itemToRemove && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(13,13,13,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 10000, animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setItemToRemove(null)}
        >
          <div
            style={{
              backgroundColor: "#161616", padding: "32px",
              borderRadius: "8px", maxWidth: "400px",
              width: "90%", border: "1px solid #333", textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "#fff", fontSize: "18px", marginBottom: "16px", fontWeight: "bold" }}>
              Odstranit položku z košíku
            </h3>
            <p style={{ color: "#999", fontSize: "14px", marginBottom: "32px", lineHeight: "1.5" }}>
              Opravdu chcete odstranit "{itemToRemove.title}" z košíku?
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setItemToRemove(null)}
                style={{
                  flex: 1, padding: "16px",
                  backgroundColor: "#000", color: "#fff",
                  border: "1px solid #333", borderRadius: "4px",
                  fontSize: "14px", fontWeight: "bold",
                  cursor: "pointer", transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#666")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
              >
                Zrušit
              </button>
              <button
                onClick={() => {
                  removeFromCart(itemToRemove.productId, itemToRemove.productType);
                  setItemToRemove(null);
                }}
                style={{
                  flex: 1, padding: "16px",
                  backgroundColor: "#fff", color: "#000",
                  border: "none", borderRadius: "4px",
                  fontSize: "14px", fontWeight: "bold",
                  cursor: "pointer", transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e0e0e0")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
              >
                Ano
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CartModal;
