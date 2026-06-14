import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Database schema", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    const schemaPath = join(import.meta.dirname, "../../src/db/schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    db.exec(schema);
  });

  afterAll(() => {
    db.close();
  });

  it("should have all required tables", () => {
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain("user");
    expect(tableNames).toContain("daily_check_in");
    expect(tableNames).toContain("weekly_check_in");
    expect(tableNames).toContain("activity_log");
    expect(tableNames).toContain("training_plan");
    expect(tableNames).toContain("session");
    expect(tableNames).toContain("exercise");
    expect(tableNames).toContain("session_exercise");
    expect(tableNames).toContain("measurement");
    expect(tableNames).toContain("goal");
    expect(tableNames).toContain("safety_status");
  });

  it("should insert and retrieve a user", () => {
    db.exec(
      `INSERT INTO user (name, birth_date, korfball_days) VALUES ('Freek', '2012-01-01', '["maandag"]')`,
    );
    const user = db.query("SELECT * FROM user WHERE name = 'Freek'").get() as
      | { id: number; name: string; birth_date: string }
      | undefined;
    expect(user).toBeDefined();
    expect(user?.name).toBe("Freek");
    expect(user?.birth_date).toBe("2012-01-01");
  });

  it("should enforce exercise category constraint", () => {
    expect(() => {
      db.exec(
        `INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
         VALUES ('Test', 'invalid_category', 'desc', 'safe', 'context', 'beginner', 'allowed', 3, '10', 60)`,
      );
    }).toThrow();
  });

  it("should enforce daily_check_in score range constraints", () => {
    expect(() => {
      db.exec(
        `INSERT INTO daily_check_in (date, sleep_score, fatigue_score, pain_level, motivation_score)
         VALUES ('2024-01-01', 11, 5, 0, 5)`,
      );
    }).toThrow();
  });

  it("should have correct exercise table columns", () => {
    const info = db.query("PRAGMA table_info(exercise)").all() as Array<{ name: string }>;
    const cols = info.map((c) => c.name);
    expect(cols).toContain("id");
    expect(cols).toContain("name");
    expect(cols).toContain("category");
    expect(cols).toContain("description");
    expect(cols).toContain("safety_cue");
    expect(cols).toContain("korfbal_context");
    expect(cols).toContain("difficulty");
    expect(cols).toContain("is_bilateral");
    expect(cols).toContain("phv_safety");
    expect(cols).toContain("sets");
    expect(cols).toContain("reps");
    expect(cols).toContain("rest_seconds");
  });
});
