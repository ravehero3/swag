import { useApp } from "../App.js";
import { useLocation } from "wouter";

function Footer() {
  const { setIsNewsletterOpen } = useApp() as any;
  const [location] = useLocation();
  const isPokladnaPage = location === "/pokladna";

  return (
    <footer
      style={{
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "0px",
        position: "relative",
        zIndex: 5000,
        gap: "16px",
        borderTop: "1px solid #333",
      }}
    >
      <span
        onClick={() => setIsNewsletterOpen(true)}
        style={{
          fontSize: "14px",
          fontFamily: "'Helvetica Neue Condensed', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 300,
          fontStretch: "condensed",
          color: "#666",
          cursor: "pointer",
        }}
      >
        © 2026 VOODOO808
      </span>
      {!isPokladnaPage && (
        <span
          onClick={() => setIsNewsletterOpen(true)}
          style={{
            fontSize: "14px",
            fontFamily: "'Helvetica Neue Condensed', 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 300,
            fontStretch: "condensed",
            color: "#666",
            cursor: "pointer",
          }}
        >
          PŘIHLÁŠENÍ K NEWSLETTERU
        </span>
      )}
    </footer>
  );
}

export default Footer;
