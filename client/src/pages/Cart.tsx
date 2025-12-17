import { useApp } from "../App";
import { Link } from "wouter";

function Cart() {
  const { cart, removeFromCart } = useApp();
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fade-in" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "24px", textAlign: "center" }}>Košík</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#666", marginBottom: "24px" }}>Váš košík je prázdný</p>
          <Link href="/beaty">
            <button className="btn btn-bounce" style={{ borderRadius: "4px" }}>Prohlédnout beaty</button>
          </Link>
        </div>
      ) : (
        <>
          {cart.map((item) => (
            <div
              key={`${item.productType}-${item.productId}`}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 0",
                borderBottom: "1px solid #333",
                gap: "16px",
              }}
            >
              <img
                src={item.artworkUrl}
                alt={item.title}
                style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "4px" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>{item.title}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {item.productType === "beat" ? "Beat" : "Sound Kit"}
                </div>
              </div>
              <div style={{ fontWeight: "bold" }}>{item.price} CZK</div>
              <button
                onClick={() => removeFromCart(item.productId, item.productType)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff4444",
                  fontSize: "18px",
                  cursor: "pointer",
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
              borderTop: "1px solid #fff",
              marginTop: "16px",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>Celkem</span>
            <span style={{ fontSize: "24px", fontWeight: "bold" }}>{total} CZK</span>
          </div>

          <Link href="/checkout">
            <button className="btn btn-filled btn-bounce" style={{ width: "100%", borderRadius: "4px" }}>
              Pokračovat k platbě
            </button>
          </Link>
        </>
      )}
    </div>
  );
}

export default Cart;
