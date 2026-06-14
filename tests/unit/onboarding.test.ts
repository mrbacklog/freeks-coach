import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("Onboarding data persistence", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    const schema = readFileSync(join(import.meta.dirname, "../../src/db/schema.sql"), "utf-8");
    db.exec(schema);
  });

  afterAll(() => db.close());

  it("should insert user profile correctly", () => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user (id, name, birth_date, korfball_days, korfball_time, updated_at)
      VALUES (1, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run("Freek Laban", "2012-05-15", JSON.stringify(["di", "do", "za"]), "18:00");

    const user = db.query("SELECT * FROM user WHERE id = 1").get() as {
      name: string;
      birth_date: string;
      korfball_days: string;
    } | null;
    expect(user).toBeDefined();
    expect(user?.name).toBe("Freek Laban");
    expect(user?.birth_date).toBe("2012-05-15");
    const days = JSON.parse(user?.korfball_days || "[]");
    expect(days).toContain("di");
    expect(days).toContain("za");
  });

  it("should insert first measurement", () => {
    const stmt = db.prepare(`
      INSERT INTO measurement (measured_at, height_cm, weight_kg, sitting_height_cm)
      VALUES (datetime('now'), ?, ?, ?)
    `);
    stmt.run(175, 65, 92);

    const m = db.query("SELECT * FROM measurement LIMIT 1").get() as {
      height_cm: number;
      weight_kg: number;
    } | null;
    expect(m?.height_cm).toBe(175);
    expect(m?.weight_kg).toBe(65);
  });

  it("should insert a goal with type", () => {
    const stmt = db.prepare(`
      INSERT INTO goal (title, type, created_at)
      VALUES (?, ?, datetime('now'))
    `);
    stmt.run("10m sprint onder 1.65s", "sprint");

    const goal = db.query("SELECT * FROM goal WHERE title = '10m sprint onder 1.65s'").get() as {
      title: string;
      type: string;
    } | null;
    expect(goal?.title).toBe("10m sprint onder 1.65s");
    expect(goal?.type).toBe("sprint");
  });

  it("should insert a training plan", () => {
    const planJson = JSON.stringify({
      sessions: [],
      coachExplanation: "Week 1 plan",
    });
    const stmt = db.prepare(`
      INSERT INTO training_plan (week_start, generated_at, raw_json, personalization_messages)
      VALUES (?, datetime('now'), ?, ?)
    `);
    stmt.run("2026-06-15", planJson, "Welkom!");

    const plan = db.query("SELECT * FROM training_plan LIMIT 1").get() as {
      week_start: string;
      raw_json: string;
    } | null;
    expect(plan?.week_start).toBe("2026-06-15");
    const parsed = JSON.parse(plan?.raw_json || "{}");
    expect(parsed.coachExplanation).toBe("Week 1 plan");
  });
});
