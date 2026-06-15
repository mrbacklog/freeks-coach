import { useEffect, useState } from "react";

interface Measurement {
  id: number;
  measured_at: string;
  height_cm: number | null;
  weight_kg: number | null;
  sitting_height_cm: number | null;
  vertical_jump_cm: number | null;
  jump_left_cm: number | null;
  jump_right_cm: number | null;
  balance_left: number | null;
  balance_right: number | null;
  medball_left: number | null;
  medball_right: number | null;
  sprint_10m_sec: number | null;
}

interface PhvData {
  maturityOffset: number;
  estimatedPhvAge: number;
  phvStatus: "pre" | "near" | "post";
  message: string;
  plyoCaution: boolean;
  phvVensterActief: boolean;
}

interface Asymmetry {
  metric: string;
  left: number;
  right: number;
  ratio: number;
}

export function Measurements() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [phv, setPhv] = useState<PhvData | null>(null);
  const [asymmetries, setAsymmetries] = useState<Asymmetry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prMessage, setPrMessage] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    heightCm: "",
    weightKg: "",
    sittingHeightCm: "",
    verticalJumpCm: "",
    jumpLeftCm: "",
    jumpRightCm: "",
    balanceLeft: "",
    balanceRight: "",
    medballLeft: "",
    medballRight: "",
    sprint10mSec: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [measurementsRes, phvRes] = await Promise.all([
        fetch("/api/measurements", { credentials: "include" }),
        fetch("/api/measurements/phv", { credentials: "include" }),
      ]);
      const measurementsData = await measurementsRes.json();
      const phvData = await phvRes.json();
      setMeasurements(measurementsData.measurements || []);
      setPhv(phvData.phv);
      setAsymmetries(phvData.asymmetries || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          heightCm: form.heightCm ? Number(form.heightCm) : undefined,
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
          sittingHeightCm: form.sittingHeightCm ? Number(form.sittingHeightCm) : undefined,
          verticalJumpCm: form.verticalJumpCm ? Number(form.verticalJumpCm) : undefined,
          jumpLeftCm: form.jumpLeftCm ? Number(form.jumpLeftCm) : undefined,
          jumpRightCm: form.jumpRightCm ? Number(form.jumpRightCm) : undefined,
          balanceLeft: form.balanceLeft ? Number(form.balanceLeft) : undefined,
          balanceRight: form.balanceRight ? Number(form.balanceRight) : undefined,
          medballLeft: form.medballLeft ? Number(form.medballLeft) : undefined,
          medballRight: form.medballRight ? Number(form.medballRight) : undefined,
          sprint10mSec: form.sprint10mSec ? Number(form.sprint10mSec) : undefined,
        }),
      });
      const data = await res.json();
      setShowModal(false);
      // Show PR message if any
      if (data.prs && data.prs.length > 0) {
        const pr = data.prs[0];
        setPrMessage(
          `Nieuw PR — ${pr.metric} ${pr.value} (${pr.improvement} beter dan je vorige beste)`,
        );
        setTimeout(() => setPrMessage(null), 5000);
      }
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const latestMeasurement = measurements[measurements.length - 1];

  if (loading) {
    return <div style={{ padding: "24px 16px", color: "var(--text-secondary)" }}>Laden...</div>;
  }

  return (
    <div style={{ padding: "16px" }}>
      {/* Header */}
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
          STATS
        </h1>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            padding: "10px 16px",
            background: "var(--accent)",
            color: "var(--bg-primary)",
            border: "none",
            borderRadius: "8px",
            fontFamily: "var(--font-condensed)",
            fontWeight: 700,
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          + Meting
        </button>
      </div>

      {/* Stale measurement banner */}
      {(() => {
        if (measurements.length === 0) return null;
        const last = measurements[measurements.length - 1];
        const lastDate = new Date(last.measured_at);
        const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince <= 28) return null;
        return (
          <div
            style={{
              background: "rgba(240,160,48,0.12)",
              border: "1px solid var(--warning)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                color: "var(--warning)",
                fontSize: "var(--text-sm)",
                fontFamily: "var(--font-condensed)",
                fontWeight: 600,
              }}
            >
              Geen recente metingen. Voeg een meting toe om je groei bij te houden.
            </p>
          </div>
        );
      })()}

      {/* PR message */}
      {prMessage && (
        <div
          style={{
            background: "var(--accent-glow)",
            border: "1px solid var(--border-accent)",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              color: "var(--accent)",
              fontSize: "var(--text-base)",
            }}
          >
            {prMessage}
          </p>
        </div>
      )}

      {/* PHV section */}
      {phv && (
        <div
          style={{
            background: phv.phvVensterActief
              ? "rgba(255, 180, 0, 0.12)"
              : "var(--bg-surface)",
            border: `1px solid ${phv.phvVensterActief ? "rgba(255,180,0,0.5)" : "var(--border)"}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              fontSize: "var(--text-xs)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-ghost)",
              marginBottom: "4px",
            }}
          >
            PHV-status
          </div>
          <div
            style={{
              fontSize: "var(--text-base)",
              fontWeight: 600,
              color: phv.phvVensterActief ? "#f59e0b" : "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            {phv.phvVensterActief
              ? "Je zit waarschijnlijk in je groeispurt"
              : phv.maturityOffset < -1.0
                ? `Geschatte afstand tot PHV: over ~${Math.round(Math.abs(phv.maturityOffset + 1.0) * 12)} maanden`
                : `Groeispurt ~${Math.round((phv.maturityOffset - 1.0) * 12)} maanden geleden`}
          </div>
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
            }}
          >
            {phv.message}
          </div>
          {phv.plyoCaution && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                background: "rgba(240,160,48,0.1)",
                borderLeft: "3px solid var(--warning)",
                borderRadius: "0 6px 6px 0",
              }}
            >
              <p
                style={{
                  color: "var(--warning)",
                  fontSize: "var(--text-xs)",
                  fontFamily: "var(--font-condensed)",
                  fontWeight: 600,
                }}
              >
                VOORZICHTIG MET SPRINGOEFENINGEN
              </p>
            </div>
          )}
        </div>
      )}

      {/* Asymmetry banners (EC-6) */}
      {asymmetries.map((asym) => (
        <div
          key={asym.metric}
          style={{
            background: "rgba(240, 160, 48, 0.1)",
            border: "1px solid var(--warning)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ color: "var(--warning)", fontWeight: 700, fontSize: "16px" }}>⚠</span>
          <div>
            <p
              style={{
                fontFamily: "var(--font-condensed)",
                fontWeight: 700,
                fontSize: "var(--text-base)",
                color: "var(--warning)",
              }}
            >
              ASYMMETRIE — {asym.metric} links/rechts: {Math.round(asym.ratio * 100)}% verschil
            </p>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-xs)",
                marginTop: "2px",
              }}
            >
              Links: {asym.left} · Rechts: {asym.right}
            </p>
          </div>
        </div>
      ))}

      {/* Metric cards */}
      {latestMeasurement && (
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
            MEEST RECENTE WAARDEN
          </p>
          {(
            [
              {
                key: "sprint_10m_sec" as const,
                label: "10m Sprint",
                unit: "s",
                lowerIsBetter: true,
              },
              {
                key: "vertical_jump_cm" as const,
                label: "Verticale Sprong",
                unit: "cm",
                lowerIsBetter: false,
              },
              { key: "height_cm" as const, label: "Lengte", unit: "cm", lowerIsBetter: false },
              { key: "weight_kg" as const, label: "Gewicht", unit: "kg", lowerIsBetter: false },
            ] as const
          ).map(({ key, label, unit }) => {
            const value = latestMeasurement[key];
            if (value === null || value === undefined) return null;
            return (
              <div
                key={key}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
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
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-metric)",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {value}
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--text-secondary)",
                        marginLeft: "4px",
                      }}
                    >
                      {unit}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}

          {/* Bilateral pairs */}
          {(
            [
              {
                lKey: "jump_left_cm" as const,
                rKey: "jump_right_cm" as const,
                label: "Sprong",
                unit: "cm",
              },
              {
                lKey: "balance_left" as const,
                rKey: "balance_right" as const,
                label: "Balance",
                unit: "s",
              },
              {
                lKey: "medball_left" as const,
                rKey: "medball_right" as const,
                label: "Medicijnbal",
                unit: "cm",
              },
            ] as const
          ).map(({ lKey, rKey, label, unit }) => {
            const left = latestMeasurement[lKey];
            const right = latestMeasurement[rKey];
            if (left === null || right === null) return null;
            const asymRatio = Math.abs((left - right) / Math.max(left, right));
            return (
              <div
                key={label}
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${asymRatio > 0.15 ? "var(--warning)" : "var(--border)"}`,
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "10px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 600,
                    fontSize: "var(--text-sm)",
                    color: "var(--text-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  {label}
                </p>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        color: "var(--text-ghost)",
                        fontSize: "var(--text-xs)",
                        fontFamily: "var(--font-condensed)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Links
                    </span>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xl)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {left}
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--text-secondary)",
                          marginLeft: "2px",
                        }}
                      >
                        {unit}
                      </span>
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        color: "var(--text-ghost)",
                        fontSize: "var(--text-xs)",
                        fontFamily: "var(--font-condensed)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Rechts
                    </span>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-xl)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {right}
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--text-secondary)",
                          marginLeft: "2px",
                        }}
                      >
                        {unit}
                      </span>
                    </p>
                  </div>
                </div>
                {asymRatio > 0.15 && (
                  <p
                    style={{
                      color: "var(--warning)",
                      fontSize: "var(--text-xs)",
                      marginTop: "8px",
                      fontFamily: "var(--font-condensed)",
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(asymRatio * 100)}% verschil — let op bij trainingen
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {measurements.length === 0 && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "32px",
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
            Nog geen metingen. Voeg je eerste meting toe.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              padding: "12px 24px",
              background: "var(--accent)",
              color: "var(--bg-primary)",
              border: "none",
              borderRadius: "8px",
              fontFamily: "var(--font-condensed)",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
              cursor: "pointer",
            }}
          >
            + Nieuwe meting
          </button>
        </div>
      )}

      {/* New measurement modal */}
      {showModal && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Sluit modal"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 300,
            }}
            onClick={() => setShowModal(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter") setShowModal(false);
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "var(--bg-surface)",
              borderTop: "1px solid var(--border)",
              borderRadius: "16px 16px 0 0",
              padding: "24px 16px 48px",
              zIndex: 301,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "4px",
                background: "var(--border)",
                borderRadius: "2px",
                margin: "0 auto 20px",
              }}
            />
            <h3
              style={{
                fontFamily: "var(--font-condensed)",
                fontSize: "var(--text-xl)",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "20px",
                letterSpacing: "0.02em",
              }}
            >
              NIEUWE METING
            </h3>

            {(
              [
                { key: "heightCm" as const, label: "Lengte (cm)", placeholder: "175" },
                { key: "weightKg" as const, label: "Gewicht (kg)", placeholder: "65" },
                { key: "sittingHeightCm" as const, label: "Zithoogte (cm)", placeholder: "90" },
                {
                  key: "verticalJumpCm" as const,
                  label: "Verticale sprong (cm)",
                  placeholder: "40",
                },
                { key: "jumpLeftCm" as const, label: "Sprong links (cm)", placeholder: "38" },
                { key: "jumpRightCm" as const, label: "Sprong rechts (cm)", placeholder: "40" },
                { key: "balanceLeft" as const, label: "Balance links (s)", placeholder: "25" },
                { key: "balanceRight" as const, label: "Balance rechts (s)", placeholder: "24" },
                {
                  key: "medballLeft" as const,
                  label: "Medicijnbal links (cm)",
                  placeholder: "550",
                },
                {
                  key: "medballRight" as const,
                  label: "Medicijnbal rechts (cm)",
                  placeholder: "540",
                },
                { key: "sprint10mSec" as const, label: "10m Sprint (s)", placeholder: "1.71" },
              ] as const
            ).map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: "14px" }}>
                <label
                  htmlFor={`field-${key}`}
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "var(--text-xs)",
                    marginBottom: "6px",
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </label>
                <input
                  id={`field-${key}`}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "var(--text-base)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                width: "100%",
                padding: "16px",
                background: saving ? "var(--bg-elevated)" : "var(--accent)",
                color: saving ? "var(--text-ghost)" : "var(--bg-primary)",
                border: "none",
                borderRadius: "10px",
                fontFamily: "var(--font-condensed)",
                fontWeight: 700,
                fontSize: "var(--text-base)",
                letterSpacing: "0.04em",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Opslaan..." : "Meting opslaan"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
