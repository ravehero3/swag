function Delivery() {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>Doručení</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Digitální produkty</h2>
          <p style={{ color: "#999", lineHeight: "1.6", marginBottom: "16px" }}>
            Všechny naše produkty (beaty a zvukové kity) jsou digitální a jsou doručovány okamžitě po dokončení nákupu. Obdržíte e-mail s odkazem ke stažení.
          </p>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Soubory jsou dostupné k stažení po dobu 30 dnů od nákupu. Prosím, stáhněte si je včas.
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Jak si stáhnu svůj nákup?</h2>
          <ol style={{ color: "#999", lineHeight: "1.8", paddingLeft: "20px" }}>
            <li>Zkontrolujte svůj e-mail na potvrzení objednávky</li>
            <li>Klikněte na odkaz ke stažení v e-mailu</li>
            <li>Stáhněte si soubory na svůj počítač</li>
            <li>Extrahujte ZIP soubor, pokud je potřeba</li>
            <li>Užijte si vaše nové produkty!</li>
          </ol>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Problém se stažením?</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Pokud máte problémy se stažením, kontaktujte nás prosím na voodoo808@mail.com. Rádi vám pomůžeme!
          </p>
        </section>
      </div>
    </div>
  );
}

export default Delivery;
