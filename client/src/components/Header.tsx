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
        padding: "16px",
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
            height: "26px",
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
        <Link href="/ulozeno">
          <svg
            width="24"
            height="24"
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
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cart.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  background: "#fff",
                  color: "#000",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "12px",
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

        <Link href={user ? (user.isAdmin ? "/admin" : "/prihlasit-se") : "/prihlasit-se"}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: "pointer" }}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </div>
    </header>
  );
}

export default Header;
