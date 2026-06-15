import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function GoalEdit() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new";

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"sprint" | "sprong" | "algemeen">("algemeen");
  const [metric, setMetric] = useState<string | null>(null);
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && id) {
      fetch(`/api/goals/${id}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (data.goal) {
            setTitle(data.goal.title || "");
            setType(data.goal.type || "algemeen");
            setMetric(data.goal.metric || null);
            setTargetValue(data.goal.target_value || "");
            setTargetDate(data.goal.target_date || "");
            setNotes(data.goal.notes || "");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, type, metric, targetValue, targetDate, notes }),
        });
      } else {
        await fetch(`/api/goals/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, type, metric, targetValue, targetDate, notes }),
        });
      }
      navigate("/goals");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE", credentials: "include" });
    navigate("/goals");
  };

  if (loading)
    return <div style={{ padding: "24px", color: "var(--text-secondary)" }}>Laden...</div>;

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button
          type="button"
          onClick={() => navigate("/goals")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "var(--text-base)",
          }}
        >
          ← Doelen
        </button>
        <h1
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "0.02em",
          }}
        >
          {isNew ? "NIEUW DOEL" : "DOEL BEWERKEN"}
        </h1>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="goal-title" style={labelStyle}>
          Titel
        </label>
        <input
          id="goal-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="bijv. 10m sprint onder 1.65s"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="goal-type" style={labelStyle}>
          Type doel
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["sprint", "sprong", "algemeen"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: "12px",
                background: type === t ? "var(--accent)" : "var(--bg-elevated)",
                color: type === t ? "var(--bg-primary)" : "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontFamily: "var(--font-condensed)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            marginBottom: "6px",
            color: "var(--text-secondary)",
          }}
        >
          Koppel aan meting (optioneel)
        </label>
        <select
          value={metric ?? ""}
          onChange={(e) =>
            setMetric(e.target.value || null)
          }
          style={{
            width: "100%",
            padding: "12px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontSize: "var(--text-base)",
          }}
        >
          <option value="">Geen specifieke meting</option>
          <option value="sprong">Verticale sprong</option>
          <option value="sprint">10m sprint</option>
          <option value="balans">Balans</option>
          <option value="eenbenige_sprong">Eenbenige sprong</option>
          <option value="medbalworp">Medball-worp</option>
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="goal-target-value" style={labelStyle}>
          Streefwaarde (optioneel)
        </label>
        <input
          id="goal-target-value"
          type="text"
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
          placeholder="bijv. 1.65"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="goal-target-date" style={labelStyle}>
          Streefdatum (optioneel)
        </label>
        <input
          id="goal-target-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label htmlFor="goal-notes" style={labelStyle}>
          Notitie (optioneel)
        </label>
        <textarea
          id="goal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...inputStyle, height: "80px", resize: "none" }}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!title || saving}
        style={{
          width: "100%",
          padding: "16px",
          background: title && !saving ? "var(--accent)" : "var(--bg-elevated)",
          color: title && !saving ? "var(--bg-primary)" : "var(--text-ghost)",
          border: "none",
          borderRadius: "10px",
          fontFamily: "var(--font-condensed)",
          fontWeight: 700,
          fontSize: "var(--text-base)",
          letterSpacing: "0.04em",
          cursor: title && !saving ? "pointer" : "not-allowed",
          marginBottom: "12px",
        }}
      >
        {saving ? "Opslaan..." : "Opslaan"}
      </button>

      {!isNew && (
        <button
          type="button"
          onClick={handleDelete}
          style={{
            display: "block",
            width: "100%",
            background: "none",
            border: "none",
            color: "var(--danger)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            padding: "8px 0",
            textAlign: "center",
          }}
        >
          Doel verwijderen
        </button>
      )}
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
  fontSize: "var(--text-sm)",
  marginBottom: "8px",
  fontFamily: "var(--font-condensed)",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};
