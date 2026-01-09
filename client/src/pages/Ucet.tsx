import { useState, useEffect } from "react";
import { useApp } from "../App.js";
import { useLocation, Link } from "wouter";

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
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/prihlasit-se");
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersRes, savedRes] = await Promise.all([
          fetch("/api/orders", { credentials: "include" }),
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
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "48px" }}>
        <div style={{ padding: "24px", background: "#0a0a0a", border: "1px solid #333", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "#999", fontWeight: "400" }}>Osobní údaje</h2>
          <p style={{ color: "#fff", margin: "0 0 8px 0" }}>Email: {user?.email}</p>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>ID uživatele: #{user?.id}</p>
        </div>

        <div style={{ padding: "24px", background: "#0a0a0a", border: "1px solid #333", borderRadius: "8px" }}>
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
              {savedItems.slice(0, 4).map((item) => (
                <div key={`${item.item_type}-${item.item_id}`} style={{ padding: "16px", background: "#0a0a0a", border: "1px solid #333", borderRadius: "8px" }}>
                  <img 
                    src={item.item_data?.artwork_url || "/uploads/artwork/white-cover.png"} 
                    alt={item.item_data?.title || "Product"} 
                    style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: "4px", marginBottom: "12px" }} 
                  />
                  <h3 style={{ fontSize: "14px", color: "#fff", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.item_data?.title}</h3>
                  <p style={{ fontSize: "12px", color: "#666", margin: 0, textTransform: "capitalize" }}>{item.item_type === 'beat' ? 'Beat' : 'Sound Kit'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
