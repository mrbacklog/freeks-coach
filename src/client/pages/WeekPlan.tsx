import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface PlanSession {
  dayOfWeek: number;
  scheduledDate: string;
  name: string;
  durationMinutes: number;
  intensityLabel: string;
  exercises: Array<{ exerciseId: number; name: string; sets: number; reps: string }>;
}

interface Plan {
  blocked: boolean;
  reason?: string;
  weekStart: string;
  sessions: PlanSession[];
  coachExplanation: string;
  personalizationMessages: string[];
  volumeModifier: number;
}

interface SessionRecord {
  id: number;
  scheduled_date: string;
  notes: string;
  completed_at: string | null;
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const months = [
    "jan",
    "feb",
    "mrt",
    "apr",
    "mei",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "dec",
  ];
  return `${start.getDate()}–${end.getDate()} ${months[end.getMonth()]}`;
}

function prevMonday(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function nextMonday(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

const FULL_DAY_NAMES = [
  "",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
];

const MONTH_NAMES = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

export function WeekPlan() {
  const [currentWeek, setCurrentWeek] = useState(getMonday());
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [adherence, setAdherence] = useState<{
    total: number;
    completed: number;
    adherence: number;
  } | null>(null);
  const [goals, setGoals] = useState<Array<{ id: number; title: string; type: string }>>([]);
  const [safetyActive, setSafetyActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coachOpen, setCoachOpen] = useState(true);

  useEffect(() => {
    loadWeek(currentWeek);
  }, [currentWeek]);

  const loadWeek = async (weekStart: string) => {
    setLoading(true);
    setSafetyActive(false);
    setPlan(null);
    try {
      const [planRes, sessionsRes, adherenceRes, goalsRes] = await Promise.all([
        fetch(`/api/plan/${weekStart}`, { credentials: "include" }),
        fetch(`/api/sessions/${weekStart}`, { credentials: "include" }),
        fetch(`/api/plan/adherence/${weekStart}`, { credentials: "include" }),
        fetch("/api/goals", { credentials: "include" }),
      ]);

      const planData = await planRes.json();
      const sessionsData = await sessionsRes.json();
      const adherenceData = await adherenceRes.json();
      const goalsData = await goalsRes.json();

      if (planData.plan) {
        if (planData.plan.blocked) {
          setSafetyActive(true);
        } else {
          setPlan(planData.plan);
        }
      }
      setSessions(sessionsData.sessions || []);
      setAdherence(adherenceData);
      setGoals(goalsData.goals || []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px 16px" }}>
        <p
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
          }}
        >
          Laden...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* Week navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => setCurrentWeek(prevMonday(currentWeek))}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "var(--text-base)",
            padding: "8px",
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
          Week van {formatWeekLabel(currentWeek)}
        </span>
        <button
          type="button"
          onClick={() => setCurrentWeek(nextMonday(currentWeek))}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "var(--text-base)",
            padding: "8px",
          }}
        >
          →
        </button>
      </div>

      <div style={{ padding: "16px 24px" }}>
        {/* Plan-trouw-indicator (EC-3: prominent, never hidden) */}
        {adherence !== null && adherence.total > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Plan-trouw
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  color: "var(--accent)",
                  fontWeight: 700,
                }}
              >
                {adherence.adherence}% ({adherence.completed}/{adherence.total})
              </span>
            </div>
            <div
              style={{
                height: "6px",
                background: "var(--bg-elevated)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${adherence.adherence}%`,
                  background: "var(--accent)",
                  borderRadius: "3px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Safety block (EC-5) */}
        {safetyActive && (
          <div
            style={{
              background: "rgba(232, 64, 64, 0.12)",
              border: "1px solid rgba(232, 64, 64, 0.4)",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-condensed)",
                fontWeight: 700,
                color: "var(--danger)",
                fontSize: "var(--text-lg)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              TRAINING GEPAUZEERD
            </h3>
            <p
              style={{
                color: "var(--text-primary)",
                fontSize: "var(--text-base)",
                lineHeight: "1.6",
              }}
            >
              Je meldt pijn die je beweging beïnvloedt. Alle spring- en krachtoefeningen zijn
              gepauzeerd. Laat dit beoordelen door een fysiotherapeut of arts.
            </p>
          </div>
        )}

        {/* Plan content */}
        {!safetyActive && plan && (
          <>
            {/* Coach explanation (EC-1: always open by default) */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                marginBottom: "20px",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setCoachOpen(!coachOpen)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 700,
                    fontSize: "var(--text-base)",
                    color: "var(--text-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Waarom dit plan?
                </span>
                <span style={{ color: "var(--accent)", fontSize: "16px" }}>
                  {coachOpen ? "▾" : "▸"}
                </span>
              </button>
              {coachOpen && (
                <div style={{ padding: "0 16px 16px" }}>
                  <p
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "var(--text-sm)",
                      lineHeight: "1.7",
                    }}
                  >
                    {plan.coachExplanation}
                  </p>
                  {plan.personalizationMessages.map((msg, i) => (
                    <p
                      // biome-ignore lint/suspicious/noArrayIndexKey: static list, no reorder
                      key={i}
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--text-sm)",
                        lineHeight: "1.7",
                        marginTop: "8px",
                        borderLeft: "2px solid var(--accent)",
                        paddingLeft: "10px",
                      }}
                    >
                      {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Day grid */}
            <div style={{ marginBottom: "20px" }}>
              {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                const planSession = plan.sessions.find((s) => s.dayOfWeek === dayNum);
                const dbSession = sessions.find((s) => {
                  const d = new Date(s.scheduled_date);
                  return d.getDay() === (dayNum === 7 ? 0 : dayNum);
                });
                const isCompleted =
                  dbSession?.completed_at !== null && dbSession?.completed_at !== undefined;

                const weekDate = new Date(currentWeek);
                weekDate.setDate(weekDate.getDate() + dayNum - 1);
                const dateLabel = `${weekDate.getDate()} ${MONTH_NAMES[weekDate.getMonth()]}`;

                return (
                  <div key={dayNum} style={{ marginBottom: "12px" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-condensed)",
                        fontWeight: 700,
                        fontSize: "var(--text-xs)",
                        color: "var(--text-ghost)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                      }}
                    >
                      {FULL_DAY_NAMES[dayNum]} {dateLabel}
                    </p>

                    {planSession ? (
                      dbSession ? (
                        <Link
                          to={`/session/${dbSession.id}`}
                          style={{ display: "block", textDecoration: "none" }}
                        >
                          <div
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border)",
                              borderLeft: "3px solid var(--accent)",
                              borderRadius: "0 12px 12px 0",
                              padding: "14px 16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontFamily: "var(--font-condensed)",
                                  fontWeight: 700,
                                  fontSize: "var(--text-base)",
                                  color: "var(--text-primary)",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                {planSession.name}
                                {isCompleted && " ✓"}
                              </p>
                              <p
                                style={{
                                  fontFamily: "var(--font-mono)",
                                  fontSize: "var(--text-xs)",
                                  color: "var(--text-secondary)",
                                  marginTop: "2px",
                                }}
                              >
                                {planSession.durationMinutes} min · {planSession.intensityLabel}
                              </p>
                            </div>
                            <span style={{ color: "var(--accent)", fontSize: "16px" }}>→</span>
                          </div>
                        </Link>
                      ) : (
                        <div
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                            borderLeft: "3px solid var(--accent)",
                            borderRadius: "0 12px 12px 0",
                            padding: "14px 16px",
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "var(--font-condensed)",
                              fontWeight: 700,
                              fontSize: "var(--text-base)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {planSession.name}
                          </p>
                          <p
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "var(--text-xs)",
                              color: "var(--text-secondary)",
                              marginTop: "2px",
                            }}
                          >
                            {planSession.durationMinutes} min · {planSession.intensityLabel}
                          </p>
                        </div>
                      )
                    ) : (
                      <div
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "10px 14px",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "var(--font-condensed)",
                            fontSize: "var(--text-sm)",
                            color: "var(--text-ghost)",
                          }}
                        >
                          Vrij
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Goal coupling (EC-4) */}
            {goals.length > 0 && (
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-accent)",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 700,
                    fontSize: "var(--text-xs)",
                    color: "var(--accent)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  Doelkoppeling
                </p>
                {goals.map((goal) => (
                  <p
                    key={goal.id}
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "var(--text-sm)",
                      lineHeight: "1.6",
                      marginBottom: "8px",
                      paddingLeft: "10px",
                      borderLeft: "2px solid var(--border-accent)",
                    }}
                  >
                    <strong style={{ color: "var(--text-primary)" }}>{goal.title}:</strong>{" "}
                    {goal.type === "sprint"
                      ? "deze week explosiviteitstraining gepland — direct effect op je sprint."
                      : goal.type === "sprong"
                        ? "plyometrische oefeningen deze week — bouw je springkracht."
                        : "consistent trainen deze week — brengt je doel dichterbij."}
                  </p>
                ))}
              </div>
            )}
          </>
        )}

        {!plan && !safetyActive && (
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-base)",
                marginBottom: "16px",
              }}
            >
              Nog geen weekplan voor deze week.
            </p>
            <Link
              to="/check-in/weekly"
              style={{
                display: "inline-block",
                padding: "14px 24px",
                background: "var(--accent)",
                color: "var(--bg-primary)",
                borderRadius: "10px",
                fontFamily: "var(--font-condensed)",
                fontWeight: 700,
                fontSize: "var(--text-base)",
                textDecoration: "none",
              }}
            >
              Weekcheck-in invullen →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
