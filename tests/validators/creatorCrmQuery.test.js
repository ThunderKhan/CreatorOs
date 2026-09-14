const { validateCrmQuery } = require("../../middleware/validators/creatorCrmValidator");

describe("validateCrmQuery", () => {
  test("treats regex metacharacters as literal search text", () => {
    const req = { query: { q: ".*+?^${}()|[]\\" } };
    const res = {};
    const next = jest.fn();

    validateCrmQuery(req, res, next);

    expect(req.query.q).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
    expect(next).toHaveBeenCalled();
  });

  test("continues to trim ordinary search input", () => {
    const req = { query: { q: "  adobe  " } };
    const res = {};
    const next = jest.fn();

    validateCrmQuery(req, res, next);

    expect(req.query.q).toBe("adobe");
    expect(next).toHaveBeenCalled();
  });
});
