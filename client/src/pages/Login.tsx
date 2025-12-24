import { useState } from "react";
import { useLocation } from "wouter";
import { useApp } from "../App";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useApp();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

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

          <div style={{ marginBottom: "24px" }}>
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
            style={{ width: "100%", marginBottom: "16px", borderRadius: "4px" }}
          >
            {loading ? "..." : isLogin ? "Přihlásit se" : "Registrovat"}
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
            }}
          >
            {isLogin ? "Nemáte účet? Registrujte se" : "Už máte účet? Přihlaste se"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
