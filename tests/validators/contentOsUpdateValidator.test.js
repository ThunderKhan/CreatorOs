const contentOsUpdateValidator = require("../../middleware/validators/contentOsUpdateValidator");

describe("contentOsUpdateValidator", () => {
  const runValidator = async (body) => {
    const req = { body, headers: {}, method: "PUT" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    await contentOsUpdateValidator(req, res, next);
    return { req, res, next };
  };

  test("accepts partial updates with supported values", async () => {
    const { next, res } = await runValidator({
      title: "Updated title",
      status: "editing",
      platform: "youtube",
      priority: "high",
    });
    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("rejects invalid platform values", async () => {
    const { next, res } = await runValidator({ platform: "myspace" });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });

  test("rejects invalid performance metrics", async () => {
    const { next, res } = await runValidator({ performance: { views: "not-a-number" } });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
