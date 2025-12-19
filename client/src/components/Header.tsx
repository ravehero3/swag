import { Link, useLocation } from "wouter";
import { useApp } from "../App";
import { useState } from "react";

function Header() {
  const { user, cart, setIsCartOpen } = useApp();
  const [location] = useLocation();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

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

      <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 10, padding: "0 16px" }}>
        <Link href={user ? (user.isAdmin ? "/admin" : "/prihlasit-se") : "/prihlasit-se"}>
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

        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="white"
          style={{
            cursor: "pointer",
            transition: "transform 0.2s ease, filter 0.2s ease",
            transform: hoveredIcon === "heart" ? "scale(1.02)" : "scale(1)",
            padding: "6px",
            filter: hoveredIcon === "heart" ? "drop-shadow(0 0 8px rgba(255,165,0,0.5))" : "none",
            flexShrink: 0,
          }}
          onClick={() => window.location.href = "/ulozeno"}
          onMouseEnter={() => setHoveredIcon("heart")}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <path d="M19.5 10c0 7-7.5 11-7.5 11S4.5 17 4.5 10a4.5 4.5 0 0 1 9 0c0-3-4.5-4-4.5-4s-4.5 1-4.5 4a4.5 4.5 0 0 1 9 0z" />
        </svg>

        <div
          style={{
            position: "relative",
            cursor: "pointer",
            transition: "transform 0.2s ease",
            transform: hoveredIcon === "cart" ? "scale(1.02)" : "scale(1)",
            display: "flex",
            alignItems: "center",
            padding: "8px",
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

