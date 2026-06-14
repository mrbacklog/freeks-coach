import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { generatePlan } from "../../src/server/services/planningEngine";

describe("Weekly Check-in (IT-03)", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    const schema = readFileSync(join(import.meta.dirname, "../../src/db/schema.sql"), "utf-8");
    db.exec(schema);
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM weekly_check_in");
    db.exec("DELETE FROM activity_log");
    db.exec("DELETE FROM training_plan");
    db.exec("DELETE FROM daily_check_in");
    db.exec("DELETE FROM goal");
    db.exec("DELETE FROM safety_status");
    db.exec("DELETE FROM user");
    db.exec("DELETE FROM exercise");
    db.exec(
      `INSERT INTO user (id, name, birth_date, korfball_days) VALUES (1, 'Freek', '2012-05-15', '["di","do","za"]')`,
    );
    db.exec(
      `INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
      VALUES ('Squat', 'beensterkte', 'Squat', 'Veilig.', 'Korfbal.', 'beginner', 'allowed', 3, '10', 90)`,
    );
  });

  // IT-03: Weekly check-in + plan generation → plan has personalizationMessages
  it("IT-03: weekly check-in saves data and plan generation returns personalizationMessages", () => {
    // Step 1: Save weekly check-in with 3 activities
    const weekStart = "2026-06-09";
    const checkInStmt = db.prepare(`
      INSERT INTO weekly_check_in (week_start, body_energy, muscle_soreness, sleep_quality, notes, confirmed_at)
      VALUES (?, 4, 3, 4, 'Goede week', datetime('now'))
    `);
    const checkInResult = checkInStmt.run(weekStart);
    const weeklyCheckInId = checkInResult.lastInsertRowid;

    // 3 activities for the week — day_of_week is INTEGER (1=ma, 2=di, etc.)
    const actStmt = db.prepare(`
      INSERT INTO activity_log (weekly_check_in_id, day_of_week, type, rpe, duration_minutes)
      VALUES (?, ?, ?, ?, ?)
    `);
    actStmt.run(weeklyCheckInId, 2, "korfbal_training", 7, 60);
    actStmt.run(weeklyCheckInId, 4, "korfbal_training", 6, 90);
    actStmt.run(weeklyCheckInId, 6, "korfbal_wedstrijd", 8, 90);

    // Verify weekly check-in saved
    const checkIn = db
      .query("SELECT * FROM weekly_check_in WHERE week_start = ?")
      .get(weekStart) as Record<string, unknown> | null;
    expect(checkIn).toBeDefined();
    expect(checkIn?.body_energy).toBe(4);

    const activityCount = (
      db
        .query("SELECT COUNT(*) as cnt FROM activity_log WHERE weekly_check_in_id = ?")
        .get(weeklyCheckInId) as { cnt: number }
    ).cnt;
    expect(activityCount).toBe(3);

    // Step 2: Generate plan
    const plan = generatePlan(db, "2026-06-15");
    expect(plan.blocked).toBe(false);
    expect(plan.personalizationMessages).toBeDefined();
    expect(Array.isArray(plan.personalizationMessages)).toBe(true);
  });

  it("IT-03: week 4+ plan has at least 2 personalization messages with check-in data", () => {
    // Simulate week 4+ scenario with an old plan + recent check-in data
    const oldWeekStart = "2026-05-18"; // ~4 weeks ago
    db.exec(
      `INSERT INTO training_plan (week_start, generated_at, raw_json, personalization_messages)
      VALUES ('${oldWeekStart}', datetime('now', '-28 days'), '{}', 'Week 1')`,
    );

    // Add a goal for coupling
    db.exec(
      `INSERT INTO goal (title, type, created_at) VALUES ('10m sprint onder 1.65s', 'sprint', datetime('now'))`,
    );

    // Add recent daily check-ins
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      db.prepare(
        "INSERT INTO daily_check_in (date, sleep_score, fatigue_score, pain_level, motivation_score) VALUES (?, 4, 5, 0, 4)",
      ).run(date.toISOString().split("T")[0]);
    }

    const plan = generatePlan(db, today.toISOString().split("T")[0]);
    expect(plan.personalizationMessages.length).toBeGreaterThanOrEqual(2);
  });
});
