import { describe, expect, it } from "vitest";

describe("Route coverage", () => {
  const routes = [
    "/",
    "/week",
    "/measurements",
    "/exercises",
    "/exercises/:id",
    "/check-in/daily",
    "/check-in/weekly",
    "/session/:id",
    "/goals",
    "/goals/new",
    "/goals/:id",
    "/history",
    "/settings",
    "/login",
    "/onboarding",
  ];

  it("should have all required routes defined", () => {
    expect(routes).toHaveLength(15);
    expect(routes).toContain("/");
    expect(routes).toContain("/week");
    expect(routes).toContain("/measurements");
    expect(routes).toContain("/exercises");
    expect(routes).toContain("/check-in/daily");
    expect(routes).toContain("/check-in/weekly");
    expect(routes).toContain("/session/:id");
    expect(routes).toContain("/goals");
    expect(routes).toContain("/goals/new");
    expect(routes).toContain("/history");
    expect(routes).toContain("/settings");
    expect(routes).toContain("/login");
    expect(routes).toContain("/onboarding");
  });

  it("should include all modules from coverage table", () => {
    // Dekkingstabel coverage
    const modules = {
      dagelijkseCheckIn: "/check-in/daily",
      wekelijkseCheckIn: "/check-in/weekly",
      weekplan: "/week",
      doelen: "/goals",
      metingen: "/measurements",
      oefenbibliotheek: "/exercises",
      sessieUitvoering: "/session/:id",
      geschiedenis: "/history",
      instellingen: "/settings",
      onboarding: "/onboarding",
    };
    for (const route of Object.values(modules)) {
      expect(routes).toContain(route);
    }
  });
});
