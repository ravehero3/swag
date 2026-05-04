import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

type Status = "loading" | "paid" | "pending" | "failed" | "cancelled";

function CheckIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" stroke="#24e053" strokeWidth="2" />
      <path d="M17 28.5L24 35.5L39 20.5" stroke="#24e053" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" stroke="#f5b150" strokeWidth="2" />
      <path d="M28 17V28L35 33" stroke="#f5b150" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="27" stroke="#ef4444" strokeWidth="2" />
      <path d="M20 20L36 36M36 20L20 36" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: "spin 1s linear infinite" }}>
      <circle cx="28" cy="28" r="27" stroke="#333" strokeWidth="2" />
      <path d="M28 1C42.912 1 55 13.088 55 28" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

export default function PaymentStatus() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [order, setOrder] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId");

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      return;
    }

    const check = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { credentials: "include" });
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        setOrder(data);

        if (data.status === "completed" || data.status === "paid") {
          setStatus("paid");
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (data.status === "cancelled") {
          setStatus("cancelled");
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          setStatus("pending");
          setPollCount(c => c + 1);
        }
      } catch {
        setStatus("failed");
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    check();
    intervalRef.current = setInterval(() => {
      setPollCount(c => {
        if (c >= 15) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return c;
        }
        check();
        return c;
      });
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId]);

  const containerStyle: React.CSSProperties = {
    minHeight: "calc(100vh - 42px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    background: "#000",
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid #1a1a1a",
    margin: "28px 0",
  };

  if (status === "loading") {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ marginBottom: "24px" }}><Spinner /></div>
          <h2 style={{ fontSize: "22px", marginBottom: "10px", fontWeight: 600 }}>Ověřujeme platbu…</h2>
          <p style={{ color: "#555", fontSize: "14px", lineHeight: 1.6 }}>
            Prosím vyčkejte, načítáme stav vaší objednávky.
          </p>
        </div>
      </div>
    );
  }

  if (status === "paid") {
    const items: any[] = Array.isArray(order?.items) ? order.items : [];
    return (
      <div style={containerStyle} className="fade-in">
        <div style={cardStyle}>
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}><CheckIcon /></div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.02em" }}>
            Platba proběhla úspěšně
          </h1>
          <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.6, marginBottom: "4px" }}>
            Objednávka <strong style={{ color: "#fff" }}>#{order?.id}</strong>
          </p>
          <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.6 }}>
            Na váš email jsme odeslali odkaz ke stažení a licenční smlouvu.
          </p>

          {items.length > 0 && (
            <>
              <div style={dividerStyle} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Zakoupené položky
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {items.map((item: any, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", border: "1px solid #1a1a1a", borderRadius: "4px", background: "#080808" }}>
                      {item.artworkUrl && (
                        <img src={item.artworkUrl} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "3px", flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                        <div style={{ fontSize: "11px", color: "#555", marginTop: "2px", textTransform: "capitalize" }}>{item.productType === "beat" ? "Beat" : "Sound Kit"}</div>
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                        {Number(item.price).toLocaleString("cs-CZ")} Kč
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={dividerStyle} />

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              className="btn btn-filled btn-bounce"
              onClick={() => navigate("/ucet")}
              style={{ width: "100%", borderRadius: "4px" }}
            >
              Přejít na účet a stáhnout soubory
            </button>
            <button
              className="btn btn-bounce"
              onClick={() => navigate("/")}
              style={{ width: "100%", borderRadius: "4px" }}
            >
              Zpět na hlavní stránku
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div style={containerStyle} className="fade-in">
        <div style={cardStyle}>
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}><ClockIcon /></div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.02em" }}>
            Platba se zpracovává
          </h2>
          <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.6, marginBottom: "8px" }}>
            Objednávka <strong style={{ color: "#fff" }}>#{orderId}</strong> čeká na potvrzení platby od GoPay.
          </p>
          <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.6 }}>
            Tato stránka se automaticky aktualizuje. Jakmile platba proběhne, obdržíte email s odkazem ke stažení.
          </p>

          <div style={dividerStyle} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f5b150", animation: "pulse 1.4s ease-in-out infinite" }} />
            <span style={{ fontSize: "12px", color: "#666" }}>Čekáme na potvrzení od GoPay…</span>
            <style>{`@keyframes pulse { 0%,100% { opacity:0.3 } 50% { opacity:1 } }`}</style>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              className="btn btn-bounce"
              onClick={() => navigate("/ucet")}
              style={{ width: "100%", borderRadius: "4px" }}
            >
              Přejít na účet
            </button>
            <button
              className="btn btn-bounce"
              onClick={() => navigate("/")}
              style={{ width: "100%", borderRadius: "4px" }}
            >
              Zpět na hlavní stránku
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div style={containerStyle} className="fade-in">
        <div style={cardStyle}>
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}><CrossIcon /></div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.02em" }}>
            Platba byla zrušena
          </h2>
          <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.6 }}>
            Objednávka <strong style={{ color: "#fff" }}>#{orderId}</strong> byla zrušena nebo platba nebyla dokončena.
          </p>

          <div style={dividerStyle} />

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              className="btn btn-filled btn-bounce"
              onClick={() => navigate("/kosik")}
              style={{ width: "100%", borderRadius: "4px" }}
            >
              Zpět do košíku
            </button>
            <button
              className="btn btn-bounce"
              onClick={() => navigate("/")}
              style={{ width: "100%", borderRadius: "4px" }}
            >
              Zpět na hlavní stránku
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="fade-in">
      <div style={cardStyle}>
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}><CrossIcon /></div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px", letterSpacing: "-0.02em" }}>
          Něco se pokazilo
        </h2>
        <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.6 }}>
          Nepodařilo se načíst stav vaší objednávky. Pokud byla platba odečtena, kontaktujte nás a my vám pomůžeme.
        </p>

        <div style={dividerStyle} />

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            className="btn btn-filled btn-bounce"
            onClick={() => navigate("/ucet")}
            style={{ width: "100%", borderRadius: "4px" }}
          >
            Přejít na účet
          </button>
          <button
            className="btn btn-bounce"
            onClick={() => navigate("/")}
            style={{ width: "100%", borderRadius: "4px" }}
          >
            Zpět na hlavní stránku
          </button>
        </div>
      </div>
    </div>
  );
}
