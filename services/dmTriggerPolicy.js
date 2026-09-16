const DEFAULT_MAX_DM_TRIGGERS_PER_CREATOR = 100;

function getMaxDmTriggersPerCreator() {
  const configured = Number.parseInt(
    process.env.MAX_DM_TRIGGERS_PER_CREATOR || "",
    10,
  );

  if (Number.isInteger(configured) && configured > 0) {
    return configured;
  }

  return DEFAULT_MAX_DM_TRIGGERS_PER_CREATOR;
}

module.exports = {
  DEFAULT_MAX_DM_TRIGGERS_PER_CREATOR,
  getMaxDmTriggersPerCreator,
};
