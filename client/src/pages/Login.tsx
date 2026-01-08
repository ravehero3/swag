import { useState } from "react";
import { useLocation } from "wouter";
import { useApp } from "../App.js";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useApp() as any;
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      console.log("Attempting login to:", endpoint);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      console.log("Response text:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("Failed to parse JSON:", parseErr);
        throw new Error("Server vrátil neplatný formát dat (HTML místo JSON). Pravděpodobně chyba v routování na Vercelu.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Chyba");
      }

      setUser(data.user);
      navigate(data.user.isAdmin ? "/admin" : "/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  const labelStyle = {
    display: "block",
    marginBottom: "4px",
    fontSize: "12px",
    color: "#999",
  };

  const inputStyle = {
    width: "100%",
    borderRadius: "4px",
    background: "rgba(0, 0, 0, 0.5)",
    border: "1px solid #333",
  };

  if (user) {
    return (
      <div className="fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", padding: "40px 20px" }}>
        <div
          style={{
            maxWidth: "400px",
            width: "100%",
            padding: "32px",
            border: "1px solid #000",
            borderRadius: "4px",
            background: "rgba(20, 20, 20, 0.8)",
            backdropFilter: "blur(50px)",
            WebkitBackdropFilter: "blur(50px)",
          }}
        >
          <h1 style={{ marginBottom: "24px", textAlign: "center" }}>Účet</h1>
          <p style={{ marginBottom: "16px", textAlign: "center" }}>Přihlášen jako: {user.email}</p>
          {user.isAdmin && (
            <button
              className="btn btn-bounce"
              onClick={() => navigate("/admin")}
              style={{ marginBottom: "12px", width: "100%", borderRadius: "4px" }}
            >
              Admin Panel
            </button>
          )}
          <button
            className="btn btn-bounce"
            onClick={handleLogout}
            style={{ width: "100%", borderRadius: "4px" }}
          >
            Odhlásit se
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", padding: "40px 20px" }}>
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "32px",
          border: "1px solid #000",
          borderRadius: "4px",
          background: "rgba(20, 20, 20, 0.8)",
          backdropFilter: "blur(50px)",
          WebkitBackdropFilter: "blur(50px)",
        }}
      >
        <h1 style={{ marginBottom: "24px", textAlign: "center" }}>
          {isLogin ? "Přihlásit se" : "Registrace"}
        </h1>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #ff4444", borderRadius: "4px", textAlign: "center" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Emailová Adresa</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={labelStyle}>Heslo</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            className="btn btn-filled btn-bounce"
            disabled={loading}
            style={{ width: "100%", marginBottom: "12px", marginTop: "0px", borderRadius: "4px" }}
          >
            {loading ? "..." : isLogin ? "Přihlásit se" : "Registrovat"}
          </button>

          <button
            type="button"
            onClick={() => window.location.href = "/api/auth/google"}
            className="btn btn-bounce"
            style={{
              width: "100%",
              marginBottom: "16px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              background: "#fff",
              color: "#000",
              border: "1px solid #fff"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "transparent",
              border: "none",
              color: "#666",
              width: "100%",
              textDecoration: "underline",
              padding: "8px 0",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {isLogin ? "Nemáte účet? Registrujte se" : "Už máte účet? Přihlaste se"}
          </button>

          <style>{`
            @media (max-width: 768px) {
              form {
                width: 100%;
              }
            }
          `}</style>
        </form>
      </div>
    </div>
  );
}

export default Login;
