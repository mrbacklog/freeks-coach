import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { generatePlan } from "../../src/server/services/planningEngine";

describe("Goals and Plan Coupling (IT-06)", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    const schema = readFileSync(join(import.meta.dirname, "../../src/db/schema.sql"), "utf-8");
    db.exec(schema);
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM goal");
    db.exec("DELETE FROM training_plan");
    db.exec("DELETE FROM safety_status");
    db.exec("DELETE FROM daily_check_in");
    db.exec("DELETE FROM exercise");
    db.exec("DELETE FROM user");
    db.exec(
      `INSERT INTO user (id, name, birth_date, korfball_days) VALUES (1, 'Freek', '2012-05-15', '["di","za"]')`,
    );
    db.exec(
      `INSERT INTO exercise (name, category, description, safety_cue, korfbal_context, difficulty, phv_safety, sets, reps, rest_seconds)
      VALUES ('Squat', 'beensterkte', 'Squat', 'Veilig.', 'Korfbal.', 'beginner', 'allowed', 3, '10', 90)`,
    );
  });

  it("IT-06: creating a goal results in goal coupling in plan personalization messages", () => {
    // Create a goal
    db.exec(
      `INSERT INTO goal (title, type, created_at) VALUES ('10m sprint onder 1.65s', 'sprint', datetime('now'))`,
    );

    // Generate plan
    const plan = generatePlan(db, "2026-06-15");
    expect(plan.blocked).toBe(false);

    // Plan should reference the goal in personalization messages
    const goalMessage = plan.personalizationMessages.find((m) =>
      m.includes("10m sprint onder 1.65s"),
    );
    expect(goalMessage).toBeDefined();
    expect(goalMessage).toContain("10m sprint onder 1.65s");
  });

  it("should include goal title in plan explanation when goal is active", () => {
    db.exec(
      `INSERT INTO goal (title, type, created_at) VALUES ('Verticale sprong boven 40cm', 'sprong', datetime('now'))`,
    );

    const plan = generatePlan(db, "2026-06-15");
    const coachText = plan.coachExplanation + plan.personalizationMessages.join(" ");

    expect(coachText).toContain("Verticale sprong boven 40cm");
  });

  it("should not include achieved goals in plan coupling", () => {
    db.exec(
      `INSERT INTO goal (title, type, created_at, achieved_at) VALUES ('Oud doel', 'algemeen', datetime('now', '-30 days'), datetime('now'))`,
    );

    const plan = generatePlan(db, "2026-06-15");
    const allText = plan.coachExplanation + plan.personalizationMessages.join(" ");

    // Achieved goal should NOT appear in personalization
    expect(allText).not.toContain("Oud doel");
  });
});
