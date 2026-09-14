const { AsyncLocalStorage } = require("node:async_hooks");
const ContentOsModel = require("../model/contentOs");
const ScheduledContentModel = require("../model/scheduledContent");

const store = new AsyncLocalStorage();
const PATCHED = Symbol.for("creatoros.contentOsSchedulePatch");

function runContentOsScheduleContext(req, res, next) {
  const contentOsId = req.params?.id || null;
  store.run({ contentOsId }, next);
}

function getContentOsId() {
  return store.getStore()?.contentOsId || null;
}

function patchScheduleSync() {
  if (ScheduledContentModel[PATCHED]) return;

  ScheduledContentModel[PATCHED] = true;

  ContentOsModel.schema.post("save", function setContentOsContext() {
    const context = store.getStore();
    if (context && this?._id) {
      context.contentOsId = this._id.toString();
    }
  });

  const originalCreate = ScheduledContentModel.create.bind(ScheduledContentModel);

  ScheduledContentModel.create = async function createScheduledContent(data, ...rest) {
    const contentOsId = getContentOsId();
    if (!contentOsId || !data?.userId) {
      return originalCreate(data, ...rest);
    }

    const document = { ...data, contentOsId };
    return ScheduledContentModel.findOneAndUpdate(
      { userId: document.userId, contentOsId },
      { $set: document },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  };
}

patchScheduleSync();

module.exports = {
  runContentOsScheduleContext,
  getContentOsId,
};
