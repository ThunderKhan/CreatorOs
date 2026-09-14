const requireJwtSecret = require("../../utils/requireJwtSecret");

describe("requireJwtSecret", () => {
  test("rejects production when JWT_SECRET is missing", () => {
    expect(() =>
      requireJwtSecret({ NODE_ENV: "production", JWT_SECRET: "" }),
    ).toThrow("JWT_SECRET must be set in production.");
  });

  test("allows production when JWT_SECRET is configured", () => {
    expect(
      requireJwtSecret({ NODE_ENV: "production", JWT_SECRET: "configured-secret" }),
    ).toBe("configured-secret");
  });

  test("allows non-production environments without JWT_SECRET", () => {
    expect(
      requireJwtSecret({ NODE_ENV: "development", JWT_SECRET: "" }),
    ).toBe("");
  });
});
