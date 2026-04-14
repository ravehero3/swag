import type React from "react";

function Payment() {
  const sectionStyle: React.CSSProperties = {
    borderTop: "1px solid #222",
    paddingTop: "28px",
  };
  const h2Style: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 500,
    marginBottom: "14px",
    color: "#fff",
    letterSpacing: "-0.01em",
  };
  const pStyle: React.CSSProperties = {
    color: "#888",
    lineHeight: "1.75",
    marginBottom: "12px",
    fontSize: "14px",
  };
  const liStyle: React.CSSProperties = {
    color: "#888",
    lineHeight: "2",
    fontSize: "14px",
  };

  return (
    <div style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px 80px" }} className="fade-in">
      <p style={{ fontSize: "11px", letterSpacing: "0.12em", color: "#555", textTransform: "uppercase", marginBottom: "12px" }}>
        Právní informace
      </p>
      <h1 style={{ fontSize: "30px", fontWeight: 500, marginBottom: "8px", letterSpacing: "-0.02em" }}>
        Platební podmínky
      </h1>
      <p style={{ color: "#555", fontSize: "13px", marginBottom: "48px" }}>
        Platné od 1. 1. 2024 &nbsp;·&nbsp; VOODOO808
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        <section>
          <h2 style={h2Style}>1. Zpracovatel plateb</h2>
          <p style={pStyle}>
            Veškeré platby na tomto webu jsou zpracovávány prostřednictvím platební brány
            <strong style={{ color: "#ccc" }}> GoPay, s.r.o.</strong>, IČO: 26046768, se sídlem Platnéřská 191/4,
            110 00 Praha 1, zapsané v obchodním rejstříku vedeném Krajským soudem v Českých Budějovicích,
            oddíl C, vložka 11030.
          </p>
          <p style={pStyle}>
            GoPay je držitelem licence vydané Českou národní bankou pro poskytování platebních služeb
            (číslo licence 2491/2009-B) a podléhá jejímu dohledu.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Přijímané platební metody</h2>
          <p style={{ ...pStyle, marginBottom: "10px" }}>Přijímáme následující způsoby platby:</p>
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            <li style={liStyle}>Platební karty Visa, Mastercard a Maestro</li>
            <li style={liStyle}>Bankovní převod online (Rychlá platba)</li>
            <li style={liStyle}>Google Pay</li>
            <li style={liStyle}>Apple Pay</li>
          </ul>
          <p style={{ ...pStyle, marginTop: "12px" }}>
            Dostupnost konkrétních metod může záviset na vaší bance a nastavení prohlížeče.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Průběh platby</h2>
          <p style={pStyle}>
            Po potvrzení objednávky budete přesměrováni na zabezpečenou platební bránu GoPay, kde zvolíte
            způsob platby a transakci dokončíte. Po úspěšném zaplacení vám přijde potvrzovací email se
            stažením digitálního obsahu. Celý proces trvá typicky méně než 2 minuty.
          </p>
          <p style={pStyle}>
            V případě přerušení připojení nebo technické chyby během platby vás systém vrátí na stránku
            košíku a platba nebude odečtena. Zkuste transakci opakovat nebo kontaktujte podporu.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Bezpečnost plateb</h2>
          <p style={pStyle}>
            Všechny transakce jsou šifrovány protokolem TLS 1.2 / 1.3 (256-bit SSL). Čísla platebních karet
            nejsou nikdy ukládána na našich serverech — veškerá citlivá data jsou zpracovávána výhradně
            infrastrukturou GoPay, která splňuje standard PCI DSS Level 1.
          </p>
          <p style={pStyle}>
            Kartové platby jsou chráněny 3D Secure autentizací (Verified by Visa / Mastercard SecureCode),
            která vyžaduje ověření vaší identity přes bankovní aplikaci nebo SMS kód.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Měna a ceny</h2>
          <p style={pStyle}>
            Veškeré ceny jsou uvedeny v českých korunách (CZK) včetně DPH. Fakturovaná částka odpovídá
            ceně zobrazené při potvrzení objednávky. Kurzové rozdíly nevznikají, jelikož platby probíhají
            výhradně v CZK.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Reklamace a vrácení platby</h2>
          <p style={pStyle}>
            Prodáváme digitální obsah (beaty, zvukové kity), který je zákazníkovi zpřístupněn okamžitě po
            zaplacení. V souladu s § 1837 písm. l) zákona č. 89/2012 Sb. (občanský zákoník)
            <strong style={{ color: "#ccc" }}> nevzniká právo na odstoupení od smlouvy</strong> u digitálního obsahu
            dodaného se souhlasem zákazníka před uplynutím lhůty pro odstoupení.
          </p>
          <p style={pStyle}>
            Pokud vám byl naúčtován nesprávný nebo duplicitní poplatek, nebo pokud zakoupený obsah
            není dostupný, kontaktujte nás na{" "}
            <a href="mailto:info@voodoo808.com" style={{ color: "#aaa", textDecoration: "none", borderBottom: "1px solid #444" }}>
              info@voodoo808.com
            </a>{" "}
            do 14 dnů od transakce. Oprávněné reklamace vyřídíme do 5 pracovních dnů.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Ochrana osobních údajů při platbě</h2>
          <p style={pStyle}>
            Při platbě předáváme GoPay pouze údaje nezbytné ke zpracování transakce (email, výše platby,
            popis objednávky). Zpracování osobních údajů se řídí našimi{" "}
            <a href="/ochrana-osobnich-udaju" style={{ color: "#aaa", textDecoration: "none", borderBottom: "1px solid #444" }}>
              Zásadami ochrany osobních údajů
            </a>{" "}
            a{" "}
            <a href="https://gopay.com/cs/ochrana-soukromi" target="_blank" rel="noopener noreferrer" style={{ color: "#aaa", textDecoration: "none", borderBottom: "1px solid #444" }}>
              Zásadami ochrany soukromí GoPay
            </a>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Kontakt</h2>
          <p style={pStyle}>
            V případě dotazů k platbám nás kontaktujte:
          </p>
          <p style={{ ...pStyle, marginBottom: 0 }}>
            Email:{" "}
            <a href="mailto:info@voodoo808.com" style={{ color: "#aaa", textDecoration: "none", borderBottom: "1px solid #444" }}>
              info@voodoo808.com
            </a>
            <br />
            Web: <span style={{ color: "#aaa" }}>www.voodoo808.com</span>
          </p>
        </section>

      </div>
    </div>
  );
}

export default Payment;
