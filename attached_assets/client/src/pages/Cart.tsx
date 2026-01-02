import { useApp } from "../App";
import { Link, useLocation } from "wouter";

function Cart() {
  const { cart, removeFromCart, user } = useApp();
  const [location] = useLocation();
  const total = cart.reduce((sum, item) => sum + item.price, 0);

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

  return (
    <div className="min-h-screen bg-black text-white fade-in overflow-x-hidden relative flex flex-col" style={{ minHeight: 'calc(100vh - 42px)' }}>
      {/* Vertical lines effect */}
      <div className="hidden md:block" style={{
        position: 'absolute',
        left: 'calc(50vw - 350px)',
        top: 0,
        bottom: 0,
        width: '0.5px',
        backgroundColor: '#333',
        zIndex: 5,
        pointerEvents: 'none'
      }} />
      <div className="hidden md:block" style={{
        position: 'absolute',
        right: 'calc(50vw - 350px)',
        top: 0,
        bottom: 0,
        width: '0.5px',
        backgroundColor: '#333',
        zIndex: 5,
        pointerEvents: 'none'
      }} />

      <div style={{ flex: 1 }}>
        {/* Section 1: Title */}
        <section style={{ ...sectionStyle, height: "224px" }}>
          <h1 style={{ ...titleFont, fontSize: "18px", letterSpacing: "0.1em" }}>KOŠÍK</h1>
          {cart.length === 0 && (
            <p style={{ ...regularFont, fontSize: "12px", color: "#888", marginTop: "8px" }}>Váš košík je prázdný</p>
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
              border: location === "/ulozeno" ? "0.5px solid #333" : "none",
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
              border: location === "/kosik" ? "0.5px solid #333" : "none",
              borderRadius: "4px"
            }}>
              KOŠÍK
            </span>
          </Link>
        </section>

        {/* Section 3: Cart Content / Summary */}
        {cart.length > 0 ? (
          <>
            <section style={{ ...sectionStyle, minHeight: "224px", padding: "40px 20px" }}>
              <div style={{ width: "100%", maxWidth: "500px" }}>
                {cart.map((item) => (
                  <div
                    key={`${item.productType}-${item.productId}`}
                    className="cart-item-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "16px 0",
                      borderBottom: "0.5px solid #333",
                      gap: "16px",
                    }}
                  >
                    <img
                      src={item.artworkUrl}
                      alt={item.title}
                      style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px", border: "0.5px solid #333" }}
                    />
                    <div className="cart-item-info" style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ ...titleFont, fontSize: "14px" }}>{item.title}</div>
                      <div style={{ ...regularFont, fontSize: "12px", color: "#666" }}>
                        {item.productType === "beat" ? "Beat" : "Sound Kit"}
                      </div>
                    </div>
                    <div style={{ ...titleFont, fontSize: "14px", whiteSpace: "nowrap" }}>{item.price} CZK</div>
                    <button
                      onClick={() => removeFromCart(item.productId, item.productType)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ff4444",
                        fontSize: "18px",
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <style dangerouslySetInnerHTML={{ __html: `
                  @media (max-width: 600px) {
                    .cart-item-row {
                      flex-direction: column !important;
                      text-align: center !important;
                      gap: 12px !important;
                      padding: 24px 0 !important;
                    }
                    .cart-item-info {
                      text-align: center !important;
                    }
                  }
                `}} />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "24px 0",
                    marginTop: "8px",
                  }}
                >
                  <span style={{ ...titleFont, fontSize: "16px" }}>CELKEM</span>
                  <span style={{ ...titleFont, fontSize: "20px" }}>{total} CZK</span>
                </div>

                <Link href="/checkout">
                  <button 
                    className="login-glow-button"
                    style={{ 
                      width: "100%", 
                      backgroundColor: "white",
                      color: "black",
                      padding: "12px 24px",
                      borderRadius: "4px",
                      fontSize: "14px",
                      ...titleFont,
                      cursor: "pointer",
                      border: "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    POKRAČOVAT K PLATBĚ
                  </button>
                </Link>
                <style dangerouslySetInnerHTML={{ __html: `
                  .login-glow-button:hover {
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
                    transform: translateY(-1px);
                  }
                `}} />
              </div>
            </section>
          </>
        ) : (
          <section style={{ ...sectionStyle, height: "224px" }}>
            <h2 style={{ ...titleFont, fontSize: "14px", letterSpacing: "0.05em", marginBottom: "8px" }}>
              VÁŠ KOŠÍK JE PRÁZDNÝ
            </h2>
            <p style={{ ...regularFont, fontSize: "12px", color: "#aaa", maxWidth: "400px" }}>
              Prozkoumejte naše beaty a zvukové kity a vyberte si to pravé pro vaši produkci.
            </p>
            <div style={{ height: "16px" }} />
            <Link href="/">
              <span style={{
                backgroundColor: "white",
                color: "black",
                padding: "10px 24px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
                display: "inline-block"
              }}>
                PROCHÁZET OBCHOD
              </span>
            </Link>
          </section>
        )}

        {/* Section 4: Info / Footer-like */}
        <section style={{ ...sectionStyle, borderBottom: "none", height: "150px" }}>
          <h2 style={{ ...titleFont, fontSize: "14px", letterSpacing: "0.05em", marginBottom: "8px" }}>
            BEZPEČNÝ NÁKUP
          </h2>
          <p style={{ ...regularFont, fontSize: "12px", color: "#888" }}>
            Všechny platby jsou šifrovány a vaše soubory budou doručeny okamžitě po zaplacení.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Cart;
