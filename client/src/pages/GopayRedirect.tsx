import { useEffect, useState } from "react";

function GoPayLogo() {
  return (
    <svg width="120" height="36" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="GoPay">
      <text x="0" y="28" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="30" fill="#fff" letterSpacing="-1">Go</text>
      <text x="42" y="28" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="30" fill="#54c8f8" letterSpacing="-1">Pay</text>
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: "gp-spin 0.9s linear infinite" }}
    >
      <circle cx="24" cy="24" r="20" stroke="#222" strokeWidth="3" />
      <path d="M24 4C35.046 4 44 12.954 44 24" stroke="#54c8f8" strokeWidth="3" strokeLinecap="round" />
      <style>{`@keyframes gp-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

export default function GopayRedirect() {
  const [countdown, setCountdown] = useState(2);
  const [redirected, setRedirected] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const gwUrl = params.get("url") ? decodeURIComponent(params.get("url")!) : null;

  useEffect(() => {
    if (!gwUrl) return;

    const timer = setTimeout(() => {
      setRedirected(true);
      window.location.href = gwUrl;
    }, 1800);

    const tick = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 900);

    return () => {
      clearTimeout(timer);
      clearInterval(tick);
    };
  }, [gwUrl]);

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    background: "#000",
    gap: "0",
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "28px",
  };

  if (!gwUrl) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: "#555", fontSize: "14px" }}>Chybí odkaz na platební bránu.</p>
          <a href="/" style={{ color: "#fff", fontSize: "13px" }}>Zpět na hlavní stránku</a>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="fade-in">
      <div style={cardStyle}>
        <GoPayLogo />

        <Spinner />

        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Přesměrováváme vás na platební bránu
          </h1>
          <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, margin: 0 }}>
            Budete přesměrováni za okamžik.<br />
            Prosím nevypínejte tuto stránku.
          </p>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          border: "1px solid #1a1a1a",
          borderRadius: "4px",
          background: "#080808",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#555" strokeWidth="1.2" />
            <path d="M7 4.5V7.5M7 9.5H7.01" stroke="#555" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: "12px", color: "#555" }}>
            Platba je zabezpečena systémem GoPay
          </span>
        </div>

        <a
          href={gwUrl}
          data-testid="link-gopay-manual"
          style={{
            display: "inline-block",
            fontSize: "13px",
            color: redirected ? "#555" : "#54c8f8",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          {redirected ? "Přesměrováváme…" : "Pokud nedojde k přesměrování, klikněte zde"}
        </a>
      </div>
    </div>
  );
}
