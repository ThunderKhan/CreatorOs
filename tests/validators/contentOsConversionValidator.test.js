const contentOsConversionValidator = require("../../middleware/validators/contentOsConversionValidator");

describe("contentOsConversionValidator", () => {
  const runValidator = async (body) => {
    const req = { body, headers: {}, method: "POST" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    await contentOsConversionValidator(req, res, next);
    return { req, res, next };
  };

  test("accepts supported status and type values", async () => {
    const { next, res } = await runValidator({ targetStatus: "ready", targetType: "post" });
    expect(next).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test("rejects unsupported stage values", async () => {
    const { next, res } = await runValidator({ targetStatus: "banana", targetType: "post" });
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
