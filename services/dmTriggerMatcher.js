const DmTrigger = require("../model/dmTrigger");
const { getMaxDmTriggersPerCreator } = require("./dmTriggerPolicy");

function findActiveDmTriggers(creatorId) {
  return DmTrigger.find({
    creatorId,
    isActive: true,
  })
    .limit(getMaxDmTriggersPerCreator())
    .lean();
}

module.exports = { findActiveDmTriggers };
