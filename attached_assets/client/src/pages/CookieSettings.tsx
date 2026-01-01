import { useState } from 'react';

function CookieSettings() {
  const [settings, setSettings] = useState({
    necessary: true,
    performance: true,
    functional: true,
    marketing: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    localStorage.setItem('voodoo808_cookie_settings', JSON.stringify(settings));
    alert('Nastavení cookies bylo uloženo.');
  };

  const cookieStyle: React.CSSProperties = {
    padding: "16px",
    border: "1px solid #333",
    borderRadius: "4px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }} className="fade-in">
      <h1 style={{ fontSize: "32px", marginBottom: "32px" }}>Nastavení cookies</h1>
      
      <p style={{ color: "#999", marginBottom: "32px", lineHeight: "1.6" }}>
        Zde můžete kontrolovat, jaké cookies nám dovolíte používat. Některé cookies jsou nezbytné pro správné fungování webu.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Necessary Cookies */}
        <div style={cookieStyle}>
          <div>
            <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>Nezbytné cookies</h3>
            <p style={{ color: "#666", fontSize: "12px" }}>Povinné - nezbytné pro fungování webu</p>
          </div>
          <input
            type="checkbox"
            checked={settings.necessary}
            disabled
            style={{ cursor: "not-allowed", width: "20px", height: "20px" }}
          />
        </div>

        {/* Performance Cookies */}
        <div style={cookieStyle}>
          <div>
            <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>Výkonnostní cookies</h3>
            <p style={{ color: "#666", fontSize: "12px" }}>Pomáhají nám analyzovat jak web používáte</p>
          </div>
          <input
            type="checkbox"
            checked={settings.performance}
            onChange={() => handleToggle("performance")}
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
        </div>

        {/* Functional Cookies */}
        <div style={cookieStyle}>
          <div>
            <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>Funkční cookies</h3>
            <p style={{ color: "#666", fontSize: "12px" }}>Zapamatování vašich preferencí</p>
          </div>
          <input
            type="checkbox"
            checked={settings.functional}
            onChange={() => handleToggle("functional")}
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
        </div>

        {/* Marketing Cookies */}
        <div style={cookieStyle}>
          <div>
            <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>Marketingové cookies</h3>
            <p style={{ color: "#666", fontSize: "12px" }}>Personalizovaný obsah a reklamy</p>
          </div>
          <input
            type="checkbox"
            checked={settings.marketing}
            onChange={() => handleToggle("marketing")}
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          marginTop: "32px",
          padding: "12px 24px",
          background: "#fff",
          color: "#000",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        Uložit nastavení
      </button>
    </div>
  );
}

export default CookieSettings;
