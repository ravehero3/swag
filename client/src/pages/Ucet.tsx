import { useState, useEffect } from "react";
import { useApp } from "../App.js";
import { useLocation } from "wouter";

interface OrderItem {
  id: number;
  product_title: string;
  price: number;
  product_type: string;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function Ucet() {
  const { user } = useApp() as any;
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/prihlasit-se");
      return;
    }

    fetch("/api/orders", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        setLoading(false);
      });
  }, [user, setLocation]);

  if (loading) {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: "#666" }}>
        Načítání...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: "1000px", margin: "0 auto", padding: "100px 20px" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "32px", fontWeight: "400" }}>Můj účet</h1>
      
      <div style={{ marginBottom: "48px", padding: "24px", background: "#0a0a0a", border: "1px solid #333", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "#999", fontWeight: "400" }}>Osobní údaje</h2>
        <p style={{ color: "#fff", margin: 0 }}>Email: {user?.email}</p>
      </div>

      <h2 style={{ fontSize: "24px", marginBottom: "24px", fontWeight: "400" }}>Moje objednávky</h2>
      
      {orders.length === 0 ? (
        <p style={{ color: "#666" }}>Zatím nemáte žádné objednávky.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {orders.map((order) => (
            <div key={order.id} style={{ padding: "24px", background: "#0a0a0a", border: "1px solid #333", borderRadius: "8px" }}>
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
                    color: order.status === "completed" ? "#24e053" : "#facc15", 
                    fontSize: "14px", 
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "1px"
                  }}>
                    {order.status === "completed" ? "Dokončeno" : "Čeká na vyřízení / Nezaplaceno"}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#666", fontSize: "12px", margin: "0 0 4px 0" }}>CELKEM</p>
                  <p style={{ color: "#fff", fontSize: "16px", margin: 0, fontWeight: "500" }}>{order.total_amount} CZK</p>
                </div>
              </div>
              
              <div style={{ borderTop: "1px solid #222", paddingTop: "16px" }}>
                <p style={{ color: "#666", fontSize: "12px", marginBottom: "12px" }}>POLOŽKY</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {order.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", color: "#ccc", fontSize: "14px" }}>
                      <span>{item.product_title}</span>
                      <span>{item.price} CZK</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
