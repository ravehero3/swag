import { LanguageSelector } from "./LanguageSelector.js";

function Footer() {
  return (
    <footer
      style={{
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        zIndex: 10,
        borderTop: "1px solid #333",
        paddingRight: "16px",
        paddingLeft: "16px",
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
      <LanguageSelector />
    </footer>
  );
}

export default Footer;