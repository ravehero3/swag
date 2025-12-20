function FAQ() {
  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>Často kladené dotazy</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ borderBottom: "1px solid #333", paddingBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Jak nakupuji v VOODOO808?</h3>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Procházejte naši kolekci beatů a zvukových kitů. Klikněte na "Koupit" nebo "Do košíku" a postupujte checkout procesem. Po nákupu obdržíte odkaz na stažení.
          </p>
        </div>

        <div style={{ borderBottom: "1px solid #333", paddingBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Jak dlouho je soubor dostupný k stažení?</h3>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Soubory jsou dostupné k stažení po dobu 30 dní od nákupu. Ujistěte se, že je stáhnete v tomto období.
          </p>
        </div>

        <div style={{ borderBottom: "1px solid #333", paddingBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Mohu použít kúpené beaty komerčně?</h3>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Ano, v závislosti na typu licence, kterou zakoupíte. Přečtěte si podrobnosti licence u každého produktu.
          </p>
        </div>

        <div style={{ borderBottom: "1px solid #333", paddingBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Jaké formáty jsou dostupné?</h3>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Naše produkty jsou dostupné v MP3, WAV a dalších formátech v závislosti na produktu.
          </p>
        </div>

        <div style={{ borderBottom: "1px solid #333", paddingBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Mám technické problémy. Jak vám mohu napsat?</h3>
          <p style={{ color: "#999", lineHeight: "1.6" }}>
            Kontaktujte nás prosím na voodoo808@mail.com nebo použijte WhatsApp: +420 775 181 107
          </p>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
