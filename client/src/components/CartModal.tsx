import { useApp } from "../App";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, removeFromCart, clearCart } = useApp();

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            animation: "fadeIn 0.3s ease-out",
          }}
          onClick={onClose}
        >
          <style>{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
              }
              to {
                transform: translateX(0);
              }
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}</style>
          <div
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              width: "400px",
              backgroundColor: "#111",
              boxShadow: "-2px 0 20px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              animation: "slideIn 0.4s ease-out",
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                backgroundColor: "#24e053",
                padding: "16px",
                textAlign: "center",
                borderBottom: "1px solid #333",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontFamily: "Helvetica Neue Condensed, Helvetica, Arial, sans-serif",
                  fontWeight: "bold",
                  margin: 0,
                  color: "#000",
                  letterSpacing: "0.5px",
                }}
              >
                NÁKUPNÍ KOŠÍK
              </h2>
            </div>

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
                  {cart.map((item) => (
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
                        <div style={{ fontSize: "13px", color: "#24e053", marginBottom: "8px" }}>
                          {item.price} CZK
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId, item.productType)}
                          style={{
                            background: "transparent",
                            border: "1px solid #666",
                            color: "#fff",
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "2px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "#24e053";
                            (e.currentTarget as HTMLButtonElement).style.color = "#24e053";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "#666";
                            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
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
                  <span style={{ color: "#24e053" }}>
                    {cart.reduce((sum, item) => sum + item.price, 0)} CZK
                  </span>
                </div>
                <button
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#24e053",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginBottom: "8px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1fa03f";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#24e053";
                  }}
                >
                  Pokračovat na platbu
                </button>
                <button
                  onClick={() => clearCart()}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "transparent",
                    color: "#fff",
                    border: "1px solid #666",
                    borderRadius: "4px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#24e053";
                    (e.currentTarget as HTMLButtonElement).style.color = "#24e053";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#666";
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  }}
                >
                  Vymazat košík
                </button>
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
              }}
            >
              Zavřít
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CartModal;
