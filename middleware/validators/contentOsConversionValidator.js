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

const contentOsConversionValidator = validateRequest([
  body("targetStatus")
    .optional({ checkFalsy: true })
    .trim()
    .isIn(CONTENT_STATUSES)
    .withMessage("Invalid target status"),
  body("targetType")
    .optional({ checkFalsy: true })
    .trim()
    .isIn(CONTENT_TYPES)
    .withMessage("Invalid target type"),
]);

module.exports = contentOsConversionValidator;
