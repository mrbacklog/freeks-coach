import { describe, expect, it } from "vitest";
import {
  adherentieTrend,
  analyseerTrend,
  overreachingRisico,
  vermoeidheidsTrend,
} from "../../src/server/services/trend-detection";

describe("vermoeidheidsTrend", () => {
  it("detecteert stijgende trend bij oplopende vermoeidheid", () => {
    expect(vermoeidheidsTrend([3.0, 3.5, 4.0, 4.5])).toBe("stijgend");
  });

  it("detecteert dalende trend bij aflopende vermoeidheid", () => {
    expect(vermoeidheidsTrend([4.5, 4.0, 3.5, 3.0])).toBe("dalend");
  });

  it("detecteert stabiele trend bij gelijke waarden", () => {
    expect(vermoeidheidsTrend([3.0, 3.2, 2.8, 3.1])).toBe("stabiel");
  });

  it("is stabiel bij minder dan 2 weken data", () => {
    expect(vermoeidheidsTrend([4.0])).toBe("stabiel");
    expect(vermoeidheidsTrend([])).toBe("stabiel");
  });
});

describe("adherentieTrend", () => {
  it("hoog bij 75%+ voltooide weken gemiddeld", () => {
    expect(adherentieTrend([1.0, 0.8, 1.0, 0.9])).toBe("hoog");
  });

  it("matig bij 40-74% voltooide weken gemiddeld", () => {
    expect(adherentieTrend([0.5, 0.6, 0.4, 0.7])).toBe("matig");
  });

  it("laag bij onder 40% voltooide weken gemiddeld", () => {
    expect(adherentieTrend([0.2, 0.3, 0.1, 0.4])).toBe("laag");
  });

  it("matig bij lege array", () => {
    expect(adherentieTrend([])).toBe("matig");
  });
});

describe("overreachingRisico — scenario S5 en S6", () => {
  it("S5: stijgende vermoeidheid + stabiele adherentie → geen risico", () => {
    expect(
      overreachingRisico(
        [3.5, 4.0, 4.5],
        [0.9, 0.8, 0.9],
      ),
    ).toBe(false);
  });

  it("S6: stijgende vermoeidheid + dalende adherentie → risico", () => {
    expect(
      overreachingRisico(
        [3.5, 4.0, 4.5],
        [0.8, 0.5, 0.3],
      ),
    ).toBe(true);
  });

  it("geen risico bij dalende vermoeidheid, ook al daalt adherentie", () => {
    expect(
      overreachingRisico(
        [4.5, 4.0, 3.5],
        [0.8, 0.5, 0.3],
      ),
    ).toBe(false);
  });

  it("geen risico bij minder dan 2 weken data", () => {
    expect(overreachingRisico([4.0], [0.3])).toBe(false);
    expect(overreachingRisico([], [])).toBe(false);
  });
});

describe("analyseerTrend", () => {
  it("geeft warn + boodschap bij overreaching", () => {
    const result = analyseerTrend([3.5, 4.0, 4.5], [0.8, 0.5, 0.3]);
    expect(result.signaal).toBe("warn");
    expect(result.overreaching).toBe(true);
    expect(result.boodschap).not.toBeNull();
  });

  it("geeft caution + boodschap bij stijgende vermoeidheid zonder overreaching", () => {
    const result = analyseerTrend([3.5, 4.0, 4.5], [0.9, 0.8, 0.9]);
    expect(result.signaal).toBe("caution");
    expect(result.overreaching).toBe(false);
    expect(result.boodschap).toContain("weken");
  });

  it("geeft ok zonder boodschap bij stabiele data", () => {
    const result = analyseerTrend([3.0, 3.1, 2.9], [0.9, 0.85, 0.9]);
    expect(result.signaal).toBe("ok");
    expect(result.boodschap).toBeNull();
  });
});
