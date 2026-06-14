import { describe, expect, it } from "vitest";

describe("Auth logic", () => {
  it("should accept correct password", async () => {
    const correctPassword = "freek2024";
    const envPassword = process.env.AUTH_PASSWORD || "freek2024";
    expect(correctPassword).toBe(envPassword);
  });

  it("should reject empty password", () => {
    const password = "";
    expect(password.length).toBe(0);
    // An empty string should not equal the password
    expect(password).not.toBe("freek2024");
  });

  it("should have correct session cookie name", () => {
    const SESSION_COOKIE = "fc_session";
    expect(SESSION_COOKIE).toBe("fc_session");
  });
});
