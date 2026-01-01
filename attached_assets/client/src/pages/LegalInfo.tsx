function LegalInfo() {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>Právní informace</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Operátor webu</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            <strong>Jméno:</strong> VOODOO808<br />
            <strong>E-mail:</strong> voodoo808@mail.com<br />
            <strong>Telefon:</strong> +420 775 181 107
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Podmínky používání</h2>
          <p style={{ color: "#999", lineHeight: "1.6", marginBottom: "16px" }}>
            Používáním tohoto webu souhlasíte s našimi podmínkami používání. Veškerý obsah na tomto webu je vlastnictvím VOODOO808.
          </p>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Zakázáno je reprodukovat, distribuovat nebo přenášet jakýkoli obsah bez našeho výslovného písemného povolení.
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Vylučovací klauzule</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            VOODOO808 se neodpovídá za jakékoli přímé nebo nepřímé škody vyplývající z používání tohoto webu nebo produktů, které nabízíme.
          </p>
        </section>

        <section style={{ borderTop: "1px solid #333", paddingTop: "24px" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Autorská práva</h2>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Všechny hudební kompozice, zvuky a grafické prvky jsou chráněny autorskými právy. Nákupem produktu obdržíte licenci k použití, ne vlastnictví.
          </p>
        </section>
      </div>
    </div>
  );
}

export default LegalInfo;
