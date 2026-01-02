function Payment() {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>Platba</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Přijaté platební metody</h2>
          <ul style={{ color: "#999", lineHeight: "1.8", paddingLeft: "20px" }}>
            <li>Kreditní karty (Visa, Mastercard, American Express)</li>
            <li>Bezletová platba online</li>
            <li>Převod na bankovní účet</li>
            <li>Další digitální platební služby</li>
          </ul>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Jak mohu zaplatit za nákup?</h2>
          <p style={{ color: "#999", lineHeight: "1.6", marginBottom: "16px" }}>
            Během procesu checkout si můžete vybrat svou preferovanou platební metodu. Všechny platby jsou bezpečně zpracovávány našimi partnery.
          </p>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Po úspěšné platbě budete okamžitě přesměrováni na stažení vašeho nákupu.
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Bezpečnost platby</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Všechny platební transakce jsou chráněny nejnovějšími šifrovacími technologiemi. Vaše osobní údaje jsou bezpečné.
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Problémy s platbou?</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Pokud máte problémy s platbou, zkuste jiný způsob nebo se obraťte na náš tým na voodoo808@mail.com.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Payment;
