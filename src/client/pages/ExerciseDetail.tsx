import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Exercise {
  id: number;
  name: string;
  category: string;
  description: string;
  safety_cue: string;
  korfbal_context: string;
  difficulty: string;
  is_bilateral: number;
  phv_safety: string;
  sets: number;
  reps: string;
  rest_seconds: number;
}

export function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/exercises/${id}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setExercise(data.exercise))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading)
    return <div style={{ padding: "24px", color: "var(--text-secondary)" }}>Laden...</div>;
  if (!exercise)
    return (
      <div style={{ padding: "24px", color: "var(--text-secondary)" }}>Oefening niet gevonden.</div>
    );

  return (
    <div style={{ padding: "16px" }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "pointer",
          marginBottom: "20px",
          fontSize: "var(--text-sm)",
        }}
      >
        ← Terug
      </button>

      <h1
        style={{
          fontFamily: "var(--font-condensed)",
          fontSize: "var(--text-2xl)",
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: "4px",
        }}
      >
        {exercise.name}
      </h1>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "var(--text-sm)",
          fontFamily: "var(--font-condensed)",
          fontWeight: 600,
          textTransform: "capitalize",
          marginBottom: "20px",
        }}
      >
        {exercise.category} · {exercise.difficulty}
        {exercise.is_bilateral ? " · Bilateraal" : ""}
      </p>

      {/* Safety cue - prominent (from design spec) */}
      {exercise.safety_cue && (
        <div
          style={{
            background: "rgba(240,160,48,0.15)",
            borderLeft: "3px solid var(--warning)",
            borderRadius: "0 8px 8px 0",
            padding: "12px 14px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              fontSize: "var(--text-xs)",
              color: "var(--warning)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            VEILIGHEID
          </p>
          <p
            style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)", lineHeight: "1.6" }}
          >
            {exercise.safety_cue}
          </p>
        </div>
      )}

      {/* Instruction */}
      {exercise.description && (
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            INSTRUCTIE
          </p>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--text-base)",
              lineHeight: "1.7",
            }}
          >
            {exercise.description}
          </p>
        </div>
      )}

      {/* Korfbal context */}
      {exercise.korfbal_context && (
        <div
          style={{
            marginBottom: "20px",
            paddingLeft: "10px",
            borderLeft: "2px solid var(--accent-dim)",
          }}
        >
          <p
            style={{
              color: "var(--accent-dim)",
              fontSize: "var(--text-sm)",
              fontStyle: "italic",
              lineHeight: "1.6",
            }}
          >
            {exercise.korfbal_context}
          </p>
        </div>
      )}

      {/* Default schema */}
      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "16px",
          display: "flex",
          gap: "24px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-metric)",
              color: "var(--text-primary)",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {exercise.sets}
          </p>
          <p
            style={{
              color: "var(--text-ghost)",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-condensed)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            sets
          </p>
        </div>
        <div style={{ width: "1px", background: "var(--border)" }} />
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-metric)",
              color: "var(--text-primary)",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {exercise.reps}
          </p>
          <p
            style={{
              color: "var(--text-ghost)",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-condensed)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            herh.
          </p>
        </div>
        <div style={{ width: "1px", background: "var(--border)" }} />
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-metric)",
              color: "var(--text-primary)",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {exercise.rest_seconds}
          </p>
          <p
            style={{
              color: "var(--text-ghost)",
              fontSize: "var(--text-xs)",
              fontFamily: "var(--font-condensed)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            sec pauze
          </p>
        </div>
      </div>

      {/* PHV status */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--bg-elevated)",
          borderRadius: "8px",
          border: `1px solid ${exercise.phv_safety === "allowed" ? "rgba(61,186,122,0.3)" : exercise.phv_safety === "caution" ? "rgba(240,160,48,0.3)" : "rgba(232,64,64,0.3)"}`,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            color:
              exercise.phv_safety === "allowed"
                ? "var(--success)"
                : exercise.phv_safety === "caution"
                  ? "var(--warning)"
                  : "var(--danger)",
          }}
        >
          PHV-status:{" "}
          {exercise.phv_safety === "allowed"
            ? "✓ Toegestaan tijdens groeipiek"
            : exercise.phv_safety === "caution"
              ? "⚠ Voorzichtig tijdens groeipiek"
              : "✗ Vermijd tijdens groeipiek"}
        </p>
      </div>
    </div>
  );
}
