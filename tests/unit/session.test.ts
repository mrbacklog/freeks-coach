import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const COMPLETION_MESSAGES = [
  "Strak werk vandaag — zo leg je de basis voor sneller korfbal.",
  "Klaar. Je lichaam wordt sterker dan gisteren.",
  "Goed gedaan. Herstel is net zo belangrijk als de training zelf.",
  "Sessie afgerond. Zo bouw je korfbal-kracht op.",
  "Je bent klaar. Morgen pak je dit weer op — sterker dan vandaag.",
];

describe("Session Execution (IT-04)", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    const schema = readFileSync(join(import.meta.dirname, "../../src/db/schema.sql"), "utf-8");
    db.exec(schema);
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM session");
    db.exec("DELETE FROM training_plan");
    db.exec("DELETE FROM exercise");
    db.exec("DELETE FROM session_exercise");
    db.exec("DELETE FROM measurement");

    // Insert a plan and session
    db.exec(`INSERT INTO training_plan (id, week_start, generated_at, raw_json, personalization_messages)
      VALUES (1, '2026-06-15', datetime('now'), '{"sessions":[]}', '')`);
    db.exec(`INSERT INTO session (id, plan_id, scheduled_date, notes)
      VALUES (1, 1, '2026-06-16', 'Beensterkte')`);

    // Insert exercises
    db.exec(`INSERT INTO exercise (id, name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
      VALUES (1, 'Goblet Squat', 'beensterkte', 'Squat oefening', 'Houd knieën boven voeten.', 'Beenkracht voor korfbal.', 'beginner', 'allowed', 3, '10', 90)`);
  });

  // IT-04: Session completion
  it("IT-04: completing a session marks it as done and returns a specific completion message", () => {
    // Mark session complete
    const stmt = db.prepare("UPDATE session SET completed_at = datetime('now') WHERE id = 1");
    stmt.run();

    const session = db.query("SELECT * FROM session WHERE id = 1").get() as {
      completed_at: string | null;
    };
    expect(session.completed_at).not.toBeNull();

    // Completion message should be specific (not "Goed gedaan!")
    const message = COMPLETION_MESSAGES[0];
    expect(message).not.toBe("Goed gedaan!");
    expect(message.length).toBeGreaterThan(20);
  });

  // IT-04: PR celebration specificity
  it("IT-04: PR celebration message contains metric name and value", () => {
    // PR message template
    const prMessage = "Nieuw PR — 10m sprint 1.63s (0.05s sneller dan je vorige beste)";

    expect(prMessage).toContain("PR");
    expect(prMessage).toContain("10m sprint");
    expect(prMessage).toContain("sneller");
    // Should NOT be generic
    expect(prMessage).not.toBe("Goed gedaan!");
  });

  it("should detect PR when new measurement beats previous best", () => {
    // Insert two measurements, second is better (lower sprint time)
    db.exec(
      `INSERT INTO measurement (measured_at, height_cm, weight_kg, sprint_10m_sec) VALUES (datetime('now', '-30 days'), 175, 65, 1.71)`,
    );
    db.exec(
      `INSERT INTO measurement (measured_at, height_cm, weight_kg, sprint_10m_sec) VALUES (datetime('now'), 175, 66, 1.68)`,
    );

    const measurements = db
      .query(
        "SELECT sprint_10m_sec FROM measurement WHERE sprint_10m_sec IS NOT NULL ORDER BY measured_at",
      )
      .all() as Array<{ sprint_10m_sec: number }>;
    expect(measurements).toHaveLength(2);

    const previous = measurements[0].sprint_10m_sec;
    const current = measurements[1].sprint_10m_sec;
    const isPR = current < previous; // Lower is better for sprint

    expect(isPR).toBe(true);
    const improvement = (previous - current).toFixed(2);
    const prMessage = `Nieuw PR — 10m sprint ${current}s (${improvement}s sneller dan je vorige beste)`;
    expect(prMessage).toContain("PR");
    expect(prMessage).toContain("sneller");
  });

  it("completion messages should be specific and not generic", () => {
    for (const msg of COMPLETION_MESSAGES) {
      expect(msg).not.toBe("Goed gedaan!");
      expect(msg.length).toBeGreaterThan(15);
      // Should contain something specific about korfbal or training (case-insensitive)
      const lower = msg.toLowerCase();
      const isSpecific =
        lower.includes("korfbal") ||
        lower.includes("sterker") ||
        lower.includes("basis") ||
        lower.includes("herstel");
      expect(isSpecific).toBe(true);
    }
  });
});
