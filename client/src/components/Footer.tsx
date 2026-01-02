import { useApp } from "../App";

function Footer() {
  const { setIsNewsletterOpen } = useApp();

  return (
    <footer
      style={{
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "-100px",
        position: "relative",
        zIndex: 5000,
        gap: "16px",
      }}
    >
      <span
        style={{
          fontSize: "14px",
          fontFamily: "'Helvetica Neue Condensed', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 300,
          fontStretch: "condensed",
          color: "#666",
        }}
      >
        © 2026 VOODOO808
      </span>
      <button
        onClick={() => setIsNewsletterOpen(true)}
        style={{
          fontSize: "14px",
          fontFamily: "'Helvetica Neue Condensed', 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontWeight: 300,
          fontStretch: "condensed",
          color: "#666",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0",
          textDecoration: "underline",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#999";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#666";
        }}
      >
        Přihlaste se k odběru novinek
      </button>
    </footer>
  );
}

export default Footer;
