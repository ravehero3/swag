import { useState } from "react";
import { useApp } from "../App";
import { useLocation } from "wouter";

function Checkout() {
  const { cart, user, clearCart } = useApp();
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [, navigate] = useLocation();

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const items = cart.map((item) => ({
        productId: item.productId,
        productType: item.productType,
        title: item.title,
        price: item.price,
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, items, total }),
      });

      if (!res.ok) {
        throw new Error("Chyba při vytváření objednávky");
      }

      clearCart();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fade-in" style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center", padding: "40px" }}>
        <h1 style={{ marginBottom: "24px" }}>Objednávka vytvořena!</h1>
        <p style={{ color: "#666", marginBottom: "24px" }}>
          Děkujeme za vaši objednávku. Na email {email} vám zašleme pokyny k platbě a po jejím přijetí odkaz ke stažení.
        </p>
        <button className="btn" onClick={() => navigate("/")}>
          Zpět na hlavní stránku
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="fade-in" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#666" }}>Váš košík je prázdný</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "24px" }}>Dokončení objednávky</h1>

      <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #333" }}>
        <h3 style={{ marginBottom: "12px" }}>Shrnutí objednávky</h3>
        {cart.map((item) => (
          <div
            key={`${item.productType}-${item.productId}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #222",
            }}
          >
            <span>{item.title}</span>
            <span>{item.price} CZK</span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            fontWeight: "bold",
          }}
        >
          <span>Celkem</span>
          <span>{total} CZK</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #ff4444" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            Email pro doručení
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="vas@email.cz"
            style={{ width: "100%" }}
          />
          <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
            Na tento email vám zašleme odkaz ke stažení po zaplacení
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-filled"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Zpracování..." : `Zaplatit ${total} CZK`}
        </button>
      </form>
    </div>
  );
}

export default Checkout;
