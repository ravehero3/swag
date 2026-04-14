import { useState } from "react";
import { useLocation } from "wouter";
import { useApp } from "../App.js";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { settings } = useApp() as any;

  const token = new URLSearchParams(window.location.search).get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Hesla se neshodují");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chyba serveru");
      setSuccess(true);
      setTimeout(() => navigate("/prihlasit-se"), 3000);
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
          src={settings?.zvuky_video || "/uploads/hrad-na-web.mov"}
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
        <h1 style={{ marginBottom: "8px", textAlign: "center", fontSize: "22px", fontWeight: 500 }}>Nové heslo</h1>

        {!token ? (
          <p style={{ color: "#888", textAlign: "center", fontSize: "14px", margin: "16px 0" }}>
            Neplatný nebo chybějící odkaz. <a href="/zapomenute-heslo" style={{ color: "#aaa" }}>Požádat o nový.</a>
          </p>
        ) : success ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#4caf50", fontSize: "14px", margin: "16px 0 8px" }}>Heslo bylo úspěšně změněno.</p>
            <p style={{ color: "#666", fontSize: "13px", margin: "0 0 20px" }}>Přesměrování na přihlášení...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "#777", fontSize: "13px", lineHeight: 1.6, margin: "0 0 20px", textAlign: "center" }}>
              Zadejte nové heslo pro váš účet.
            </p>

            {error && (
              <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #ff4444", borderRadius: "4px", textAlign: "center", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#999" }}>Nové heslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                data-testid="input-new-password"
                style={{ width: "100%", borderRadius: "4px", background: "rgba(13,13,13,0.5)", border: "1px solid #333" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", color: "#999" }}>Potvrdit heslo</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                data-testid="input-confirm-password"
                style={{ width: "100%", borderRadius: "4px", background: "rgba(13,13,13,0.5)", border: "1px solid #333" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-filled btn-bounce"
              disabled={loading}
              data-testid="button-reset-submit"
              style={{ width: "100%", borderRadius: "4px" }}
            >
              {loading ? "Ukládám..." : "Nastavit nové heslo"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
