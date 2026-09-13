const mongoose = require("mongoose");
const EventType = require("../../model/eventType");

describe("EventType ownership", () => {
  it("does not allow userId to be changed by an update", () => {
    const schemaPath = EventType.schema.path("userId");

    expect(schemaPath.options.immutable).toBe(true);
  });

  it("still validates userId as a required ObjectId", () => {
    const schemaPath = EventType.schema.path("userId");

    expect(schemaPath.instance).toBe("ObjectId");
    expect(schemaPath.options.required).toBe(true);
    expect(mongoose.isValidObjectId(new mongoose.Types.ObjectId())).toBe(true);
  });
});
