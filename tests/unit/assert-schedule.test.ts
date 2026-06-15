import { describe, expect, it } from "vitest";
import { assertPhvCap } from "../../src/server/services/assert-schedule";

describe("assertPhvCap — F7", () => {
  it("slaagt als plyoVolumeModifier <= 0.6 in PHV-venster", () => {
    expect(() => assertPhvCap(true, 0.6)).not.toThrow();
    expect(() => assertPhvCap(true, 0.5)).not.toThrow();
  });

  it("faalt als plyoVolumeModifier > 0.6 in PHV-venster", () => {
    expect(() => assertPhvCap(true, 0.7)).toThrow("F7:");
    expect(() => assertPhvCap(true, 1.0)).toThrow("F7:");
  });

  it("slaagt altijd als phvVensterActief false is", () => {
    expect(() => assertPhvCap(false, 1.0)).not.toThrow();
    expect(() => assertPhvCap(false, 0.9)).not.toThrow();
  });
});
