import { useState } from "react";
import { useNavigate } from "react-router-dom";

type ActivityType =
  | "korfbal_training"
  | "korfbal_wedstrijd"
  | "toernooi"
  | "schoolsport"
  | "toetsweek"
  | "rust"
  | "andere_sport";

interface Activity {
  dayOfWeek: string;
  type: ActivityType;
  rpe: number;
  durationMinutes: number;
}

const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const DAY_LABELS: Record<string, string> = {
  ma: "Maandag",
  di: "Dinsdag",
  wo: "Woensdag",
  do: "Donderdag",
  vr: "Vrijdag",
  za: "Zaterdag",
  zo: "Zondag",
};
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  korfbal_training: "Korfbal training",
  korfbal_wedstrijd: "Korfbal wedstrijd",
  toernooi: "Toernooi",
  schoolsport: "Schoolsport",
  toetsweek: "Toetsweek",
  rust: "Rust",
  andere_sport: "Andere sport",
};

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getNextMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=sun, 1=mon, ..., 6=sat
  // Days until next Monday: mon=7, tue=6, ..., sun=1
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().split("T")[0];
}

const questionStyle: React.CSSProperties = {
  fontFamily: "var(--font-condensed)",
  fontSize: "var(--text-xl)",
  fontWeight: 700,
  color: "var(--text-primary)",
  letterSpacing: "0.02em",
  lineHeight: "1.3",
};

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

const primaryBtnStyle: React.CSSProperties = {
  padding: "14px 24px",
  background: "var(--accent)",
  color: "var(--bg-primary)",
  border: "none",
  borderRadius: "10px",
  fontFamily: "var(--font-condensed)",
  fontWeight: 700,
  fontSize: "var(--text-base)",
  letterSpacing: "0.04em",
  cursor: "pointer",
};

const ghostBtnStyle: React.CSSProperties = {
  padding: "14px 24px",
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-secondary)",
  fontFamily: "var(--font-condensed)",
  fontWeight: 600,
  fontSize: "var(--text-base)",
  cursor: "pointer",
};

export function WeeklyCheckIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [addingActivityDay, setAddingActivityDay] = useState<string | null>(null);
  const [tempType, setTempType] = useState<ActivityType>("korfbal_training");
  const [tempRpe, setTempRpe] = useState(7);
  const [tempDuration, setTempDuration] = useState(60);

  // Step 2: Body response
  const [bodyEnergy, setBodyEnergy] = useState<number | null>(null);
  const [muscleSoreness, setMuscleSoreness] = useState<string | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // Step 3: Korfbal-specific
  const [korfbalPosition, setKorfbalPosition] = useState<string | null>(null);
  const [korfbalExplosiveness, setKorfbalExplosiveness] = useState<number | null>(null);
  const [korfbalNotes, setKorfbalNotes] = useState("");

  const hasKorfbal = activities.some((a) => a.type.startsWith("korfbal"));

  const addActivity = (day: string) => {
    setActivities((prev) => [
      ...prev,
      { dayOfWeek: day, type: tempType, rpe: tempRpe, durationMinutes: tempDuration },
    ]);
    setAddingActivityDay(null);
    setTempType("korfbal_training");
    setTempRpe(7);
    setTempDuration(60);
  };

  const removeActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceedStep = () => {
    if (step === 2) return bodyEnergy !== null && muscleSoreness !== null && sleepQuality !== null;
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(hasKorfbal ? 3 : 4);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleGeneratePlan = async () => {
    setSubmitting(true);
    try {
      const weekStart = getMonday();

      await fetch("/api/check-in/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          weekStart,
          activities,
          bodyEnergy,
          muscleSoreness,
          sleepQuality,
          notes,
          korfbalPosition,
          korfbalExplosiveness,
          korfbalNotes,
        }),
      });

      await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ weekStart: getNextMonday() }),
      });

      navigate("/week");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;

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
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
          <button
            type="button"
            onClick={() => (step > 1 ? setStep((s) => s - 1) : navigate("/"))}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "var(--text-base)",
              marginRight: "12px",
            }}
          >
            ←
          </button>
          <span
            style={{
              fontFamily: "var(--font-condensed)",
              fontWeight: 600,
              color: "var(--text-primary)",
              fontSize: "var(--text-base)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              flex: 1,
              textAlign: "center",
            }}
          >
            Weekcheck-in
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
            }}
          >
            {step}/4
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height: "4px", background: "var(--bg-elevated)", borderRadius: "2px" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: "var(--accent)",
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px 32px" }}>
        {step === 1 && (
          <div>
            <h2 style={questionStyle}>Wat deed je afgelopen week?</h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                marginBottom: "24px",
              }}
            >
              Voeg activiteiten toe per dag.
            </p>

            {DAYS.map((day) => {
              const dayActivities = activities.filter((a) => a.dayOfWeek === day);
              return (
                <div key={day} style={{ marginBottom: "16px" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-condensed)",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      fontSize: "var(--text-sm)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    {DAY_LABELS[day]}
                  </p>
                  {dayActivities.map((a) => (
                    <div
                      key={`${day}-${a.type}-${a.rpe}-${a.durationMinutes}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 12px",
                        background: "var(--bg-elevated)",
                        borderRadius: "8px",
                        marginBottom: "6px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          color: "var(--text-primary)",
                          fontSize: "var(--text-sm)",
                          fontFamily: "var(--font-condensed)",
                          fontWeight: 600,
                        }}
                      >
                        {ACTIVITY_LABELS[a.type as ActivityType]} · RPE {a.rpe} ·{" "}
                        {a.durationMinutes}min
                      </span>
                      <button
                        type="button"
                        onClick={() => removeActivity(activities.indexOf(a))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-ghost)",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {addingActivityDay === day ? (
                    <div
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-accent)",
                        borderRadius: "10px",
                        padding: "16px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                          marginBottom: "12px",
                        }}
                      >
                        {(Object.entries(ACTIVITY_LABELS) as Array<[ActivityType, string]>).map(
                          ([type, label]) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setTempType(type)}
                              style={{
                                padding: "6px 10px",
                                background:
                                  tempType === type ? "var(--accent)" : "var(--bg-elevated)",
                                color:
                                  tempType === type ? "var(--bg-primary)" : "var(--text-secondary)",
                                border: "1px solid var(--border)",
                                borderRadius: "6px",
                                fontFamily: "var(--font-condensed)",
                                fontWeight: 600,
                                fontSize: "var(--text-xs)",
                                cursor: "pointer",
                              }}
                            >
                              {label}
                            </button>
                          ),
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <label htmlFor="input-rpe" style={labelStyle}>
                            RPE (1-10)
                          </label>
                          <input
                            id="input-rpe"
                            type="number"
                            min="1"
                            max="10"
                            value={tempRpe}
                            onChange={(e) => setTempRpe(Number(e.target.value))}
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label htmlFor="input-duration" style={labelStyle}>
                            Duur (min)
                          </label>
                          <input
                            id="input-duration"
                            type="number"
                            min="5"
                            max="300"
                            value={tempDuration}
                            onChange={(e) => setTempDuration(Number(e.target.value))}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => addActivity(day)}
                          style={primaryBtnStyle}
                        >
                          Toevoegen
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingActivityDay(null)}
                          style={ghostBtnStyle}
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingActivityDay(day)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "transparent",
                        border: "1px dashed var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-ghost)",
                        fontFamily: "var(--font-condensed)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        cursor: "pointer",
                        letterSpacing: "0.02em",
                      }}
                    >
                      + Voeg activiteit toe
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={questionStyle}>Hoe voelde je lichaam?</h2>
            <div style={{ marginBottom: "24px", marginTop: "24px" }}>
              <span style={labelStyle}>Energie deze week</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBodyEnergy(v)}
                    style={{
                      flex: 1,
                      height: "44px",
                      background: bodyEnergy === v ? "var(--accent)" : "var(--bg-elevated)",
                      border:
                        bodyEnergy === v ? "2px solid var(--accent)" : "1px solid var(--border)",
                      borderRadius: "8px",
                      color: bodyEnergy === v ? "var(--bg-primary)" : "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: "var(--text-sm)",
                      cursor: "pointer",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <span style={labelStyle}>Spierpijn / stijfheid</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {["geen", "licht", "behoorlijk", "erg"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMuscleSoreness(v)}
                    style={{
                      flex: 1,
                      padding: "10px 6px",
                      background: muscleSoreness === v ? "var(--accent)" : "var(--bg-elevated)",
                      border:
                        muscleSoreness === v
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      borderRadius: "8px",
                      color: muscleSoreness === v ? "var(--bg-primary)" : "var(--text-secondary)",
                      fontFamily: "var(--font-condensed)",
                      fontWeight: 600,
                      fontSize: "var(--text-xs)",
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                      textTransform: "capitalize",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <span style={labelStyle}>Slaap over de week</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSleepQuality(v)}
                    style={{
                      flex: 1,
                      height: "44px",
                      background: sleepQuality === v ? "var(--accent)" : "var(--bg-elevated)",
                      border:
                        sleepQuality === v ? "2px solid var(--accent)" : "1px solid var(--border)",
                      borderRadius: "8px",
                      color: sleepQuality === v ? "var(--bg-primary)" : "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: "var(--text-sm)",
                      cursor: "pointer",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="input-notes" style={labelStyle}>
                Bijzonderheden (optioneel)
              </label>
              <textarea
                id="input-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 280))}
                placeholder="Bijv. pijntje, toetsweek, moe van school..."
                style={{ ...inputStyle, height: "80px", resize: "none" }}
              />
              <p
                style={{
                  color: "var(--text-ghost)",
                  fontSize: "var(--text-xs)",
                  textAlign: "right",
                  marginTop: "4px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {notes.length}/280
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={questionStyle}>Hoe ging het korfbal?</h2>
            <div style={{ marginBottom: "24px", marginTop: "24px" }}>
              <span style={labelStyle}>Spelpositie</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {["Aanval", "Verdediging", "Beide"].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setKorfbalPosition(pos)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: korfbalPosition === pos ? "var(--accent)" : "var(--bg-elevated)",
                      border:
                        korfbalPosition === pos
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      borderRadius: "8px",
                      color:
                        korfbalPosition === pos ? "var(--bg-primary)" : "var(--text-secondary)",
                      fontFamily: "var(--font-condensed)",
                      fontWeight: 600,
                      fontSize: "var(--text-sm)",
                      cursor: "pointer",
                    }}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <span style={labelStyle}>Explosiviteit</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setKorfbalExplosiveness(v)}
                    style={{
                      flex: 1,
                      height: "44px",
                      background:
                        korfbalExplosiveness === v ? "var(--accent)" : "var(--bg-elevated)",
                      border:
                        korfbalExplosiveness === v
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      borderRadius: "8px",
                      color:
                        korfbalExplosiveness === v ? "var(--bg-primary)" : "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: "var(--text-sm)",
                      cursor: "pointer",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="input-korfbal-notes" style={labelStyle}>
                Wat ging goed / aandacht nodig
              </label>
              <textarea
                id="input-korfbal-notes"
                value={korfbalNotes}
                onChange={(e) => setKorfbalNotes(e.target.value)}
                placeholder="Bijv. aanvalsbeweging verbeterd, maar defensief nog aandacht nodig"
                style={{ ...inputStyle, height: "80px", resize: "none" }}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={questionStyle}>Klaar voor volgende week</h2>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px",
                marginTop: "24px",
                marginBottom: "32px",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-condensed)",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  fontSize: "var(--text-sm)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                Samenvatting
              </h3>
              <div
                style={{
                  color: "var(--text-primary)",
                  fontSize: "var(--text-sm)",
                  lineHeight: "1.8",
                }}
              >
                <p>
                  Activiteiten:{" "}
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                    {activities.length}
                  </span>
                </p>
                <p>
                  Energie:{" "}
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                    {bodyEnergy}/5
                  </span>
                </p>
                <p>
                  Slaap:{" "}
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                    {sleepQuality}/5
                  </span>
                </p>
                <p>
                  Spierpijn:{" "}
                  <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                    {muscleSoreness}
                  </span>
                </p>
                {hasKorfbal && korfbalPosition && (
                  <p>
                    Korfbal positie:{" "}
                    <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                      {korfbalPosition}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={submitting}
              style={{
                ...primaryBtnStyle,
                width: "100%",
                padding: "18px",
                fontSize: "16px",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Je coach verwerkt alles..." : "Plan genereren voor volgende week →"}
            </button>
          </div>
        )}
      </div>

      {/* Next button (visible on steps 1-3) */}
      {step < 4 && (
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceedStep()}
            style={{ ...primaryBtnStyle, width: "100%", opacity: canProceedStep() ? 1 : 0.4 }}
          >
            Verder →
          </button>
        </div>
      )}
    </div>
  );
}
