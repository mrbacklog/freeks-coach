import { useEffect, useState } from "react";

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function prevWeek(w: string): string {
  const d = new Date(w);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}
function nextWeek(w: string): string {
  const d = new Date(w);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}
function formatWeek(w: string): string {
  const s = new Date(w);
  const e = new Date(w);
  e.setDate(e.getDate() + 6);
  const m = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${s.getDate()}–${e.getDate()} ${m[e.getMonth()]}`;
}

interface DailyCheckIn {
  date: string;
  fatigue_score: number;
  sleep_score: number;
  pain_level: number;
}

interface SessionRecord {
  id: number;
  notes: string;
  completed_at: string;
}

export function History() {
  const [week, setWeek] = useState(getMonday());
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/history?week=${week}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setCheckIns(data.checkIns || []);
        setSessions(data.sessions || []);
      })
      .finally(() => setLoading(false));
  }, [week]);

  const avgFatigue =
    checkIns.length > 0
      ? (checkIns.reduce((s, c) => s + c.fatigue_score, 0) / checkIns.length).toFixed(1)
      : null;
  const avgSleep =
    checkIns.length > 0
      ? (checkIns.reduce((s, c) => s + c.sleep_score, 0) / checkIns.length).toFixed(1)
      : null;

  return (
    <div style={{ padding: "16px" }}>
      <h1
        style={{
          fontFamily: "var(--font-condensed)",
          fontSize: "var(--text-2xl)",
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "0.02em",
          marginBottom: "16px",
        }}
      >
        GESCHIEDENIS
      </h1>

      {/* Week nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          onClick={() => setWeek(prevWeek(week))}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          ←
        </button>
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
          {formatWeek(week)}
        </span>
        <button
          type="button"
          onClick={() => setWeek(nextWeek(week))}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          →
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Laden...</p>
      ) : (
        <>
          {/* Summary */}
          {(avgFatigue || sessions.length > 0) && (
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
                WEEK-SAMENVATTING
              </p>
              <div style={{ display: "flex", gap: "24px" }}>
                <div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xl)",
                      color: "var(--accent)",
                    }}
                  >
                    {sessions.length}
                  </span>
                  <p
                    style={{
                      color: "var(--text-ghost)",
                      fontSize: "var(--text-xs)",
                      fontFamily: "var(--font-condensed)",
                      textTransform: "uppercase",
                    }}
                  >
                    sessies
                  </p>
                </div>
                {avgFatigue && (
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xl)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {avgFatigue}
                    </span>
                    <p
                      style={{
                        color: "var(--text-ghost)",
                        fontSize: "var(--text-xs)",
                        fontFamily: "var(--font-condensed)",
                        textTransform: "uppercase",
                      }}
                    >
                      gem. moeheid
                    </p>
                  </div>
                )}
                {avgSleep && (
                  <div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xl)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {avgSleep}
                    </span>
                    <p
                      style={{
                        color: "var(--text-ghost)",
                        fontSize: "var(--text-xs)",
                        fontFamily: "var(--font-condensed)",
                        textTransform: "uppercase",
                      }}
                    >
                      gem. slaap
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sessions */}
          {sessions.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontWeight: 700,
                  fontSize: "var(--text-xs)",
                  color: "var(--text-ghost)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                }}
              >
                VOLTOOIDE SESSIES
              </p>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    background: "var(--bg-surface)",
                    borderRadius: "10px",
                    marginBottom: "8px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-condensed)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {s.notes}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xs)",
                        color: "var(--text-ghost)",
                        marginTop: "2px",
                      }}
                    >
                      {new Date(s.completed_at).toLocaleDateString("nl-NL")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {checkIns.length === 0 && sessions.length === 0 && (
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "32px" }}>
              Geen data voor deze week.
            </p>
          )}
        </>
      )}
    </div>
  );
}
