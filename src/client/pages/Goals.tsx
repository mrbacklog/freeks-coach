import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Goal {
  id: number;
  title: string;
  type: string;
  target_value: string | null;
  target_date: string | null;
  created_at: string;
  achieved_at: string | null;
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achieved, setAchieved] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoals = async () => {
      const res = await fetch("/api/goals", { credentials: "include" });
      const data = await res.json();
      setGoals(data.goals || []);
      setAchieved(data.achieved || []);
      setLoading(false);
    };
    loadGoals();
  }, []);

  if (loading)
    return <div style={{ padding: "24px", color: "var(--text-secondary)" }}>Laden...</div>;

  return (
    <div style={{ padding: "16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "0.02em",
          }}
        >
          DOELEN
        </h1>
        <Link
          to="/goals/new"
          style={{
            padding: "10px 16px",
            background: "var(--accent)",
            color: "var(--bg-primary)",
            borderRadius: "8px",
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-sm)",
            letterSpacing: "0.04em",
            textDecoration: "none",
          }}
        >
          + Doel
        </Link>
      </div>

      {goals.length === 0 && achieved.length === 0 && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
            Nog geen doelen. Stel je eerste doel in.
          </p>
          <Link
            to="/goals/new"
            style={{
              padding: "12px 24px",
              background: "var(--accent)",
              color: "var(--bg-primary)",
              borderRadius: "8px",
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
              textDecoration: "none",
            }}
          >
            Nieuw doel →
          </Link>
        </div>
      )}

      {goals.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
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
            ACTIEVE DOELEN
          </p>
          {goals.map((goal) => (
            <Link
              key={goal.id}
              to={`/goals/${goal.id}`}
              style={{ display: "block", textDecoration: "none", marginBottom: "10px" }}
            >
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px",
                  transition: "border-color 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-condensed)",
                      fontWeight: 700,
                      fontSize: "var(--text-base)",
                      color: "var(--text-primary)",
                      letterSpacing: "0.02em",
                      flex: 1,
                    }}
                  >
                    {goal.title}
                  </p>
                  <span
                    style={{
                      fontFamily: "var(--font-condensed)",
                      fontSize: "var(--text-xs)",
                      color: "var(--accent)",
                      background: "var(--accent-glow)",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      marginLeft: "8px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {goal.type}
                  </span>
                </div>
                {goal.target_date && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xs)",
                      color: "var(--text-ghost)",
                      marginTop: "4px",
                    }}
                  >
                    Deadline: {goal.target_date}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {achieved.length > 0 && (
        <div>
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
            BEHAALDE DOELEN
          </p>
          {achieved.map((goal) => (
            <div
              key={goal.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background: "var(--bg-elevated)",
                borderRadius: "10px",
                marginBottom: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ color: "var(--success)", fontWeight: 700, fontSize: "16px" }}>✓</span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-sm)",
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 600,
                  }}
                >
                  {goal.title}
                </p>
                {goal.achieved_at && (
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xs)",
                      color: "var(--text-ghost)",
                      marginTop: "2px",
                    }}
                  >
                    Behaald op {new Date(goal.achieved_at).toLocaleDateString("nl-NL")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
