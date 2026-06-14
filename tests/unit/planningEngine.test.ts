import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { generatePlan } from "../../src/server/services/planningEngine";

describe("Planning Engine", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    const schema = readFileSync(join(import.meta.dirname, "../../src/db/schema.sql"), "utf-8");
    db.exec(schema);
  });

  afterAll(() => db.close());

  beforeEach(() => {
    // Clear tables before each test
    db.exec("DELETE FROM safety_status");
    db.exec("DELETE FROM daily_check_in");
    db.exec("DELETE FROM measurement");
    db.exec("DELETE FROM goal");
    db.exec("DELETE FROM training_plan");
    db.exec("DELETE FROM user");
    db.exec("DELETE FROM exercise");
    // Insert default user
    db.exec(
      `INSERT INTO user (id, name, birth_date, korfball_days) VALUES (1, 'Freek', '2012-05-15', '["di","do","za"]')`,
    );
    // Insert some exercises
    db.exec(
      `INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
      VALUES ('Goblet Squat', 'beensterkte', 'Squat oefening', 'Houd knieën boven voeten.', 'Korfbal kracht.', 'beginner', 'allowed', 3, '10', 90)`,
    );
    db.exec(
      `INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
      VALUES ('Push-up', 'bovenlichaam', 'Duw oefening', 'Houd lichaam recht.', 'Bovenlichaam.', 'beginner', 'allowed', 3, '12', 60)`,
    );
    db.exec(
      `INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
      VALUES ('Plank', 'kern', 'Kernkracht', 'Stop bij rugpijn.', 'Stabiliteit.', 'beginner', 'allowed', 3, '30s', 60)`,
    );
    db.exec(
      `INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
      VALUES ('Box Jump', 'plyometrie', 'Springoefening', 'Land zacht.', 'Explosiviteit.', 'intermediate', 'caution', 3, '5', 120)`,
    );
  });

  it("should block plan when safety_status is active", () => {
    // Insert with NULL reason so the fallback "Veiligheids-blokkade actief" fires
    db.exec(
      "INSERT INTO safety_status (active, reason, blocked_since) VALUES (1, NULL, datetime('now'))",
    );

    const result = generatePlan(db, "2026-06-15");
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("Veiligheids-blokkade");
    expect(result.sessions).toHaveLength(0);
  });

  it("should reduce volumeModifier to 0.80 when fatigue > 3.5 for 3 weeks", () => {
    // Insert 3 weeks of high-fatigue check-ins (5 = max on 1-5 scale)
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      db.prepare(
        "INSERT INTO daily_check_in (date, sleep_score, fatigue_score, pain_level, motivation_score) VALUES (?, 3, 5, 0, 3)",
      ).run(dateStr);
    }

    const result = generatePlan(db, "2026-06-15");
    expect(result.blocked).toBe(false);
    expect(result.volumeModifier).toBeLessThanOrEqual(0.8);
  });

  it("should reduce plyoVolumeModifier when growth velocity > 1 cm/month", () => {
    // Two measurements 1 month apart with > 1cm growth
    db.exec(
      `INSERT INTO measurement (measured_at, height_cm, weight_kg) VALUES (date('now', '-31 days'), 170, 60)`,
    );
    db.exec(
      `INSERT INTO measurement (measured_at, height_cm, weight_kg) VALUES (datetime('now'), 172, 61)`,
    );

    const result = generatePlan(db, "2026-06-15");
    expect(result.blocked).toBe(false);
    expect(result.plyoVolumeModifier).toBeLessThanOrEqual(0.7);
  });

  it("should include goal coupling in personalization messages when goal is active", () => {
    db.exec(
      `INSERT INTO goal (title, type, created_at) VALUES ('10m sprint onder 1.65s', 'sprint', datetime('now'))`,
    );

    const result = generatePlan(db, "2026-06-15");
    expect(result.blocked).toBe(false);
    const goalMessage = result.personalizationMessages.find((m) =>
      m.includes("10m sprint onder 1.65s"),
    );
    expect(goalMessage).toBeDefined();
  });

  it("should generate at least 2 personalization messages from week 4 onwards", () => {
    // Simulate week 4+ by inserting an older training plan
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 28);
    const oldWeekStart = oldDate.toISOString().split("T")[0];
    db.exec(
      `INSERT INTO training_plan (week_start, generated_at, raw_json, personalization_messages)
      VALUES ('${oldWeekStart}', datetime('now', '-28 days'), '{}', 'Week 1')`,
    );

    // Insert check-in data for last week
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      db.prepare(
        "INSERT INTO daily_check_in (date, sleep_score, fatigue_score, pain_level, motivation_score) VALUES (?, 4, 5, 0, 4)",
      ).run(date.toISOString().split("T")[0]);
    }

    db.exec(
      `INSERT INTO goal (title, type, created_at) VALUES ('Test doel', 'algemeen', datetime('now'))`,
    );

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7 + 28 + 1);
    const result = generatePlan(db, today.toISOString().split("T")[0]);
    // Week 4+ should have at least 2 messages (fatigue + goal)
    expect(result.personalizationMessages.length).toBeGreaterThanOrEqual(2);
  });

  it("should not block plan when safety_status is inactive", () => {
    const result = generatePlan(db, "2026-06-15");
    expect(result.blocked).toBe(false);
    expect(result.sessions.length).toBeGreaterThan(0);
  });
});
