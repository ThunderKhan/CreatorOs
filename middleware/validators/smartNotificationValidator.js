const { body } = require('express-validator');
const { validateRequest } = require('./common');

const validatePreferences = validateRequest([
  body('channels.email')
    .optional()
    .isBoolean()
    .withMessage('Email channel setting must be a boolean'),
  body('channels.sms')
    .optional()
    .isBoolean()
    .withMessage('SMS channel setting must be a boolean'),
  body('channels.inApp')
    .optional()
    .isBoolean()
    .withMessage('In-App channel setting must be a boolean'),
  body('channels.push')
    .optional()
    .isBoolean()
    .withMessage('Push channel setting must be a boolean'),
  body('categories')
    .optional()
    .isObject()
    .withMessage('Categories must be an object'),
  body('categories.system')
    .optional()
    .isBoolean()
    .withMessage('System category setting must be a boolean'),
  body('categories.engagement')
    .optional()
    .isBoolean()
    .withMessage('Engagement category setting must be a boolean'),
  body('categories.content')
    .optional()
    .isBoolean()
    .withMessage('Content category setting must be a boolean'),
  body('categories.analytics')
    .optional()
    .isBoolean()
    .withMessage('Analytics category setting must be a boolean'),
  body('categories.marketing')
    .optional()
    .isBoolean()
    .withMessage('Marketing category setting must be a boolean'),
  body('quietHours.enabled')
    .optional()
    .isBoolean()
    .withMessage('Quiet hours enabled setting must be a boolean'),
  body('quietHours.startTime')
    .optional()
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Quiet hours start time must use HH:mm format'),
  body('quietHours.endTime')
    .optional()
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Quiet hours end time must use HH:mm format'),
  body('quietHours.timezone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Quiet hours timezone cannot be empty'),
  body('intelligentScheduling.enabled')
    .optional()
    .isBoolean()
    .withMessage('Intelligent scheduling enabled setting must be a boolean'),
  body('intelligentScheduling.preferredWindow')
    .optional()
    .trim()
    .isIn(['optimal', 'morning', 'afternoon', 'evening'])
    .withMessage('Invalid intelligent scheduling preferred window'),
  body('deduplication.enabled')
    .optional()
    .isBoolean()
    .withMessage('Deduplication enabled setting must be a boolean'),
  body('deduplication.windowMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Deduplication window must be between 1 and 1440 minutes'),
]);

const validateCreateNotification = validateRequest([
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters')
    .escape(),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters')
    .escape(),
  body('type')
    .optional()
    .trim()
    .escape(),
  body('priority')
    .optional()
    .trim()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  body('actionUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Action URL must be a valid http or https URL'),
]);

module.exports = {
  validatePreferences,
  validateCreateNotification,
};
