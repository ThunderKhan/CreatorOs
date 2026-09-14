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

  const originalContentCreate = ContentOsModel.create.bind(ContentOsModel);
  ContentOsModel.create = async function createContentOsItem(...args) {
    const result = await originalContentCreate(...args);
    const context = store.getStore();
    const createdItem = Array.isArray(result) ? result[0] : result;
    if (context && createdItem?._id) {
      context.contentOsId = createdItem._id.toString();
    }
    return result;
  };

  const originalScheduledCreate = ScheduledContentModel.create.bind(ScheduledContentModel);
  ScheduledContentModel.create = async function createScheduledContent(data, ...rest) {
    const contentOsId = getContentOsId();
    if (!contentOsId || !data?.userId) {
      return originalScheduledCreate(data, ...rest);
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
