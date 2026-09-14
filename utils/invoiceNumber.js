const mongoose = require("mongoose");

async function nextInvoiceNumber(creatorId, year = new Date().getFullYear()) {
  if (!creatorId) {
    throw new Error("creatorId is required to generate an invoice number");
  }

  const collection = mongoose.connection.collection("crm_invoice_sequences");
  const result = await collection.findOneAndUpdate(
    { creatorId: new mongoose.Types.ObjectId(creatorId), year },
    { $inc: { sequence: 1 } },
    { upsert: true, returnDocument: "after" },
  );

  const sequence = result?.value?.sequence ?? result?.sequence;
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error("Failed to allocate an invoice sequence number");
  }

  return `INV-${year}-${String(sequence).padStart(3, "0")}`;
}

module.exports = { nextInvoiceNumber };
