import { useState } from "react";
import { useApp } from "../App.js";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { settings } = useApp() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba serveru");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", padding: "40px 20px", overflow: "hidden" }}
    >
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <video
          src="/uploads/hrad-na-web.mov"
          autoPlay muted loop playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.5 }}
        />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)" }} />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "400px",
          width: "100%",
          padding: "32px",
          border: "1px solid #222",
          borderRadius: "4px",
          background: "rgba(10, 10, 10, 0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <h1 style={{ marginBottom: "8px", textAlign: "center", fontSize: "22px", fontWeight: 500 }}>Zapomenuté heslo</h1>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.7, margin: "16px 0 24px" }}>
              Pokud je zadaný email registrovaný, obdržíte odkaz pro reset hesla. Zkontrolujte i složku nevyžádané pošty.
            </p>
            <a
              href="/prihlasit-se"
              style={{ display: "inline-block", padding: "10px 24px", background: "#fff", color: "#000", textDecoration: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 500 }}
            >
              Zpět na přihlášení
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "#777", fontSize: "13px", lineHeight: 1.6, margin: "0 0 20px", textAlign: "center" }}>
              Zadejte svůj email a pošleme vám odkaz pro reset hesla.
            </p>

            {error && (
              <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #ff4444", borderRadius: "4px", textAlign: "center", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#999" }}>Emailová adresa</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-forgot-email"
                style={{ width: "100%", borderRadius: "4px", background: "rgba(13,13,13,0.5)", border: "1px solid #333" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-filled btn-bounce"
              disabled={loading}
              data-testid="button-forgot-submit"
              style={{ width: "100%", marginBottom: "12px", borderRadius: "4px" }}
            >
              {loading ? "Odesílám..." : "Odeslat odkaz"}
            </button>

            <a
              href="/prihlasit-se"
              style={{ display: "block", textAlign: "center", color: "#555", fontSize: "13px", textDecoration: "underline" }}
            >
              Zpět na přihlášení
            </a>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
