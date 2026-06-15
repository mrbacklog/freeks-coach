import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Measurement {
  id: number;
  measured_at: string;
  height_cm: number | null;
  vertical_jump_cm: number | null;
}

interface WeeklyVolume {
  week_start: string;
  total_sets: number;
  sessions_completed: number;
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export function Progress() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [volumes, setVolumes] = useState<WeeklyVolume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [mRes, vRes] = await Promise.all([
        fetch("/api/measurements"),
        fetch("/api/progress/weekly-volume"),
      ]);
      if (mRes.ok) {
        const data = await mRes.json();
        setMeasurements(data.measurements ?? data);
      }
      if (vRes.ok) setVolumes(await vRes.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-ghost)" }}>
        Laden...
      </div>
    );
  }

  const lengteData = measurements
    .filter((m) => m.height_cm)
    .map((m) => ({ datum: formatDatum(m.measured_at), lengte: m.height_cm }));

  const sprongData = measurements
    .filter((m) => m.vertical_jump_cm)
    .map((m) => ({ datum: formatDatum(m.measured_at), sprong: m.vertical_jump_cm }));

  const maxSprong = sprongData.length > 0
    ? Math.max(...sprongData.map((d) => d.sprong ?? 0))
    : 0;

  const volumeData = volumes.map((v) => ({
    week: formatDatum(v.week_start),
    sets: v.total_sets ?? 0,
  }));

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
    border: "1px solid var(--border)",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-condensed)",
    fontSize: "var(--text-xs)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-ghost)",
    marginBottom: "8px",
  };

  const leegStyle: React.CSSProperties = {
    ...cardStyle,
    color: "var(--text-ghost)",
    fontSize: "var(--text-sm)",
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: "480px", margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
          fontWeight: 800,
          marginBottom: "24px",
        }}
      >
        Voortgang
      </h1>

      {lengteData.length >= 2 ? (
        <div style={cardStyle}>
          <div style={labelStyle}>Lengte (cm)</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={lengteData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="datum" tick={{ fontSize: 11, fill: "var(--text-ghost)" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-ghost)" }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="lengte"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: "var(--accent)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={leegStyle}>Voeg minimaal 2 metingen toe om lengtegroei te zien.</div>
      )}

      {sprongData.length >= 2 ? (
        <div style={cardStyle}>
          <div style={labelStyle}>
            Verticale sprong (cm)
            {maxSprong > 0 && (
              <span style={{ marginLeft: "8px", color: "var(--accent)" }}>
                PB: {maxSprong} cm
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sprongData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="datum" tick={{ fontSize: 11, fill: "var(--text-ghost)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-ghost)" }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="sprong"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4, fill: "#22c55e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={leegStyle}>Voeg minimaal 2 metingen toe om sprongontwikkeling te zien.</div>
      )}

      {volumeData.length > 0 ? (
        <div style={cardStyle}>
          <div style={labelStyle}>Wekelijks trainingsvolume (sets)</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={volumeData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-ghost)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-ghost)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="sets" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={leegStyle}>Geen trainingsdata beschikbaar.</div>
      )}
    </div>
  );
}
