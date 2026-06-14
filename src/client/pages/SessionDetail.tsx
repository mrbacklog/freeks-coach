import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Exercise {
  id: number;
  name: string;
  description: string;
  safety_cue: string;
  korfbal_context: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  plannedSets: number;
  plannedReps: string;
}

interface Session {
  id: number;
  notes: string;
  scheduled_date: string;
  completed_at: string | null;
}

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<number, boolean[]>>({});
  const [completing, setCompleting] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/session/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setSession(data.session);
        setExercises(data.exercises || []);
        // Initialize set tracking
        const initial: Record<number, boolean[]> = {};
        for (const ex of data.exercises || []) {
          initial[ex.id] = Array(ex.plannedSets || ex.sets).fill(false);
        }
        setCompletedSets(initial);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSet = (exerciseId: number, setIndex: number) => {
    setCompletedSets((prev) => {
      const sets = [...(prev[exerciseId] || [])];
      sets[setIndex] = !sets[setIndex];
      return { ...prev, [exerciseId]: sets };
    });
  };

  const allSetsComplete = () => {
    return exercises.every((ex) => {
      const sets = completedSets[ex.id] || [];
      const targetSets = ex.plannedSets || ex.sets;
      return sets.slice(0, targetSets).every(Boolean);
    });
  };

  const handleComplete = async () => {
    if (!id) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/session/${id}/complete`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setCompletionMessage(data.message || "Klaar. Je lichaam wordt sterker dan gisteren.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "24px 16px", color: "var(--text-secondary)" }}>Laden...</div>;
  }

  if (completionMessage) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        {/* Completion animation */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--accent-glow)",
            border: "2px solid var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: "32px", color: "var(--accent)" }}>✓</span>
        </div>
        <h2
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            textAlign: "center",
            marginBottom: "12px",
            letterSpacing: "0.02em",
            maxWidth: "300px",
          }}
        >
          {completionMessage}
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-sm)",
            marginBottom: "48px",
          }}
        >
          {session?.notes || "Training"} afgerond
        </p>
        <button
          type="button"
          onClick={() => navigate("/week")}
          style={{
            padding: "16px 32px",
            background: "var(--accent)",
            color: "var(--bg-primary)",
            border: "none",
            borderRadius: "10px",
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-base)",
            letterSpacing: "0.04em",
            cursor: "pointer",
          }}
        >
          Terug naar weekplan
        </button>
      </div>
    );
  }

  if (!session || exercises.length === 0) {
    return (
      <div style={{ padding: "24px 16px" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          ← Terug
        </button>
        <p style={{ color: "var(--text-secondary)" }}>
          Sessie niet gevonden of geen oefeningen beschikbaar.
        </p>
        <p style={{ color: "var(--text-ghost)", fontSize: "var(--text-sm)", marginTop: "8px" }}>
          Session ID: {id}
        </p>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const currentSets = completedSets[currentExercise?.id] || [];
  const targetSets = currentExercise?.plannedSets || currentExercise?.sets || 3;
  const totalExercises = exercises.length;
  const completedExercises = exercises.filter((ex) => {
    const sets = completedSets[ex.id] || [];
    const target = ex.plannedSets || ex.sets;
    return sets.slice(0, target).every(Boolean) && sets.length > 0;
  }).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {session.notes || "Training"}
        </span>
        <button
          type="button"
          onClick={() => navigate("/week")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "20px",
          }}
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
            }}
          >
            {completedExercises}/{totalExercises} oefeningen
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--accent)",
            }}
          >
            {Math.round((completedExercises / totalExercises) * 100)}%
          </span>
        </div>
        <div style={{ height: "4px", background: "var(--bg-elevated)", borderRadius: "2px" }}>
          <div
            style={{
              height: "100%",
              width: `${(completedExercises / totalExercises) * 100}%`,
              background: "var(--accent)",
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Exercise content */}
      <div style={{ flex: 1, padding: "24px 16px", overflowY: "auto" }}>
        {/* Exercise name */}
        <h2
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-2xl)",
            color: "var(--text-primary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          {currentExercise?.name}
        </h2>

        {/* Safety cue (prominent) */}
        {currentExercise?.safety_cue && (
          <div
            style={{
              background: "rgba(240, 160, 48, 0.15)",
              borderLeft: "3px solid var(--warning)",
              borderRadius: "0 8px 8px 0",
              padding: "12px 14px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                color: "var(--text-primary)",
                fontSize: "var(--text-sm)",
                lineHeight: "1.6",
              }}
            >
              {currentExercise.safety_cue}
            </p>
          </div>
        )}

        {/* Description */}
        {currentExercise?.description && (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--text-sm)",
              lineHeight: "1.7",
              marginBottom: "16px",
            }}
          >
            {currentExercise.description}
          </p>
        )}

        {/* Korfbal context */}
        {currentExercise?.korfbal_context && (
          <p
            style={{
              color: "var(--accent-dim)",
              fontSize: "var(--text-sm)",
              fontStyle: "italic",
              lineHeight: "1.6",
              marginBottom: "24px",
              paddingLeft: "10px",
              borderLeft: "2px solid var(--accent-dim)",
            }}
          >
            {currentExercise.korfbal_context}
          </p>
        )}

        {/* Sets/reps info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
            padding: "12px 16px",
            background: "var(--bg-elevated)",
            borderRadius: "10px",
            border: "1px solid var(--border)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--text-primary)",
            }}
          >
            {targetSets} sets × {currentExercise?.plannedReps || currentExercise?.reps}
          </span>
          <span style={{ color: "var(--border)", fontSize: "16px" }}>|</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            {currentExercise?.rest_seconds}s pauze
          </span>
        </div>

        {/* Set tracking */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
          {Array.from({ length: targetSets }, (_, i) => (
            <button
              key={`set-${i + 1}`}
              type="button"
              onClick={() => currentExercise && toggleSet(currentExercise.id, i)}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: currentSets[i] ? "var(--accent)" : "var(--bg-elevated)",
                border: currentSets[i] ? "2px solid var(--accent)" : "2px solid var(--border)",
                color: currentSets[i] ? "var(--bg-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-condensed)",
                fontWeight: 700,
                fontSize: "var(--text-sm)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              aria-label={`Set ${i + 1} ${currentSets[i] ? "voltooid" : "niet voltooid"}`}
            >
              {currentSets[i] ? "✓" : `${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation and complete button */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={() => setCurrentExerciseIndex((i) => Math.max(0, i - 1))}
            disabled={currentExerciseIndex === 0}
            style={{
              flex: 1,
              padding: "14px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: currentExerciseIndex === 0 ? "var(--text-ghost)" : "var(--text-secondary)",
              fontFamily: "var(--font-condensed)",
              fontWeight: 600,
              fontSize: "var(--text-base)",
              cursor: currentExerciseIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Vorige
          </button>
          <button
            type="button"
            onClick={() => setCurrentExerciseIndex((i) => Math.min(exercises.length - 1, i + 1))}
            disabled={currentExerciseIndex === exercises.length - 1}
            style={{
              flex: 1,
              padding: "14px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color:
                currentExerciseIndex === exercises.length - 1
                  ? "var(--text-ghost)"
                  : "var(--text-primary)",
              fontFamily: "var(--font-condensed)",
              fontWeight: 600,
              fontSize: "var(--text-base)",
              cursor: currentExerciseIndex === exercises.length - 1 ? "not-allowed" : "pointer",
            }}
          >
            Volgende →
          </button>
        </div>

        {allSetsComplete() && (
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            style={{
              width: "100%",
              padding: "18px",
              background: completing ? "var(--bg-elevated)" : "var(--accent)",
              color: completing ? "var(--text-ghost)" : "var(--bg-primary)",
              border: "none",
              borderRadius: "10px",
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "0.04em",
              cursor: completing ? "not-allowed" : "pointer",
            }}
          >
            {completing ? "Bezig..." : "Sessie afronden"}
          </button>
        )}
      </div>
    </div>
  );
}
