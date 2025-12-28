import { Link, useLocation } from "wouter";
import { useApp } from "../App";
import { useState, useEffect } from "react";

function Header() {
  const { user, cart, setIsCartOpen } = useApp();
  const [location] = useLocation();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch("/api/saved", { credentials: "include" })
        .then((res) => res.json())
        .then((items) => setSavedCount(items.length))
        .catch(() => setSavedCount(0));
    }
  }, [user]);

  const navLinkStyle = (path: string, isActive: boolean) => ({
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    fontWeight: hoveredLink === path ? 700 : 400,
    textDecoration: "none",
    transition: "all 0.3s ease",
    textShadow: hoveredLink === path ? "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.5)" : "none",
  });

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 16px",
        height: "42px",
        borderBottom: "1px solid #333",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 10, padding: "0 8px" }}>
        <Link href="/beaty">
          <span
            style={navLinkStyle("/beaty", location === "/beaty" || location === "/")}
            onMouseEnter={() => setHoveredLink("/beaty")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            BEATY
          </span>
        </Link>
        <Link href="/zvuky">
          <span
            style={navLinkStyle("/zvuky", location === "/zvuky")}
            onMouseEnter={() => setHoveredLink("/zvuky")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            ZVUKY
          </span>
        </Link>
      </div>

      <Link href="/" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 5 }}>
        <img
          src="/uploads/artwork/voodoo808-logo.png"
          alt="VOODOO808"
          style={{
            height: "24px",
            cursor: "pointer",
            filter: "invert(1)",
            display: "block",
            transition: "transform 0.2s ease",
            transform: hoveredIcon === "logo" ? "scale(1.02)" : "scale(1)",
          }}
          onMouseEnter={() => setHoveredIcon("logo")}
          onMouseLeave={() => setHoveredIcon(null)}
        />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 10, paddingRight: "12px" }}>
        <Link href={user ? "/ucet" : "/prihlasit-se"}>
          <span
            style={{
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 400,
              transition: "transform 0.2s ease",
              transform: hoveredIcon === "account" ? "scale(1.02)" : "scale(1)",
              display: "inline-block",
              padding: "8px 0",
            }}
            onMouseEnter={() => setHoveredIcon("account")}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            ÚČET
          </span>
        </Link>

        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            style={{
              cursor: "pointer",
              transition: "transform 0.2s ease, filter 0.2s ease",
              transform: hoveredIcon === "heart" ? "scale(1.02)" : "scale(1)",
              filter: hoveredIcon === "heart" ? "drop-shadow(0 0 8px rgba(255,0,0,0.5))" : "none",
              flexShrink: 0,
            }}
            onClick={() => window.location.href = "/ulozeno"}
            onMouseEnter={() => setHoveredIcon("heart")}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {savedCount > 0 && (
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: "#fff",
                color: "#000",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              }}
            >
              {savedCount}
            </div>
          )}
        </div>

        <div
          style={{
            position: "relative",
            cursor: "pointer",
            transition: "transform 0.2s ease",
            transform: hoveredIcon === "cart" ? "scale(1.02)" : "scale(1)",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => setIsCartOpen(true)}
          onMouseEnter={() => setHoveredIcon("cart")}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.1); }
            }
            .cart-pulse {
              animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .cart-badge:hover {
              border: 1px solid white;
            }
          `}</style>
          {cart.length > 0 ? (
            <div
              className="cart-badge"
              style={{
                background: "#24e053",
                color: "#000",
                padding: "2px",
                borderRadius: "4px",
                fontSize: "12px",
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "24px",
                height: "24px",
                transition: "border 0.2s ease",
              }}
            >
              {cart.length}
            </div>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            >
              <rect x="3" y="6" width="18" height="15" rx="2" />
              <path d="M8 6V4a4 4 0 0 1 8 0v2" />
            </svg>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

