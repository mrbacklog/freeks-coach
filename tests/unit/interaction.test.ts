/**
 * Interaction tests: IT-07, IT-08, EC-3, EC-5
 *
 * All tests use in-memory SQLite and test logic directly (no HTTP),
 * consistent with the existing test pattern in session.test.ts.
 */

import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { generatePlan } from "../../src/server/services/planningEngine";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function createDb(): Database {
  const db = new Database(":memory:");
  const schema = readFileSync(join(import.meta.dirname, "../../src/db/schema.sql"), "utf-8");
  db.exec(schema);
  return db;
}

function seedExercises(db: Database) {
  db.exec(`INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
    VALUES ('Goblet Squat', 'beensterkte', 'Squat', 'Knieën boven voeten.', 'Korfbal kracht.', 'beginner', 'allowed', 3, '10', 90)`);
  db.exec(`INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
    VALUES ('Push-up', 'bovenlichaam', 'Duw', 'Lichaam recht.', 'Bovenlichaam.', 'beginner', 'allowed', 3, '12', 60)`);
  db.exec(`INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
    VALUES ('Plank', 'kern', 'Kern', 'Stop bij rugpijn.', 'Stabiliteit.', 'beginner', 'allowed', 3, '30s', 60)`);
}

// ---------------------------------------------------------------------------
// IT-07: 3 weken hoge vermoeidheid → volumeModifier ≤ 0.80
// (Also covered in planningEngine.test.ts but verified here for completeness)
// ---------------------------------------------------------------------------

describe("IT-07: 3-week high fatigue → volume reduction", () => {
  let db: Database;

  beforeAll(() => {
    db = createDb();
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM daily_check_in");
    db.exec("DELETE FROM user");
    db.exec("DELETE FROM exercise");
    db.exec("DELETE FROM training_plan");
    db.exec("DELETE FROM session");
    db.exec("DELETE FROM measurement");
    db.exec("DELETE FROM goal");
    db.exec("DELETE FROM safety_status");

    db.exec(
      `INSERT INTO user (id, name, birth_date, korfball_days)
       VALUES (1, 'Freek', '2012-05-15', '["di","do","za"]')`,
    );
    seedExercises(db);
  });

  it("volumeModifier is ≤ 0.80 after 21 days of fatigue_score = 5", () => {
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      db.prepare(
        "INSERT OR IGNORE INTO daily_check_in (date, sleep_score, fatigue_score, pain_level, motivation_score) VALUES (?, 3, 5, 0, 3)",
      ).run(dateStr);
    }

    const result = generatePlan(db, "2026-06-15");
    expect(result.blocked).toBe(false);
    expect(result.volumeModifier).toBeLessThanOrEqual(0.8);
  });
});

// ---------------------------------------------------------------------------
// IT-08: Onboarding creates user + measurement
// ---------------------------------------------------------------------------

describe("IT-08: Onboarding stores user and measurement", () => {
  let db: Database;

  beforeAll(() => {
    db = createDb();
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM measurement");
    db.exec("DELETE FROM user");
    db.exec("DELETE FROM training_plan");
    db.exec("DELETE FROM goal");
  });

  it("inserting onboarding data creates a user record with the given name", () => {
    // Simulate the onboarding route logic directly (same SQL as src/server/index.ts)
    const name = "Freek";
    const birthDate = "2012-05-15";
    const korfballDays = ["di", "do", "za"];
    const korfballTime = "16:00";

    db.prepare(
      `INSERT OR REPLACE INTO user (id, name, birth_date, korfball_days, korfball_time, updated_at)
       VALUES (1, ?, ?, ?, ?, datetime('now'))`,
    ).run(name, birthDate, JSON.stringify(korfballDays), korfballTime);

    const user = db.query("SELECT * FROM user WHERE id = 1").get() as {
      name: string;
      birth_date: string;
      korfball_days: string;
    } | null;

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Freek");
    expect(user?.birth_date).toBe("2012-05-15");
    expect(JSON.parse(user?.korfball_days ?? "[]")).toEqual(["di", "do", "za"]);
  });

  it("inserting onboarding data with measurements creates a measurement record", () => {
    const heightCm = 172;
    const weightKg = 58;
    const sittingHeightCm = 90;

    db.prepare(
      `INSERT OR REPLACE INTO user (id, name, birth_date, korfball_days, updated_at)
       VALUES (1, 'Freek', '2012-05-15', '["di"]', datetime('now'))`,
    ).run();

    db.prepare(
      `INSERT INTO measurement (measured_at, height_cm, weight_kg, sitting_height_cm)
       VALUES (datetime('now'), ?, ?, ?)`,
    ).run(heightCm, weightKg, sittingHeightCm);

    const measurement = db
      .query("SELECT * FROM measurement ORDER BY measured_at DESC LIMIT 1")
      .get() as {
      height_cm: number;
      weight_kg: number;
      sitting_height_cm: number;
    } | null;

    expect(measurement).not.toBeNull();
    expect(measurement?.height_cm).toBe(172);
    expect(measurement?.weight_kg).toBe(58);
    expect(measurement?.sitting_height_cm).toBe(90);
  });

  it("onboarding result reports onboarded: true when user exists", () => {
    db.prepare(
      `INSERT OR REPLACE INTO user (id, name, birth_date, korfball_days, updated_at)
       VALUES (1, 'Freek', '2012-05-15', '["di"]', datetime('now'))`,
    ).run();

    const user = db.query("SELECT id FROM user LIMIT 1").get();
    const onboarded = user !== null;
    expect(onboarded).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EC-3: Plan-trouw indicator (adherence)
// ---------------------------------------------------------------------------

describe("EC-3: Plan adherence calculation", () => {
  let db: Database;

  beforeAll(() => {
    db = createDb();
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM session");
    db.exec("DELETE FROM training_plan");
  });

  it("adherence is 67% when 2 of 3 sessions are completed", () => {
    const weekStart = "2026-06-09";

    // Create a plan
    db.prepare(
      `INSERT INTO training_plan (id, week_start, generated_at, raw_json, personalization_messages)
       VALUES (1, ?, datetime('now'), '{}', '')`,
    ).run(weekStart);

    // Insert 3 sessions; 2 completed, 1 not
    db.prepare(
      "INSERT INTO session (plan_id, scheduled_date, notes, completed_at) VALUES (1, '2026-06-10', 'Sessie 1', datetime('now'))",
    ).run();
    db.prepare(
      "INSERT INTO session (plan_id, scheduled_date, notes, completed_at) VALUES (1, '2026-06-12', 'Sessie 2', datetime('now'))",
    ).run();
    db.prepare(
      "INSERT INTO session (plan_id, scheduled_date, notes) VALUES (1, '2026-06-14', 'Sessie 3')",
    ).run();

    // Replicate the adherence calculation from /api/plan/adherence/:weekStart
    const total =
      (
        db
          .query(
            `SELECT COUNT(*) as cnt FROM session s
             JOIN training_plan tp ON s.plan_id = tp.id
             WHERE tp.week_start = ?`,
          )
          .get(weekStart) as { cnt: number }
      )?.cnt ?? 0;

    const completed =
      (
        db
          .query(
            `SELECT COUNT(*) as cnt FROM session s
             JOIN training_plan tp ON s.plan_id = tp.id
             WHERE tp.week_start = ? AND s.completed_at IS NOT NULL`,
          )
          .get(weekStart) as { cnt: number }
      )?.cnt ?? 0;

    const adherence = total > 0 ? Math.round((completed / total) * 100) : 0;

    expect(total).toBe(3);
    expect(completed).toBe(2);
    expect(adherence).toBeGreaterThanOrEqual(60);
    expect(adherence).toBe(67);
  });

  it("adherence is 0% when no sessions are completed", () => {
    const weekStart = "2026-06-02";

    db.prepare(
      `INSERT INTO training_plan (id, week_start, generated_at, raw_json, personalization_messages)
       VALUES (2, ?, datetime('now'), '{}', '')`,
    ).run(weekStart);

    db.prepare(
      "INSERT INTO session (plan_id, scheduled_date, notes) VALUES (2, '2026-06-03', 'Sessie A')",
    ).run();
    db.prepare(
      "INSERT INTO session (plan_id, scheduled_date, notes) VALUES (2, '2026-06-05', 'Sessie B')",
    ).run();

    const total =
      (
        db
          .query(
            `SELECT COUNT(*) as cnt FROM session s
             JOIN training_plan tp ON s.plan_id = tp.id
             WHERE tp.week_start = ?`,
          )
          .get(weekStart) as { cnt: number }
      )?.cnt ?? 0;

    const completed =
      (
        db
          .query(
            `SELECT COUNT(*) as cnt FROM session s
             JOIN training_plan tp ON s.plan_id = tp.id
             WHERE tp.week_start = ? AND s.completed_at IS NOT NULL`,
          )
          .get(weekStart) as { cnt: number }
      )?.cnt ?? 0;

    const adherence = total > 0 ? Math.round((completed / total) * 100) : 0;

    expect(total).toBe(2);
    expect(completed).toBe(0);
    expect(adherence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// EC-5: Safety block completeness
// ---------------------------------------------------------------------------

describe("EC-5: Safety block state detection", () => {
  let db: Database;

  beforeAll(() => {
    db = createDb();
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM safety_status");
    db.exec("DELETE FROM user");
  });

  it("home state is safety_block when safety_status has an active row", () => {
    // Insert user so we pass the 'no user' gate
    db.prepare(
      `INSERT INTO user (id, name, birth_date, korfball_days)
       VALUES (1, 'Freek', '2012-05-15', '["di"]')`,
    ).run();

    // Activate safety block
    db.prepare(
      "INSERT INTO safety_status (active, reason, blocked_since) VALUES (1, 'Pijn bij beweging', datetime('now'))",
    ).run();

    // Replicate the state logic from /api/home/state
    const user = db.query("SELECT * FROM user LIMIT 1").get();
    const safety = db.query("SELECT active FROM safety_status WHERE active = 1 LIMIT 1").get() as {
      active: number;
    } | null;

    // Determine state
    const state = !user ? "D" : safety?.active ? "E" : "other";

    expect(user).not.toBeNull();
    expect(safety).not.toBeNull();
    expect(safety?.active).toBe(1);
    // State 'E' corresponds to safety_block in the home state machine
    expect(state).toBe("E");
  });

  it("safety block is not triggered when active = 0", () => {
    db.prepare(
      `INSERT INTO user (id, name, birth_date, korfball_days)
       VALUES (1, 'Freek', '2012-05-15', '["di"]')`,
    ).run();

    db.prepare(
      "INSERT INTO safety_status (active, reason, blocked_since) VALUES (0, 'Opgelost', datetime('now'))",
    ).run();

    const safety = db.query("SELECT active FROM safety_status WHERE active = 1 LIMIT 1").get() as {
      active: number;
    } | null;

    expect(safety).toBeNull();
  });

  it("generatePlan returns blocked when safety_status is active", () => {
    db.exec("DELETE FROM exercise");
    db.exec("DELETE FROM measurement");
    db.exec("DELETE FROM goal");
    db.exec("DELETE FROM training_plan");

    db.prepare(
      `INSERT INTO user (id, name, birth_date, korfball_days)
       VALUES (1, 'Freek', '2012-05-15', '["di"]')`,
    ).run();

    db.prepare(
      "INSERT INTO safety_status (active, reason, blocked_since) VALUES (1, 'Kniepijn', datetime('now'))",
    ).run();

    seedExercises(db);

    const result = generatePlan(db, "2026-06-15");
    expect(result.blocked).toBe(true);
    expect(result.sessions).toHaveLength(0);
  });
});
