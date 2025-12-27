import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import * as preferencesController from '../controllers/preferencesController.js';

const router = express.Router();

/**
 * Validation rules for user preferences
 *
 * Supported preference fields:
 * - language: ISO 639-1 language code (en, es, fr, de, it, pl, pt)
 * - weightUnit: kg or lbs
 * - distanceUnit: km or mi
 * - dateFormat: any valid date format string
 * - timeFormat: 12h or 24h
 * - restTimer: positive integer (seconds)
 * - notifications: object with boolean properties
 * - theme: light, dark, or auto
 * - workoutDefaults: object with warmupTime and cooldownTime (seconds)
 */
const preferencesValidation = [
  // Language validation
  body('language')
    .optional()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pl', 'pt'])
    .withMessage('Language must be one of: en, es, fr, de, it, pl, pt'),

  // Weight unit validation
  body('weightUnit')
    .optional()
    .isIn(['kg', 'lbs'])
    .withMessage('Weight unit must be either kg or lbs'),

  // Distance unit validation
  body('distanceUnit')
    .optional()
    .isIn(['km', 'mi'])
    .withMessage('Distance unit must be either km or mi'),

  // Date format validation (basic string check)
  body('dateFormat')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Date format must be a string between 1 and 50 characters'),

  // Time format validation
  body('timeFormat')
    .optional()
    .isIn(['12h', '24h'])
    .withMessage('Time format must be either 12h or 24h'),

  // Rest timer validation
  body('restTimer')
    .optional()
    .isInt({ min: 0, max: 600 })
    .withMessage('Rest timer must be an integer between 0 and 600 seconds'),

  // Notifications validation (nested object)
  body('notifications')
    .optional()
    .isObject()
    .withMessage('Notifications must be an object'),

  body('notifications.workoutReminders')
    .optional()
    .isBoolean()
    .withMessage('workoutReminders must be a boolean'),

  body('notifications.achievementAlerts')
    .optional()
    .isBoolean()
    .withMessage('achievementAlerts must be a boolean'),

  body('notifications.weeklyReports')
    .optional()
    .isBoolean()
    .withMessage('weeklyReports must be a boolean'),

  // Theme validation
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Theme must be one of: light, dark, auto'),

  // Workout defaults validation (nested object)
  body('workoutDefaults')
    .optional()
    .isObject()
    .withMessage('workoutDefaults must be an object'),

  body('workoutDefaults.warmupTime')
    .optional()
    .isInt({ min: 0, max: 1800 })
    .withMessage('warmupTime must be an integer between 0 and 1800 seconds'),

  body('workoutDefaults.cooldownTime')
    .optional()
    .isInt({ min: 0, max: 1800 })
    .withMessage('cooldownTime must be an integer between 0 and 1800 seconds'),

  // Custom validator to check total JSON size
  body()
    .custom((value, { req }) => {
      const jsonSize = JSON.stringify(req.body).length;
      if (jsonSize > 10000) {
        throw new Error('Preferences payload too large (max 10KB)');
      }
      return true;
    }),

  // Custom validator to ensure at least the body is a valid object
  body()
    .custom((value, { req }) => {
      if (typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw new Error('Request body must be a JSON object');
      }
      return true;
    }),
];

/**
 * GET /api/user/preferences
 *
 * Retrieves the authenticated user's preferences
 *
 * Authentication: Required (JWT Bearer token)
 *
 * Response:
 * - 200: { preferences: { ... } }
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'User not found' }
 * - 500: { error: 'Internal server error' }
 */
router.get(
  '/',
  authenticate,
  preferencesController.getPreferences
);

/**
 * PATCH /api/user/preferences
 *
 * Updates the authenticated user's preferences (partial update/merge)
 *
 * Authentication: Required (JWT Bearer token)
 *
 * Request Body: JSON object with preference fields to update
 * Example:
 * {
 *   "language": "es",
 *   "theme": "dark",
 *   "notifications": {
 *     "workoutReminders": true
 *   }
 * }
 *
 * Response:
 * - 200: { preferences: { ... }, message: 'Preferences updated successfully' }
 * - 400: { errors: [...] } (validation errors)
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'User not found' }
 * - 500: { error: 'Internal server error' }
 */
router.patch(
  '/',
  authenticate,
  preferencesValidation,
  preferencesController.updatePreferences
);

/**
 * PUT /api/user/preferences
 *
 * Replaces the authenticated user's preferences entirely
 *
 * Authentication: Required (JWT Bearer token)
 *
 * Request Body: Complete preferences JSON object
 *
 * Response:
 * - 200: { preferences: { ... }, message: 'Preferences replaced successfully' }
 * - 400: { errors: [...] } (validation errors)
 * - 401: { error: 'Authentication required' }
 * - 404: { error: 'User not found' }
 * - 500: { error: 'Internal server error' }
 */
router.put(
  '/',
  authenticate,
  preferencesValidation,
  preferencesController.replacePreferences
);

export default router;
