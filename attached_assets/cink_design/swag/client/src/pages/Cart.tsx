import { useApp } from "../App";
import { Link } from "wouter";

function Cart() {
  const { cart, removeFromCart } = useApp();
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h1 style={{ marginBottom: "24px", fontSize: "16px", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontWeight: "900", letterSpacing: "-0.5px" }}>KOŠÍK</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          <p style={{ color: "#666", marginBottom: "24px" }}>Váš košík je prázdný</p>
          <Link href="/beaty">
            <button className="btn">Prohlédnout beaty</button>
          </Link>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {cart.map((item) => (
            <div
              key={`${item.productType}-${item.productId}`}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 0",
                borderBottom: "1px solid #333",
                gap: "12px",
              }}
            >
              <img
                src={item.artworkUrl}
                alt={item.title}
                style={{ width: "50px", height: "50px", objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "bold", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  {item.productType === "beat" ? "Beat" : "Sound Kit"}
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.productId, item.productType)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff4444",
                  fontSize: "18px",
                  cursor: "pointer",
                  padding: "0 8px",
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "24px 0",
              borderTop: "1px solid #444",
              marginTop: "16px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: "bold" }}>Celkem</span>
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>{total} CZK</span>
          </div>

          <Link href="/checkout">
            <button className="btn btn-filled" style={{ width: "100%", marginTop: "16px", fontSize: "13px" }}>
              Pokračovat k platbě
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default Cart;
