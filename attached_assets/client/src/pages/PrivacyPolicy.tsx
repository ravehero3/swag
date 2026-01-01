function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>Zásady ochrany osobních údajů</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Úvod</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            VOODOO808 si váží vaší soukromí. Tyto zásady ochrany osobních údajů vysvětlují, jak shromažďujeme, používáme a chráníme vaše osobní údaje.
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Jaké údaje shromažďujeme?</h2>
          <ul style={{ color: "#999", lineHeight: "1.8", paddingLeft: "20px" }}>
            <li>Jméno a e-mailová adresa</li>
            <li>Poštovní adresa (v případě fyzických produktů)</li>
            <li>Platební informace (zpracovávány bezpečně třetími stranami)</li>
            <li>Informace o vašem používání webu (cookies, analytika)</li>
          </ul>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Jak používáme vaše údaje?</h2>
          <ul style={{ color: "#999", lineHeight: "1.8", paddingLeft: "20px" }}>
            <li>Zpracování a plnění vaších objednávek</li>
            <li>Komunikace s vámi o vašich nákupech</li>
            <li>Zlepšování našeho webu a služeb</li>
            <li>Marketingová komunikace (pokud jste se přihlásili)</li>
          </ul>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Ochrana vašich údajů</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Používáme nejnovější bezpečnostní opatření k ochraně vašich osobních údajů. Všechna citlivá data jsou šifrována a bezpečně ukládána.
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Vaše práva</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Máte právo na přístup, opravu nebo smazání vašich osobních údajů. Kontaktujte nás na voodoo808@mail.com.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
