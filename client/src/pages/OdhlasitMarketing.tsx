import { useState, useEffect } from "react";

function useQueryToken(): string {
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") || "");
  return token;
}

function OdhlasitMarketing() {
  const token = useQueryToken();
  const [status, setStatus] = useState<"loading" | "ready" | "already" | "confirmed" | "error">("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Chybí platný odkaz pro odhlášení.");
      return;
    }
    fetch(`/api/marketing/unsubscribe/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Neplatný odkaz");
        setEmail(data.email);
        setStatus(data.alreadyUnsubscribed ? "already" : "ready");
      })
      .catch((err) => {
        setStatus("error");
        setError(err.message);
      });
  }, [token]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/marketing/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba serveru");
      setStatus("confirmed");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "40px 20px" }}
    >
      <div
        style={{
          maxWidth: "440px",
          width: "100%",
          padding: "32px",
          border: "1px solid #222",
          borderRadius: "4px",
          background: "rgba(10, 10, 10, 0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <h1 style={{ marginBottom: "8px", textAlign: "center", fontSize: "22px", fontWeight: 500 }}>
          Odhlášení z marketingových e-mailů
        </h1>

        {status === "loading" && (
          <p style={{ color: "#777", fontSize: "13px", textAlign: "center", margin: "20px 0 0" }}>Načítám…</p>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#ff4444", margin: "16px 0", padding: "12px", border: "1px solid #ff4444", borderRadius: "4px", fontSize: "13px" }}>
              {error}
            </div>
            <a href="/" style={{ display: "inline-block", padding: "10px 24px", background: "#fff", color: "#000", textDecoration: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 500 }}>
              Zpět na hlavní stránku
            </a>
          </div>
        )}

        {status === "already" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.7, margin: "16px 0 24px" }}>
              Email <strong style={{ color: "#ccc" }}>{email}</strong> je již odhlášen z marketingových e-mailů. Transakční
              e-maily (potvrzení objednávek, stažení souborů) budete i nadále dostávat normálně.
            </p>
            <a href="/" style={{ display: "inline-block", padding: "10px 24px", background: "#fff", color: "#000", textDecoration: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 500 }}>
              Zpět na hlavní stránku
            </a>
          </div>
        )}

        {status === "ready" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.7, margin: "16px 0 24px" }}>
              Opravdu se chcete odhlásit z marketingových e-mailů pro <strong style={{ color: "#ccc" }}>{email}</strong>?
              Nadále budete dostávat pouze transakční e-maily spojené s vašimi objednávkami a staženými soubory.
            </p>
            {error && (
              <div style={{ color: "#ff4444", margin: "0 0 16px", padding: "12px", border: "1px solid #ff4444", borderRadius: "4px", fontSize: "13px" }}>
                {error}
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="btn btn-filled btn-bounce"
              style={{ width: "100%", borderRadius: "4px" }}
              data-testid="button-confirm-unsubscribe"
            >
              {submitting ? "Odhlašuji…" : "Odhlásit se z marketingu"}
            </button>
          </div>
        )}

        {status === "confirmed" && (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.7, margin: "16px 0 24px" }}>
              Byli jste úspěšně odhlášeni z marketingových e-mailů. Mrzí nás to! Transakční e-maily (objednávky, stažení
              souborů) budete i nadále dostávat normálně.
            </p>
            <a href="/" style={{ display: "inline-block", padding: "10px 24px", background: "#fff", color: "#000", textDecoration: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 500 }}>
              Zpět na hlavní stránku
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default OdhlasitMarketing;
