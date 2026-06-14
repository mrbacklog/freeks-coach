import { useState } from "react";
import { useNavigate } from "react-router-dom";

type PainLevel = 0 | 1 | 2 | 3;
type PainLocation = "knie_l" | "knie_r" | "hiel_l" | "hiel_r" | "rug" | "anders";

export function DailyCheckIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sleepScore, setSleepScore] = useState<number | null>(null);
  const [fatigueScore, setFatigueScore] = useState<number | null>(null);
  const [painLevel, setPainLevel] = useState<PainLevel | null>(null);
  const [painLocation, setPainLocation] = useState<PainLocation | null>(null);
  const [painAffectsMovement, setPainAffectsMovement] = useState<boolean | null>(null);
  const [motivationScore, setMotivationScore] = useState<number | null>(null);
  const [safetyBlock, setSafetyBlock] = useState(false);
  const [summary, setSummary] = useState<{ fatigue: number; sleep: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSleep = (score: number) => {
    setSleepScore(score);
    setStep(2);
  };

  const handleFatigue = (score: number) => {
    setFatigueScore(score);
    setStep(3);
  };

  const handlePain = (level: PainLevel) => {
    setPainLevel(level);
    if (level <= 1) {
      setStep(4);
    }
  };

  const handleMotivation = async (score: number) => {
    setMotivationScore(score);
    setSubmitting(true);
    try {
      const res = await fetch("/api/check-in/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sleepScore,
          fatigueScore,
          painLevel,
          painLocation,
          painAffectsMovement,
          motivationScore: score,
        }),
      });
      const data = await res.json();
      if (data.safetyBlock) {
        setSafetyBlock(true);
      } else {
        setSummary(data.summary);
        setTimeout(() => navigate("/"), 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (safetyBlock) {
    return <SafetyBlockScreen />;
  }

  if (summary) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
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
            marginBottom: "24px",
            animation: "pulse 0.4s ease-out",
          }}
        >
          <span style={{ fontSize: "32px", color: "var(--accent)" }}>✓</span>
        </div>
        <h2
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "var(--text-xl)",
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          Check-in opgeslagen
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          Vermoeidheid: {summary.fatigue}/10
        </p>
      </div>
    );
  }

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
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "var(--text-base)",
          }}
        >
          ×
        </button>
        <span
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Stap {step} van 4
        </span>
        <div style={{ width: "24px" }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "48px 24px 32px", display: "flex", flexDirection: "column" }}>
        {step === 1 && (
          <div>
            <h2 style={questionStyle}>Hoe heb je geslapen?</h2>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "48px",
                justifyContent: "center",
              }}
            >
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => handleSleep(score)}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: sleepScore === score ? "var(--accent-glow)" : "var(--bg-elevated)",
                    border:
                      sleepScore === score ? "2px solid var(--accent)" : "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={`Slaapkwaliteit ${score}`}
                >
                  {["🌑", "🌒", "🌓", "🌔", "🌕"][score - 1]}
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px",
                padding: "0 8px",
              }}
            >
              <span style={{ color: "var(--text-ghost)", fontSize: "var(--text-xs)" }}>Slecht</span>
              <span style={{ color: "var(--text-ghost)", fontSize: "var(--text-xs)" }}>Goed</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={questionStyle}>Hoe moe ben je nu?</h2>
            <div style={{ display: "flex", gap: "4px", marginTop: "48px" }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                const t = (score - 1) / 9;
                const r = Math.round(61 + (232 - 61) * t);
                const g = Math.round(186 + (64 - 186) * t);
                const b = Math.round(122 + (64 - 122) * t);
                const color = `rgb(${r}, ${g}, ${b})`;
                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => handleFatigue(score)}
                    style={{
                      flex: 1,
                      height: "48px",
                      background: fatigueScore === score ? color : `${color}33`,
                      border:
                        fatigueScore === score ? `2px solid ${color}` : "1px solid var(--border)",
                      borderRadius: "6px",
                      color: fatigueScore === score ? "#fff" : "var(--text-ghost)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xs)",
                      fontWeight: fatigueScore === score ? 700 : 400,
                      cursor: "pointer",
                    }}
                    aria-label={`Vermoeidheid ${score}`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <span
                style={{
                  color: "var(--success)",
                  fontSize: "var(--text-xs)",
                  fontFamily: "var(--font-condensed)",
                }}
              >
                FRIS
              </span>
              <span
                style={{
                  color: "var(--danger)",
                  fontSize: "var(--text-xs)",
                  fontFamily: "var(--font-condensed)",
                }}
              >
                UITGEPUT
              </span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={questionStyle}>Heb je ergens last van?</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginTop: "32px",
              }}
            >
              {(
                [
                  { level: 0 as PainLevel, label: "Nee" },
                  { level: 1 as PainLevel, label: "Lichte klacht" },
                  { level: 2 as PainLevel, label: "Matige klacht" },
                  { level: 3 as PainLevel, label: "Ernstige klacht" },
                ] as const
              ).map(({ level, label }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handlePain(level)}
                  style={{
                    padding: "20px 16px",
                    background:
                      painLevel === level
                        ? level >= 2
                          ? "rgba(232,64,64,0.1)"
                          : "var(--accent-glow)"
                        : "var(--bg-elevated)",
                    border:
                      painLevel === level
                        ? `2px solid ${level >= 2 ? "var(--danger)" : "var(--accent)"}`
                        : "1px solid var(--border)",
                    borderRadius: "12px",
                    color:
                      level >= 2
                        ? painLevel === level
                          ? "var(--danger)"
                          : "var(--text-secondary)"
                        : "var(--text-primary)",
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 600,
                    fontSize: "var(--text-base)",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                    textAlign: "center",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Follow-up for moderate/severe pain */}
            {painLevel !== null && painLevel >= 2 && (
              <div style={{ marginTop: "24px", animation: "slideDown 0.2s ease-out" }}>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-sm)",
                    marginBottom: "12px",
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Waar?
                </p>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}
                >
                  {(
                    [
                      { key: "knie_l" as PainLocation, label: "Knie L" },
                      { key: "knie_r" as PainLocation, label: "Knie R" },
                      { key: "hiel_l" as PainLocation, label: "Hiel L" },
                      { key: "hiel_r" as PainLocation, label: "Hiel R" },
                      { key: "rug" as PainLocation, label: "Rug" },
                      { key: "anders" as PainLocation, label: "Anders" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPainLocation(key)}
                      style={{
                        padding: "8px 14px",
                        background:
                          painLocation === key ? "var(--accent-glow)" : "var(--bg-elevated)",
                        border:
                          painLocation === key
                            ? "1px solid var(--accent)"
                            : "1px solid var(--border)",
                        borderRadius: "8px",
                        color: painLocation === key ? "var(--accent)" : "var(--text-secondary)",
                        fontFamily: "var(--font-condensed)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-sm)",
                    marginBottom: "12px",
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Beïnvloedt dit je beweging?
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                  {[true, false].map((affects) => (
                    <button
                      key={String(affects)}
                      type="button"
                      onClick={() => {
                        setPainAffectsMovement(affects);
                        setStep(4);
                      }}
                      style={{
                        flex: 1,
                        padding: "14px",
                        background:
                          painAffectsMovement === affects
                            ? affects
                              ? "rgba(232,64,64,0.1)"
                              : "var(--accent-glow)"
                            : "var(--bg-elevated)",
                        border:
                          painAffectsMovement === affects
                            ? `2px solid ${affects ? "var(--danger)" : "var(--accent)"}`
                            : "1px solid var(--border)",
                        borderRadius: "10px",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-condensed)",
                        fontWeight: 600,
                        fontSize: "var(--text-base)",
                        cursor: "pointer",
                      }}
                    >
                      {affects ? "Ja" : "Nee"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={questionStyle}>Hoe gemotiveerd ben je om te trainen?</h2>
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "48px",
                justifyContent: "center",
              }}
            >
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => !submitting && handleMotivation(score)}
                  disabled={submitting}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background:
                      motivationScore === score ? "var(--accent-glow)" : "var(--bg-elevated)",
                    border:
                      motivationScore === score
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "24px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: submitting ? 0.5 : 1,
                  }}
                  aria-label={`Motivatie ${score}`}
                >
                  🔥
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px",
                padding: "0 8px",
              }}
            >
              <span style={{ color: "var(--text-ghost)", fontSize: "var(--text-xs)" }}>Laag</span>
              <span style={{ color: "var(--text-ghost)", fontSize: "var(--text-xs)" }}>Hoog</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SafetyBlockScreen() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: "rgba(232, 64, 64, 0.12)",
          border: "1px solid rgba(232, 64, 64, 0.4)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-condensed)",
            fontSize: "var(--text-xl)",
            color: "var(--danger)",
            fontWeight: 700,
            marginBottom: "16px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          TRAINING GEPAUZEERD
        </h2>
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

      <button
        type="button"
        onClick={() => navigate("/exercises?category=herstel")}
        style={{
          width: "100%",
          padding: "16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          color: "var(--text-primary)",
          fontFamily: "var(--font-condensed)",
          fontWeight: 600,
          fontSize: "var(--text-base)",
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        Mobiliteit & herstel-oefeningen bekijken →
      </button>

      <button
        type="button"
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          fontSize: "var(--text-sm)",
          cursor: "pointer",
        }}
      >
        Terug naar thuisscherm
      </button>
    </div>
  );
}

const questionStyle: React.CSSProperties = {
  fontFamily: "var(--font-condensed)",
  fontSize: "var(--text-xl)",
  fontWeight: 700,
  color: "var(--text-primary)",
  letterSpacing: "0.02em",
  lineHeight: "1.3",
};
