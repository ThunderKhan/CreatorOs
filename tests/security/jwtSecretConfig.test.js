const jwt = require("jsonwebtoken");
const requireJwtSecret = require("../../utils/requireJwtSecret");

const HISTORICAL_FALLBACK_SECRET = "dev_secret_key_creatoros_2026";

describe("requireJwtSecret", () => {
  test("rejects production when JWT_SECRET is missing", () => {
    expect(() =>
      requireJwtSecret({ NODE_ENV: "production", JWT_SECRET: "" }),
    ).toThrow("JWT_SECRET must be set in production.");
  });

  test("allows production when JWT_SECRET is configured", () => {
    expect(
      requireJwtSecret({
        NODE_ENV: "production",
        JWT_SECRET: "configured-secret",
      }),
    ).toBe("configured-secret");
  });

  test("allows non-production environments without JWT_SECRET", () => {
    expect(
      requireJwtSecret({ NODE_ENV: "development", JWT_SECRET: "" }),
    ).toBe("");
  });

  test("does not accept tokens signed with the historical fallback secret", () => {
    const token = jwt.sign(
      { id: "user-id", email: "user@example.com" },
      HISTORICAL_FALLBACK_SECRET,
    );

    expect(() => jwt.verify(token, "configured-production-secret")).toThrow(
      jwt.JsonWebTokenError,
    );
  });
});
