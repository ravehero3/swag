import { Link, useLocation } from "wouter";
import { useApp } from "../App";
import { useState } from "react";

function Header() {
  const { user, cart } = useApp();
  const [location] = useLocation();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

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
        height: "24px",
        borderBottom: "1px solid #333",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

      <Link href="/">
        <img
          src="/uploads/artwork/voodoo808-logo.png"
          alt="VOODOO808"
          style={{
            height: "16px",
            cursor: "pointer",
            filter: "invert(1)",
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href={user ? (user.isAdmin ? "/admin" : "/prihlasit-se") : "/prihlasit-se"}>
          <span
            style={{
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 400,
            }}
          >
            ÚČET
          </span>
        </Link>

        <Link href="/ulozeno">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: "pointer" }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </Link>

        <Link href="/kosik">
          <div style={{ position: "relative", cursor: "pointer" }}>
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
            {cart.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  background: "#fff",
                  color: "#000",
                  borderRadius: "50%",
                  width: "14px",
                  height: "14px",
                  fontSize: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cart.length}
              </span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;
