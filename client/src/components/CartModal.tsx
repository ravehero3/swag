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
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore scrolling when modal is closed
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9998,
            animation: "fadeIn 0.3s ease-out",
          }}
          onClick={onClose}
        >
          <div
            className="cart-modal-panel"
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: "min(100%, 33.333%)",
              backgroundColor: "#000",
              boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.8)",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.3s ease-out",
              zIndex: 9999,
              borderLeft: "1px solid #333",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @media (max-width: 768px) {
                .cart-modal-panel {
                  width: 100% !important;
                }
              }
            `}</style>
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
              }}
            >
              <h2
                style={{
                  fontSize: "12px",
                  fontFamily: "Helvetica Neue Condensed, Helvetica, Arial, sans-serif",
                  fontWeight: "bold",
                  margin: 0,
                  color: "#000",
                  letterSpacing: "0.5px",
                }}
              >
                NÁKUPNÍ KOŠÍK
              </h2>
              <button
                onClick={onClose}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  color: "#000",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  fontWeight: "bold",
                }}
                aria-label="Zavřít"
              >
                ✕
              </button>
            </div>

            {/* Horizontal lines */}
            <div style={{
              position: 'absolute',
              top: '242px', // 42px header + 200px
              left: 0,
              right: 0,
              height: '0.5px',
              backgroundColor: '#333',
              zIndex: 10,
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: '702px', // 602px + 100px
              left: 0,
              right: 0,
              height: '0.5px',
              backgroundColor: '#333',
              zIndex: 10,
              pointerEvents: 'none'
            }} />

            {/* Middle Section: Recently Viewed */}
            <div
              style={{
                position: 'absolute',
                top: '242px',
                left: 0,
                right: 0,
                height: '460px',
                padding: '20px',
                borderBottom: '0.5px solid #333',
                backgroundColor: '#050505',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <h3 style={{ fontSize: '12px', color: '#666', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                PROHLÍŽELI JSTE
              </h3>
              {recentlyViewed.length === 0 ? (
                <p style={{ color: '#333', fontSize: '11px', textAlign: 'center', marginTop: '40px' }}>Žádné nedávno zobrazené produkty</p>
              ) : (
                <div 
                  className="hide-scrollbar"
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    overflowX: 'auto',
                    paddingBottom: '10px',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <style>{`
                    .hide-scrollbar::-webkit-scrollbar {
                      display: none;
                    }
                    .hide-scrollbar {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}</style>
                  {recentlyViewed.map((item: any) => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '4px',
                        flex: '0 0 140px'
                      }}
                    >
                      <img 
                        src={item.artworkUrl || item.images?.[0]} 
                        alt={item.title || item.name} 
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '2px', opacity: 0.8 }} 
                      />
                      <div style={{ fontSize: '11px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title || item.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '712px', // 612px + 100px
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0 16px',
                zIndex: 10,
                pointerEvents: 'none'
              }}>
                <div style={{
                  color: '#666',
                  fontSize: '11px',
                  marginBottom: '8px',
                  fontFamily: 'Helvetica Neue Condensed, Helvetica, Arial, sans-serif'
                }}>
                  Soubory obdržíte na email během pár vteřin
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src="/payment-methods.jpg" 
                    alt="Payment Methods" 
                    style={{ 
                      maxWidth: '50%', 
                      height: 'auto',
                      opacity: 0.8
                    }} 
                  />
                </div>
              </div>
            )}

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
              }}
            >
              {cart.length === 0 ? (
                <p style={{ color: "#666", textAlign: "center", marginTop: "40px" }}>
                  Váš košík je prázdný
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {cart.map((item: CartItem) => (
                    <div
                      key={`${item.productId}-${item.productType}`}
                      style={{
                        display: "flex",
                        gap: "12px",
                        padding: "12px",
                        backgroundColor: "#0a0a0a",
                        borderRadius: "4px",
                        border: "1px solid #333",
                      }}
                    >
                      <img
                        src={item.artworkUrl}
                        alt={item.title}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "2px",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "13px", color: "#fff", marginBottom: "8px" }}>
                          {item.price} CZK
                        </div>
                        <button
                          onClick={() => setItemToRemove(item)}
                          style={{
                            background: "transparent",
                            border: "1px solid #666",
                            color: "#fff",
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "2px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            overflow: "hidden",
                            position: "relative",
                          }}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.borderColor = "#fff";
                            btn.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget as HTMLButtonElement;
                            btn.style.borderColor = "#666";
                            btn.style.color = "#fff";
                          }}
                        >
                          Odebrat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: "16px", borderTop: "1px solid #333" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  <span>Celkem:</span>
                  <span style={{ color: "#fff" }}>
                    {cart.reduce((sum: number, item: CartItem) => sum + item.price, 0)} CZK
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = "/pokladna";
                  }}
                  className="login-glow-button"
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginBottom: "8px",
                    transition: "all 0.3s ease",
                  }}
                >
                  Pokračovat na platbu
                </button>
                <style dangerouslySetInnerHTML={{ __html: `
                  .login-glow-button:hover {
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
                    transform: translateY(-1px);
                  }
                `}} />
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                padding: "12px",
                backgroundColor: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: "12px",
                borderTop: "1px solid #333",
                transition: "all 0.15s ease",
                overflow: "hidden",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.backgroundColor = "#fff";
                btn.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.backgroundColor = "transparent";
                btn.style.color = "#fff";
              }}
            >
              Zavřít
            </button>
          </div>
        </div>
      )}

      {itemToRemove && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setItemToRemove(null)}
        >
          <div
            style={{
              backgroundColor: "#111",
              padding: "32px",
              borderRadius: "8px",
              maxWidth: "400px",
              width: "90%",
              border: "1px solid #333",
              textAlign: "center",
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
                  flex: 1,
                  padding: "16px",
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
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
                  flex: 1,
                  padding: "16px",
                  backgroundColor: "#fff",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
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
