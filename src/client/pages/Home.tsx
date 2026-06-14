import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface HomeData {
  state: "A" | "B" | "C" | "D" | "E";
  user?: { name: string; birth_date: string };
  plan?: {
    weekStart: string;
    sessions: Array<{
      id: number;
      day_of_week: string;
      notes: string;
      completed_at: string | null;
    }>;
    personalizationMessages: string[];
    adherencePercent: number;
  };
  todaySession?: { id: number; notes: string; day_of_week: string };
  lastCheckIn?: { fatigue_score: number; sleep_score: number };
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const first = name.split(" ")[0];
  if (hour < 12) return `Goedemorgen, ${first}.`;
  if (hour < 17) return `Goedemiddag, ${first}.`;
  return `Goedenavond, ${first}.`;
}

export function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/home/state", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.state === "D") {
          navigate("/onboarding");
          return;
        }
        setData(d);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading)
    return (
      <div
        style={{
          padding: "24px",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-condensed)",
          letterSpacing: "0.04em",
        }}
      >
        LADEN...
      </div>
    );

  if (!data) return null;

  return (
    <div style={{ padding: "16px" }}>
      {/* Greeting */}
      {data.user && (
        <p
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "20px",
            letterSpacing: "0.02em",
          }}
        >
          {getGreeting(data.user.name)}
        </p>
      )}

      {/* State E: Safety block */}
      {data.state === "E" && <SafetyBlockState />}

      {/* State A: Daily check-in needed */}
      {data.state === "A" && <DailyCheckInState />}

      {/* State B: Weekly check-in needed */}
      {data.state === "B" && <WeeklyCheckInState />}

      {/* State C: Plan active */}
      {data.state === "C" && data.plan && (
        <PlanActiveState
          plan={data.plan}
          todaySession={data.todaySession}
          lastCheckIn={data.lastCheckIn}
        />
      )}
    </div>
  );
}

function SafetyBlockState() {
  return (
    <div
      style={{
        background: "rgba(232,64,64,0.12)",
        border: "1px solid rgba(232,64,64,0.3)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-condensed)",
          fontWeight: 700,
          fontSize: "var(--text-lg)",
          color: "var(--danger)",
          letterSpacing: "0.04em",
          marginBottom: "12px",
        }}
      >
        TRAININGSSCHEMA GEPAUZEERD
      </p>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "var(--text-sm)",
          lineHeight: "1.7",
          marginBottom: "16px",
        }}
      >
        Je meldt pijn die je beweging beïnvloedt. Alle spring- en krachtoefeningen zijn gepauzeerd.
        Laat dit beoordelen door een fysiotherapeut of arts.
      </p>
      <p
        style={{
          fontFamily: "var(--font-condensed)",
          fontWeight: 600,
          fontSize: "var(--text-xs)",
          color: "var(--text-ghost)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        Doe vandaag lichte herstelactiviteiten indien pijnvrij.
      </p>
    </div>
  );
}

function DailyCheckInState() {
  return (
    <div>
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-accent)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "16px",
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
            marginBottom: "8px",
          }}
        >
          DAGELIJKSE CHECK-IN
        </p>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-sm)",
            marginBottom: "20px",
            lineHeight: "1.6",
          }}
        >
          Hoe voel je je vandaag? Even 30 seconden — dan weet je schema hoe het met je gaat.
        </p>
        <Link
          to="/check-in/daily"
          style={{
            display: "block",
            padding: "14px",
            background: "var(--accent)",
            color: "var(--bg-primary)",
            borderRadius: "10px",
            textAlign: "center",
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-base)",
            letterSpacing: "0.04em",
            textDecoration: "none",
          }}
        >
          Check-in starten →
        </Link>
      </div>
    </div>
  );
}

function WeeklyCheckInState() {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-accent)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "16px",
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
          marginBottom: "8px",
        }}
      >
        WEKELIJKSE EVALUATIE
      </p>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "var(--text-sm)",
          marginBottom: "20px",
          lineHeight: "1.6",
        }}
      >
        De week is voorbij. Evalueer hoe het ging en genereer je schema voor volgende week.
      </p>
      <Link
        to="/check-in/weekly"
        style={{
          display: "block",
          padding: "14px",
          background: "var(--accent)",
          color: "var(--bg-primary)",
          borderRadius: "10px",
          textAlign: "center",
          fontFamily: "var(--font-condensed)",
          fontWeight: 700,
          fontSize: "var(--text-base)",
          letterSpacing: "0.04em",
          textDecoration: "none",
        }}
      >
        Week evalueren →
      </Link>
    </div>
  );
}

interface PlanActiveStateProps {
  plan: NonNullable<HomeData["plan"]>;
  todaySession?: HomeData["todaySession"];
  lastCheckIn?: HomeData["lastCheckIn"];
}

function PlanActiveState({ plan, todaySession, lastCheckIn }: PlanActiveStateProps) {
  const completed = plan.sessions.filter((s) => s.completed_at).length;
  const total = plan.sessions.length;

  return (
    <div>
      {/* Today's session */}
      {todaySession ? (
        <Link
          to={`/session/${todaySession.id}`}
          style={{ display: "block", textDecoration: "none", marginBottom: "16px" }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              borderLeft: "3px solid var(--accent)",
              borderRadius: "0 12px 12px 0",
              padding: "20px",
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
                marginBottom: "6px",
              }}
            >
              VANDAAG
            </p>
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                fontWeight: 700,
                fontSize: "var(--text-lg)",
                color: "var(--text-primary)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              {todaySession.notes}
            </p>
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                color: "var(--accent)",
                marginTop: "12px",
                letterSpacing: "0.02em",
              }}
            >
              Sessie starten →
            </p>
          </div>
        </Link>
      ) : (
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
              marginBottom: "4px",
            }}
          >
            VANDAAG
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            Rustdag — geen training gepland.
          </p>
        </div>
      )}

      {/* Plan adherence */}
      {total > 0 && (
        <div
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                fontWeight: 600,
                fontSize: "var(--text-xs)",
                color: "var(--text-ghost)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              PLAN-TROUW DEZE WEEK
            </p>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              {completed}/{total}
            </span>
          </div>
          <div
            style={{
              height: "4px",
              background: "var(--bg-primary)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${plan.adherencePercent}%`,
                background: "var(--accent)",
                borderRadius: "2px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Coach messages (EC-1) */}
      {plan.personalizationMessages && plan.personalizationMessages.length > 0 && (
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
              marginBottom: "10px",
            }}
          >
            COACH
          </p>
          {plan.personalizationMessages.map((msg) => (
            <p
              key={msg}
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                lineHeight: "1.7",
                marginBottom: "8px",
              }}
            >
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Last check-in quick stats */}
      {lastCheckIn && (
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <div
            style={{
              flex: 1,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xl)",
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {lastCheckIn.fatigue_score}
            </p>
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "var(--text-xs)",
                color: "var(--text-ghost)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginTop: "4px",
              }}
            >
              Moeheid
            </p>
          </div>
          <div
            style={{
              flex: 1,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xl)",
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {lastCheckIn.sleep_score}
            </p>
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "var(--text-xs)",
                color: "var(--text-ghost)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginTop: "4px",
              }}
            >
              Slaap
            </p>
          </div>
          <div
            style={{
              flex: 1,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <Link to="/check-in/daily" style={{ textDecoration: "none" }}>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xl)",
                  color: "var(--accent)",
                  lineHeight: 1,
                }}
              >
                +
              </p>
              <p
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-ghost)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginTop: "4px",
                }}
              >
                Check-in
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Week nav shortcut */}
      <Link
        to="/week"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          textDecoration: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-condensed)",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            letterSpacing: "0.02em",
          }}
        >
          Bekijk weekschema
        </span>
        <span style={{ color: "var(--text-ghost)" }}>→</span>
      </Link>
    </div>
  );
}
