function CookiePolicy() {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>Zásady používání souborů cookie</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Co jsou cookies?</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Cookies jsou malé textové soubory, které se ukládají na vašem zařízení. Používáme je k zapamatování vašich preferencí a zlepšení vašeho zážitku.
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Jaké cookies používáme?</h2>
          <ul style={{ color: "#999", lineHeight: "1.8", paddingLeft: "20px" }}>
            <li><strong>Nezbytné cookies:</strong> Pro funkčnost webu (přihlášení, bezpečnost)</li>
            <li><strong>Výkonnostní cookies:</strong> Pro analýzu návštěvnosti</li>
            <li><strong>Funkční cookies:</strong> Pro zapamatování vašich preferencí</li>
            <li><strong>Marketingové cookies:</strong> Pro personalizovaný obsah</li>
          </ul>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Jak cookies používáme?</h2>
          <p style={{ color: "#999", lineHeight: "1.6", marginBottom: "16px" }}>
            Cookies nám pomáhají:
          </p>
          <ul style={{ color: "#999", lineHeight: "1.8", paddingLeft: "20px" }}>
            <li>Uchovat vás přihlášeného</li>
            <li>Zapamatovat si vaši nákupní košík</li>
            <li>Analyzovat, jak používáte web</li>
            <li>Personalizovat obsah</li>
          </ul>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Kontrola cookies</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Můžete kontrolovat cookies v nastavení svého prohlížeče. Některé funkce webu mohou být omezené, pokud cookies zakážete.
          </p>
        </section>
      </div>
    </div>
  );
}

export default CookiePolicy;
