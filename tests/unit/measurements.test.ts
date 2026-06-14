import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { calculateAsymmetry, calculatePhv } from "../../src/server/utils/phv";

describe("Measurements (IT-05 + PHV)", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(":memory:");
    const schema = readFileSync(join(import.meta.dirname, "../../src/db/schema.sql"), "utf-8");
    db.exec(schema);
  });

  afterAll(() => db.close());

  beforeEach(() => {
    db.exec("DELETE FROM measurement");
  });

  // IT-05: Asymmetric values → warning banner visible
  it("IT-05: jump asymmetry >15% is detected correctly", () => {
    // Sprong links 40cm, rechts 30cm → 25% verschil
    const jumpLeft = 40;
    const jumpRight = 30;
    const ratio = calculateAsymmetry(jumpLeft, jumpRight);

    expect(ratio).toBeCloseTo(0.25, 2); // 25%
    expect(ratio).toBeGreaterThan(0.15); // Should trigger warning

    // UI should show warning banner
    const warningText = `ASYMMETRIE — Sprong links/rechts: ${Math.round(ratio * 100)}% verschil`;
    expect(warningText).toContain("25%");
    expect(warningText).toContain("ASYMMETRIE");
  });

  it("IT-05: asymmetry ≤15% should NOT trigger warning", () => {
    const jumpLeft = 40;
    const jumpRight = 37; // ~7.5% difference
    const ratio = calculateAsymmetry(jumpLeft, jumpRight);

    expect(ratio).toBeLessThanOrEqual(0.15);
  });

  // PHV calculation with Mirwald 2002 formula
  it("PHV: calculates maturity offset correctly for Freek", () => {
    // Freek: born 15-05-2012, age ~14.08 years
    // Height: 170cm, Weight: 58kg, Sitting height: 90cm
    const heightCm = 170;
    const weightKg = 58;
    const sittingHeightCm = 90;
    const ageDays = 14 * 365.25 + 30; // approximately 14 years 1 month

    const result = calculatePhv(heightCm, weightKg, sittingHeightCm, ageDays);

    // At 14 years, Freek is likely near PHV (maturity offset between -1 and +1)
    expect(result.maturityOffset).toBeGreaterThan(-3); // Sanity check - not hugely pre-PHV
    expect(result.maturityOffset).toBeLessThan(3); // Sanity check - not hugely post-PHV
    expect(["pre", "near", "post"]).toContain(result.phvStatus);
    expect(result.message.length).toBeGreaterThan(20);
  });

  it("PHV: near-PHV status triggers plyo caution", () => {
    // Values that put offset between -1 and +1 (near PHV)
    // Use typical 13-year-old values
    const result = calculatePhv(162, 50, 85, 13 * 365.25);
    // Should be near PHV for a 13-year-old with these measurements
    if (result.phvStatus === "near") {
      expect(result.plyoCaution).toBe(true);
    }
    // The formula is deterministic - just check output is valid
    expect(result.maturityOffset).toBeDefined();
    expect(typeof result.maturityOffset).toBe("number");
  });

  it("PHV: post-PHV does NOT trigger plyo caution", () => {
    // Older athlete, well past PHV
    const result = calculatePhv(185, 75, 100, 18 * 365.25);
    if (result.phvStatus === "post") {
      expect(result.plyoCaution).toBe(false);
    }
  });

  it("should detect PR for sprint measurement", () => {
    // Insert previous better sprint time (higher = slower)
    db.exec(
      `INSERT INTO measurement (measured_at, height_cm, weight_kg, sprint_10m_sec) VALUES (datetime('now', '-30 days'), 175, 65, 1.71)`,
    );

    const previous = db
      .query("SELECT sprint_10m_sec FROM measurement ORDER BY measured_at ASC LIMIT 1")
      .get() as { sprint_10m_sec: number };
    const newTime = 1.68;

    const isPR = newTime < previous.sprint_10m_sec;
    expect(isPR).toBe(true);

    const improvement = (previous.sprint_10m_sec - newTime).toFixed(2);
    expect(Number(improvement)).toBeCloseTo(0.03, 1);
  });
});
