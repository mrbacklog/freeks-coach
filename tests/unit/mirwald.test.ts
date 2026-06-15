import { describe, expect, it } from "vitest";
import { mirwaldOffset, isInPhvVenster, formatPhvDisplay } from "../../src/server/utils/mirwald";

describe("mirwaldOffset", () => {
  it("berekent offset voor jongen ver voor PHV (verwacht ~ -1.76)", () => {
    const result = mirwaldOffset(150, 78, 42, 12.0);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(-1.76, 1);
  });

  it("berekent offset voor jongen in PHV-venster (verwacht ~ -0.19)", () => {
    const result = mirwaldOffset(165, 85, 52, 13.5);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(-0.19, 1);
  });

  it("berekent offset voor jongen na PHV (verwacht ~ +1.82)", () => {
    const result = mirwaldOffset(175, 90, 65, 16.0);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(1.82, 1);
  });

  it("retourneert null als lengte ontbreekt", () => {
    expect(mirwaldOffset(null, 78, 42, 12.0)).toBeNull();
  });

  it("retourneert null als zithoogte ontbreekt", () => {
    expect(mirwaldOffset(150, null, 42, 12.0)).toBeNull();
  });

  it("retourneert null als gewicht ontbreekt", () => {
    expect(mirwaldOffset(150, 78, null, 12.0)).toBeNull();
  });

  it("retourneert null als leeftijdDec ontbreekt", () => {
    expect(mirwaldOffset(150, 78, 42, null)).toBeNull();
  });
});

describe("isInPhvVenster", () => {
  it("retourneert true voor offset -1.0", () => expect(isInPhvVenster(-1.0)).toBe(true));
  it("retourneert true voor offset 0.0", () => expect(isInPhvVenster(0.0)).toBe(true));
  it("retourneert true voor offset 1.0", () => expect(isInPhvVenster(1.0)).toBe(true));
  it("retourneert false voor offset -1.1", () => expect(isInPhvVenster(-1.1)).toBe(false));
  it("retourneert false voor offset 1.1", () => expect(isInPhvVenster(1.1)).toBe(false));
});

describe("formatPhvDisplay", () => {
  it("toont maanden voor PHV als offset < -1.0", () => {
    const result = formatPhvDisplay(-2.5);
    expect(result).toContain("maanden");
    expect(result).toContain("PHV");
  });

  it("toont groeispurt-melding als in venster", () => {
    const result = formatPhvDisplay(0.0);
    expect(result).toContain("groeispurt");
  });

  it("toont na-PHV melding als offset > 1.0", () => {
    const result = formatPhvDisplay(2.0);
    expect(result).toContain("achter je");
  });
});
