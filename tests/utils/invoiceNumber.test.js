const mongoose = require("mongoose");
const { nextInvoiceNumber } = require("../../utils/invoiceNumber");

describe("nextInvoiceNumber", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("allocates an invoice number from the atomic sequence", async () => {
    const findOneAndUpdate = jest.fn().mockResolvedValue({ value: { sequence: 7 } });
    jest.spyOn(mongoose.connection, "collection").mockReturnValue({ findOneAndUpdate });

    const result = await nextInvoiceNumber(new mongoose.Types.ObjectId(), 2026);

    expect(result).toBe("INV-2026-007");
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2026 }),
      { $inc: { sequence: 1 } },
      expect.objectContaining({ upsert: true, returnDocument: "after" }),
    );
  });

  test("fails when the sequence allocation is invalid", async () => {
    jest.spyOn(mongoose.connection, "collection").mockReturnValue({
      findOneAndUpdate: jest.fn().mockResolvedValue({ value: null }),
    });

    await expect(nextInvoiceNumber(new mongoose.Types.ObjectId(), 2026)).rejects.toThrow(
      "Failed to allocate an invoice sequence number",
    );
  });
});
