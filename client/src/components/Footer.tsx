import { useApp } from "../App.js";

function Footer() {
  const { setIsNewsletterOpen } = useApp() as any;

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
    </footer>
  );
}

export default Footer;
