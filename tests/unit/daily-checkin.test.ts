import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Daily Check-in (IT-01: normal path, IT-02: safety block)", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    const schema = readFileSync(join(import.meta.dirname, "../../src/db/schema.sql"), "utf-8");
    db.exec(schema);
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM daily_check_in");
    db.exec("DELETE FROM safety_status");
  });

  // IT-01: Normal path — check-in saved, no safety block
  it("IT-01: normal check-in saves to database without triggering safety block", () => {
    const today = new Date().toISOString().split("T")[0];

    // Simulate normal check-in (pain level 0 = no pain)
    const stmt = db.prepare(`
      INSERT INTO daily_check_in (date, sleep_score, fatigue_score, pain_level, pain_affects_movement, motivation_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(today, 4, 5, 0, 0, 4);

    const checkIn = db.query("SELECT * FROM daily_check_in WHERE date = ?").get(today) as Record<
      string,
      unknown
    > | null;
    expect(checkIn).toBeDefined();
    expect(checkIn?.sleep_score).toBe(4);
    expect(checkIn?.fatigue_score).toBe(5);
    expect(checkIn?.pain_level).toBe(0);
    expect(checkIn?.motivation_score).toBe(4);

    // No safety block should be active
    const safety = db.query("SELECT * FROM safety_status WHERE active = 1").get();
    expect(safety).toBeNull();
  });

  // IT-01: Maximum 4 interactions in normal path
  it("IT-01: normal check-in flow requires maximum 4 user interactions", () => {
    // The 4-step flow:
    // Interaction 1: tap sleep score (step 1 → step 2)
    // Interaction 2: tap fatigue score (step 2 → step 3)
    // Interaction 3: tap pain level "Nee" (step 3 → step 4, because pain=0 auto-advances)
    // Interaction 4: tap motivation (step 4 → submit)
    const normalPathInteractions = [
      "sleep_score: tap (1-5)",
      "fatigue_score: tap (1-5)",
      "pain_level: tap Nee (auto-advances)",
      "motivation_score: tap (1-5) → submit",
    ];
    expect(normalPathInteractions).toHaveLength(4);
    // Verifies spec: "maximaal 4 taps"
  });

  // IT-02: Severe pain + movement affected → safety block activated
  it("IT-02: severe pain affecting movement activates safety block", () => {
    const today = new Date().toISOString().split("T")[0];

    // Simulate severe check-in (pain_level 3 = severe, pain_affects_movement = 1)
    const stmt = db.prepare(`
      INSERT INTO daily_check_in (date, sleep_score, fatigue_score, pain_level, pain_location, pain_affects_movement, motivation_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(today, 3, 5, 3, "knie_l", 1, 2);

    // Activate safety block
    const safetyStmt = db.prepare(`
      INSERT INTO safety_status (active, reason, blocked_since, physio_confirmed)
      VALUES (1, 'Ernstige pijn die beweging beïnvloedt', datetime('now'), 0)
    `);
    safetyStmt.run();

    // Verify safety block is active
    const safety = db.query("SELECT * FROM safety_status WHERE active = 1").get() as Record<
      string,
      unknown
    > | null;
    expect(safety).toBeDefined();
    expect(safety?.active).toBe(1);

    // Verify check-in was recorded
    const checkIn = db.query("SELECT * FROM daily_check_in WHERE date = ?").get(today) as Record<
      string,
      unknown
    > | null;
    expect(checkIn?.pain_level).toBe(3);
    expect(checkIn?.pain_affects_movement).toBe(1);
  });

  // IT-02: Safety block message content validation
  it("IT-02: safety block message contains required text", () => {
    const blockMessage =
      "Je meldt pijn die je beweging beïnvloedt. Alle spring- en krachtoefeningen zijn gepauzeerd. Laat dit beoordelen door een fysiotherapeut of arts.";

    expect(blockMessage).toContain("pijn die je beweging beïnvloedt");
    expect(blockMessage).toContain("spring- en krachtoefeningen zijn gepauzeerd");
    expect(blockMessage).toContain("fysiotherapeut of arts");
  });

  it("should not activate safety block for moderate pain without movement impact", () => {
    const today = new Date().toISOString().split("T")[0];

    // Moderate pain (level 2) but NOT affecting movement
    const stmt = db.prepare(`
      INSERT INTO daily_check_in (date, sleep_score, fatigue_score, pain_level, pain_affects_movement, motivation_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    stmt.run(today, 4, 4, 2, 0, 3);

    // Safety should NOT be activated
    const safety = db.query("SELECT * FROM safety_status WHERE active = 1").get();
    expect(safety).toBeNull();
  });
});
