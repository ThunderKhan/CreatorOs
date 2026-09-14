jest.mock("../../model/contentOs", () => ({
  schema: {
    post: jest.fn(),
  },
}));

jest.mock("../../model/scheduledContent", () => ({
  schema: {
    post: jest.fn(),
  },
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

const ScheduledContentModel = require("../../model/scheduledContent");
const {
  runContentOsScheduleContext,
} = require("../../utils/contentOsScheduleContext");

describe("Content OS schedule synchronization context", () => {
  test("makes scheduled-content creation idempotent for an item mutation", async () => {
    ScheduledContentModel.findOneAndUpdate.mockResolvedValue({ _id: "scheduled-1" });

    const req = { params: { id: "content-123" } };
    const res = {};
    let result;

    await new Promise((resolve, reject) => {
      runContentOsScheduleContext(req, res, async () => {
        try {
          result = await ScheduledContentModel.create({
            userId: "user-1",
            caption: "Updated caption",
            platform: "youtube",
            scheduledAt: new Date("2026-09-20T10:00:00.000Z"),
            status: "scheduled",
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });

    expect(result).toEqual({ _id: "scheduled-1" });
    expect(ScheduledContentModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user-1", contentOsId: "content-123" },
      expect.objectContaining({
        $set: expect.objectContaining({ contentOsId: "content-123" }),
      }),
      expect.objectContaining({ upsert: true, new: true, runValidators: true }),
    );
    expect(ScheduledContentModel.create).not.toHaveBeenCalled();
  });
});
