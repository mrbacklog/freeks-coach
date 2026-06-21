import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "alle",
  "beensterkte",
  "bovenlichaam",
  "kern",
  "plyometrie",
  "herstel",
  "coordinatie",
  "snelheid",
] as const;
type Category = (typeof CATEGORIES)[number];

interface Exercise {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  phv_safety: string;
}

export function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [category, setCategory] = useState<Category>("alle");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "alle") params.set("category", category);
    if (search) params.set("search", search);

    fetch(`/api/exercises?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setExercises(data.exercises || []))
      .finally(() => setLoading(false));
  }, [category, search]);

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
        COACH
      </h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Zoek een oefening..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          color: "var(--text-primary)",
          fontSize: "var(--text-base)",
          outline: "none",
          marginBottom: "12px",
          boxSizing: "border-box",
        }}
      />

      {/* Category filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          marginBottom: "20px",
          paddingBottom: "4px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0,
              padding: "8px 14px",
              background: category === cat ? "var(--accent)" : "var(--bg-elevated)",
              color: category === cat ? "var(--bg-primary)" : "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              fontFamily: "var(--font-condensed)",
              fontWeight: 600,
              fontSize: "var(--text-xs)",
              cursor: "pointer",
              letterSpacing: "0.04em",
              textTransform: "capitalize",
              whiteSpace: "nowrap",
            }}
          >
            {cat === "alle" ? "Alle" : cat === "coordinatie" ? "Coördinatie" : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>Laden...</p>
      )}

      {!loading &&
        exercises.map((ex) => (
          <Link
            key={ex.id}
            to={`/exercises/${ex.id}`}
            style={{ display: "block", textDecoration: "none", marginBottom: "10px" }}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontWeight: 700,
                    fontSize: "var(--text-base)",
                    color: "var(--text-primary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {ex.name}
                </p>
                <span
                  style={{
                    fontFamily: "var(--font-condensed)",
                    fontSize: "var(--text-xs)",
                    color:
                      ex.phv_safety === "allowed"
                        ? "var(--success)"
                        : ex.phv_safety === "caution"
                          ? "var(--warning)"
                          : "var(--danger)",
                    marginLeft: "8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  PHV: {ex.phv_safety === "allowed" ? "✓" : ex.phv_safety === "caution" ? "⚠" : "✗"}
                </span>
              </div>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "var(--text-xs)",
                  fontFamily: "var(--font-condensed)",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  marginTop: "4px",
                  letterSpacing: "0.02em",
                }}
              >
                {ex.category} · {ex.difficulty}
              </p>
            </div>
          </Link>
        ))}

      {!loading && exercises.length === 0 && (
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-sm)",
            textAlign: "center",
            padding: "24px",
          }}
        >
          Geen oefeningen gevonden.
        </p>
      )}
    </div>
  );
}
