import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"] as const;

export function Settings() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [korfballDays, setKorfballDays] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || "");
          setBirthDate(data.user.birth_date || "");
          setKorfballDays(JSON.parse(data.user.korfball_days || "[]"));
        }
      });
  }, []);

  const handleSave = async () => {
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, birthDate, korfballDays }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    navigate("/login");
  };

  const handleExport = () => {
    window.open("/api/user/export", "_blank");
  };

  const toggleDay = (day: string) => {
    setKorfballDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div style={{ padding: "16px" }}>
      <h1
        style={{
          fontFamily: "var(--font-condensed)",
          fontSize: "var(--text-2xl)",
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "0.02em",
          marginBottom: "24px",
        }}
      >
        INSTELLINGEN
      </h1>

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-xs)",
            color: "var(--text-ghost)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          PROFIEL
        </p>
        <label htmlFor="settings-name" style={labelStyle}>
          Naam
        </label>
        <input
          id="settings-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <label htmlFor="settings-birthdate" style={{ ...labelStyle, marginTop: "12px" }}>
          Geboortedatum
        </label>
        <input
          id="settings-birthdate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-xs)",
            color: "var(--text-ghost)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          KORFBAL-SCHEMA
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              style={{
                padding: "10px 14px",
                background: korfballDays.includes(day) ? "var(--accent)" : "var(--bg-elevated)",
                color: korfballDays.includes(day) ? "var(--bg-primary)" : "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontFamily: "var(--font-condensed)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "16px",
          background: saved ? "var(--success)" : "var(--accent)",
          color: "var(--bg-primary)",
          border: "none",
          borderRadius: "10px",
          fontFamily: "var(--font-condensed)",
          fontWeight: 700,
          fontSize: "var(--text-base)",
          letterSpacing: "0.04em",
          cursor: "pointer",
          marginBottom: "12px",
        }}
      >
        {saved ? "Opgeslagen ✓" : "Opslaan"}
      </button>

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-xs)",
            color: "var(--text-ghost)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          APP
        </p>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-sm)",
            marginBottom: "12px",
          }}
        >
          Versie: 1.0.0
        </p>
        <button
          type="button"
          onClick={handleExport}
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            fontFamily: "var(--font-condensed)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          Data exporteren (JSON)
        </button>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: "16px",
          background: "none",
          border: "1px solid rgba(232,64,64,0.3)",
          borderRadius: "10px",
          color: "var(--danger)",
          fontFamily: "var(--font-condensed)",
          fontWeight: 700,
          fontSize: "var(--text-base)",
          cursor: "pointer",
        }}
      >
        Uitloggen
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "var(--text-base)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "var(--text-secondary)",
  fontSize: "var(--text-xs)",
  marginBottom: "6px",
  fontFamily: "var(--font-condensed)",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};
