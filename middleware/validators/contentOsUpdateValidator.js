const { body } = require("express-validator");
const { validateRequest } = require("./common");

const CONTENT_STATUSES = [
  "idea",
  "scripting",
  "filming",
  "editing",
  "ready",
  "scheduled",
  "published",
];

const CONTENT_TYPES = ["idea", "script", "post", "template", "draft"];
const PLATFORMS = ["instagram", "youtube", "twitter", "tiktok", "linkedin", "blog", "general"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const optionalObjectField = (field) =>
  body(field)
    .optional({ checkFalsy: true })
    .isObject()
    .withMessage(`${field} must be an object`);

const contentOsUpdateValidator = validateRequest([
  body("title")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .trim(),
  body("type")
    .optional({ checkFalsy: true })
    .trim()
    .isIn(CONTENT_TYPES)
    .withMessage("Invalid content type"),
  body("status")
    .optional({ checkFalsy: true })
    .trim()
    .isIn(CONTENT_STATUSES)
    .withMessage("Invalid content status"),
  body("platform")
    .optional({ checkFalsy: true })
    .trim()
    .isIn(PLATFORMS)
    .withMessage("Invalid platform"),
  body("platforms")
    .optional({ nullable: true })
    .custom((value) => {
      if (typeof value === "string") {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .every((item) => PLATFORMS.includes(item));
      }
      if (Array.isArray(value)) {
        return value.length > 0 && value.every((item) => typeof item === "string" && PLATFORMS.includes(item));
      }
      return false;
    })
    .withMessage("Platforms must contain only supported platform values"),
  body("priority")
    .optional({ checkFalsy: true })
    .trim()
    .isIn(PRIORITIES)
    .withMessage("Invalid priority"),
  body("folderId")
    .optional({ nullable: true })
    .custom((value) => value === null || /^[a-fA-F0-9]{24}$/.test(String(value)))
    .withMessage("folderId must be a valid MongoDB ObjectId or null"),
  body("tags")
    .optional({ nullable: true })
    .custom((value) => Array.isArray(value) || typeof value === "string")
    .withMessage("Tags must be an array or comma-separated string"),
  optionalObjectField("scriptDetails"),
  body("scriptDetails.hook")
    .optional({ nullable: true })
    .isString()
    .withMessage("scriptDetails.hook must be a string"),
  body("scriptDetails.body")
    .optional({ nullable: true })
    .isString()
    .withMessage("scriptDetails.body must be a string"),
  body("scriptDetails.cta")
    .optional({ nullable: true })
    .isString()
    .withMessage("scriptDetails.cta must be a string"),
  body("scriptDetails.teleprompterNotes")
    .optional({ nullable: true })
    .isString()
    .withMessage("scriptDetails.teleprompterNotes must be a string"),
  body("mediaAssets")
    .optional({ nullable: true })
    .isArray()
    .withMessage("mediaAssets must be an array"),
  body("scheduledAt")
    .optional({ nullable: true })
    .custom((value) => value === null || !Number.isNaN(new Date(value).getTime()))
    .withMessage("scheduledAt must be a valid date"),
  body("deadlineAt")
    .optional({ nullable: true })
    .custom((value) => value === null || !Number.isNaN(new Date(value).getTime()))
    .withMessage("deadlineAt must be a valid date"),
  body("performance")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (typeof value !== "object" || Array.isArray(value)) return false;
      return ["impressions", "views", "engagementRate", "clicks", "likes", "shares"].every(
        (key) => value[key] === undefined || Number.isFinite(Number(value[key]))
      );
    })
    .withMessage("performance metrics must be numeric values"),
]);

module.exports = contentOsUpdateValidator;
