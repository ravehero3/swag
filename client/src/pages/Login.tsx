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

  if (user) {
    return (
      <div className="fade-in" style={{ maxWidth: "400px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ marginBottom: "24px" }}>Účet</h1>
        <p style={{ marginBottom: "16px" }}>Přihlášen jako: {user.email}</p>
        {user.isAdmin && (
          <button className="btn" onClick={() => navigate("/admin")} style={{ marginBottom: "12px", width: "100%" }}>
            Admin Panel
          </button>
        )}
        <button className="btn" onClick={handleLogout} style={{ width: "100%" }}>
          Odhlásit se
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: "400px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "24px" }}>
        {isLogin ? "Přihlásit se" : "Registrace"}
      </h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ color: "#ff4444", marginBottom: "16px", padding: "12px", border: "1px solid #ff4444" }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>Heslo</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-filled"
          disabled={loading}
          style={{ width: "100%", marginBottom: "16px" }}
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
  );
}

export default Login;
