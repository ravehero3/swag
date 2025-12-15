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
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/">
          <img
            src="/uploads/artwork/voodoo808-logo.png"
            alt="VOODOO808"
            style={{ height: "26px", cursor: "pointer", filter: "invert(1)" }}
          />
        </Link>
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
        <Link href="/ulozeno">
          <span
            style={navLinkStyle("/ulozeno", location === "/ulozeno")}
            onMouseEnter={() => setHoveredLink("/ulozeno")}
            onMouseLeave={() => setHoveredLink(null)}
          >
            ULOZENO
          </span>
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
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
