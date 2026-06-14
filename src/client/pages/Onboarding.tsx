import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Step = 1 | 2 | 3 | 4;

const DAYS = [
  { key: "ma", label: "Ma" },
  { key: "di", label: "Di" },
  { key: "wo", label: "Wo" },
  { key: "do", label: "Do" },
  { key: "vr", label: "Vr" },
  { key: "za", label: "Za" },
  { key: "zo", label: "Zo" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "var(--text-base)",
  outline: "none",
  boxSizing: "border-box",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-condensed)",
  fontSize: "var(--text-2xl)",
  fontWeight: 700,
  color: "var(--text-primary)",
  marginBottom: "8px",
  letterSpacing: "0.02em",
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

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState("Freek Laban");
  const [birthDate, setBirthDate] = useState("2012-05-15");

  // Step 2
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sittingHeightCm, setSittingHeightCm] = useState("");

  // Step 3
  const [korfballDays, setKorfballDays] = useState<string[]>([]);
  const [korfballTime, setKorfballTime] = useState("18:00");

  // Step 4
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState<"sprint" | "sprong" | "algemeen">("algemeen");

  const toggleDay = (day: string) => {
    setKorfballDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const canProceed = () => {
    if (step === 1) return name.length > 0 && birthDate.length > 0;
    if (step === 2) return heightCm !== "" && weightKg !== "";
    if (step === 3) return korfballDays.length > 0;
    return true; // Step 4 is optional
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          birthDate,
          korfballDays,
          korfballTime,
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          sittingHeightCm: sittingHeightCm ? Number(sittingHeightCm) : undefined,
          goal: goalTitle ? { title: goalTitle, type: goalType } : undefined,
        }),
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as Step);
    } else {
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        padding: "48px 24px 32px",
      }}
    >
      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          marginBottom: "48px",
        }}
      >
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              width: s === step ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background:
                s === step
                  ? "var(--accent)"
                  : s < step
                    ? "var(--accent-dim)"
                    : "var(--bg-elevated)",
              transition: "all 0.2s ease",
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div style={{ flex: 1 }}>
        {step === 1 && (
          <div>
            <h1 style={headingStyle}>Hoi, ik ben je coach.</h1>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                marginBottom: "32px",
              }}
            >
              Vertel me wie je bent.
            </p>
            <label htmlFor="name" style={labelStyle}>
              Naam
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
            <label htmlFor="birthDate" style={{ ...labelStyle, marginTop: "20px" }}>
              Geboortedatum
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 style={headingStyle}>Even een basismeting.</h1>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                marginBottom: "32px",
              }}
            >
              Dit heeft de coach nodig voor een veilig trainingsplan.
            </p>
            <label htmlFor="heightCm" style={labelStyle}>
              Lengte (cm)
            </label>
            <input
              id="heightCm"
              type="number"
              inputMode="numeric"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              style={inputStyle}
              placeholder="175"
            />
            <label htmlFor="weightKg" style={{ ...labelStyle, marginTop: "20px" }}>
              Gewicht (kg)
            </label>
            <input
              id="weightKg"
              type="number"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              style={inputStyle}
              placeholder="65"
            />
            <label htmlFor="sittingHeightCm" style={{ ...labelStyle, marginTop: "20px" }}>
              Zithoogte (cm)
              <span
                style={{
                  color: "var(--text-ghost)",
                  marginLeft: "8px",
                  fontSize: "var(--text-xs)",
                  textTransform: "none",
                  fontWeight: 400,
                  letterSpacing: 0,
                }}
              >
                sit rechtop, meet van stoel tot bovenkant hoofd
              </span>
            </label>
            <input
              id="sittingHeightCm"
              type="number"
              inputMode="numeric"
              value={sittingHeightCm}
              onChange={(e) => setSittingHeightCm(e.target.value)}
              style={inputStyle}
              placeholder="90 (optioneel)"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 style={headingStyle}>Wanneer speel je korfbal?</h1>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                marginBottom: "32px",
              }}
            >
              De coach houdt hier rekening mee bij het plannen.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              {DAYS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  style={{
                    padding: "12px 4px",
                    background: korfballDays.includes(key) ? "var(--accent)" : "var(--bg-elevated)",
                    color: korfballDays.includes(key)
                      ? "var(--bg-primary)"
                      : "var(--text-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {korfballDays.length > 0 && (
              <>
                <label htmlFor="korfballTime" style={labelStyle}>
                  Tijdstip training
                </label>
                <input
                  id="korfballTime"
                  type="time"
                  value={korfballTime}
                  onChange={(e) => setKorfballTime(e.target.value)}
                  style={inputStyle}
                />
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 style={headingStyle}>Wat wil je dit seizoen bereiken?</h1>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                marginBottom: "32px",
              }}
            >
              Geef de coach een doel om naartoe te werken.
            </p>
            <label htmlFor="goalTitle" style={labelStyle}>
              Mijn doel
            </label>
            <input
              id="goalTitle"
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              style={inputStyle}
              placeholder="bijv. 10m sprint onder 1.65s"
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              {(["sprint", "sprong", "algemeen"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setGoalType(type)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: goalType === type ? "var(--accent)" : "var(--bg-elevated)",
                    color: goalType === type ? "var(--bg-primary)" : "var(--text-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div>
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((prev) => (prev - 1) as Step)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              marginBottom: "12px",
              padding: "4px 0",
              display: "block",
            }}
          >
            ← Terug
          </button>
        )}

        {step === 4 && (
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              display: "block",
              color: "var(--text-ghost)",
              fontSize: "var(--text-sm)",
              cursor: "pointer",
              background: "none",
              border: "none",
              marginBottom: "12px",
              padding: "4px 0",
            }}
          >
            Sla over →
          </button>
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || loading}
          style={{
            width: "100%",
            padding: "18px",
            background: canProceed() && !loading ? "var(--accent)" : "var(--bg-elevated)",
            color: canProceed() && !loading ? "var(--bg-primary)" : "var(--text-ghost)",
            border: "none",
            borderRadius: "10px",
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "0.04em",
            cursor: canProceed() && !loading ? "pointer" : "not-allowed",
            transition: "all 0.15s ease",
          }}
        >
          {loading ? "Bezig..." : step === 4 ? "Klaar →" : "Verder →"}
        </button>
      </div>
    </div>
  );
}
