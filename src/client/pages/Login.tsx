import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate("/");
      } else {
        setError(data.error || "Onjuist wachtwoord — probeer opnieuw.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F0F15",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <h1
        style={{
          color: "#E8C547",
          fontSize: "28px",
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          marginBottom: "48px",
          letterSpacing: "0.04em",
        }}
      >
        FREEK'S COACH
      </h1>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "320px" }}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Wachtwoord"
          style={{
            width: "100%",
            padding: "16px",
            background: "#17171F",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "10px",
            color: "#F2F2F0",
            fontSize: "15px",
            marginBottom: "16px",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p style={{ color: "#E84040", fontSize: "13px", marginBottom: "16px" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: "100%",
            padding: "16px",
            background: "#E8C547",
            color: "#0F0F15",
            border: "none",
            borderRadius: "10px",
            fontSize: "15px",
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: loading || !password ? "not-allowed" : "pointer",
            opacity: loading || !password ? 0.6 : 1,
          }}
        >
          {loading ? "Bezig..." : "Inloggen →"}
        </button>
      </form>
    </div>
  );
}
