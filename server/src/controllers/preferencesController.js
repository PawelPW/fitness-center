import { validationResult } from 'express-validator';
import pool from '../config/database.js';

/**
 * Default preferences to return when user has empty preferences
 */
const DEFAULT_PREFERENCES = {
  language: 'en',
  weightUnit: 'kg',
  distanceUnit: 'km',
  restTimer: 90,
  theme: 'auto',
  notifications: {
    workoutReminders: true,
    achievementAlerts: true,
    weeklyReports: true,
  },
};

/**
 * Deep merge two objects (for nested preferences)
 * @param {object} target - Target object
 * @param {object} source - Source object to merge
 * @returns {object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

/**
 * Check if value is a plain object
 * @param {*} item - Value to check
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * GET /api/user/preferences
 *
 * Retrieves the authenticated user's preferences
 */
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Query user preferences
    const result = await pool.query(
      'SELECT preferences, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      console.error(`[Preferences] User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const preferences = user.preferences || {};

    // Merge with defaults to ensure all fields are present
    const completePreferences = { ...DEFAULT_PREFERENCES, ...preferences };

    console.log(`[Preferences] GET success for user ${userId}`);

    res.status(200).json({
      preferences: completePreferences,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    console.error('[Preferences] GET error:', error);
    res.status(500).json({
      error: 'Failed to retrieve preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * PATCH /api/user/preferences
 *
 * Updates the authenticated user's preferences (partial update/merge)
 * Merges new preferences with existing ones
 */
export const updatePreferences = async (req, res) => {
  const client = await pool.connect();

  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[Preferences] PATCH validation errors for user ${req.user.userId}:`, errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const newPreferences = req.body;

    // Start transaction
    await client.query('BEGIN');

    // Get current preferences
    const currentResult = await client.query(
      'SELECT preferences FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      console.error(`[Preferences] User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const currentPreferences = currentResult.rows[0].preferences || {};

    // Deep merge new preferences with current preferences
    const mergedPreferences = deepMerge(currentPreferences, newPreferences);

    // Update preferences in database
    const updateResult = await client.query(
      'UPDATE users SET preferences = $1::jsonb WHERE id = $2 RETURNING preferences, updated_at',
      [JSON.stringify(mergedPreferences), userId]
    );

    await client.query('COMMIT');

    const updatedPreferences = updateResult.rows[0].preferences;
    const updatedAt = updateResult.rows[0].updated_at;

    console.log(`[Preferences] PATCH success for user ${userId}`, {
      fieldsUpdated: Object.keys(newPreferences),
    });

    res.status(200).json({
      preferences: updatedPreferences,
      updatedAt: updatedAt,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Preferences] PATCH error:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

/**
 * PUT /api/user/preferences
 *
 * Replaces the authenticated user's preferences entirely
 * Does NOT merge - completely overwrites existing preferences
 */
export const replacePreferences = async (req, res) => {
  const client = await pool.connect();

  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[Preferences] PUT validation errors for user ${req.user.userId}:`, errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const newPreferences = req.body;

    // Ensure it's a valid object
    if (typeof newPreferences !== 'object' || Array.isArray(newPreferences)) {
      return res.status(400).json({ error: 'Preferences must be a JSON object' });
    }

    // Start transaction
    await client.query('BEGIN');

    // Check if user exists
    const userExists = await client.query(
      'SELECT id FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userExists.rows.length === 0) {
      await client.query('ROLLBACK');
      console.error(`[Preferences] User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Replace preferences entirely
    const updateResult = await client.query(
      'UPDATE users SET preferences = $1::jsonb WHERE id = $2 RETURNING preferences, updated_at',
      [JSON.stringify(newPreferences), userId]
    );

    await client.query('COMMIT');

    const updatedPreferences = updateResult.rows[0].preferences;
    const updatedAt = updateResult.rows[0].updated_at;

    console.log(`[Preferences] PUT success for user ${userId}`);

    res.status(200).json({
      preferences: updatedPreferences,
      updatedAt: updatedAt,
      message: 'Preferences replaced successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Preferences] PUT error:', error);
    res.status(500).json({
      error: 'Failed to replace preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/user/preferences
 *
 * Resets the authenticated user's preferences to default (empty object)
 */
export const resetPreferences = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Reset to empty object
    const result = await pool.query(
      'UPDATE users SET preferences = $1::jsonb WHERE id = $2 RETURNING preferences, updated_at',
      ['{}', userId]
    );

    if (result.rows.length === 0) {
      console.error(`[Preferences] User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Preferences] DELETE success for user ${userId}`);

    res.status(200).json({
      preferences: result.rows[0].preferences,
      updatedAt: result.rows[0].updated_at,
      message: 'Preferences reset to default',
    });
  } catch (error) {
    console.error('[Preferences] DELETE error:', error);
    res.status(500).json({
      error: 'Failed to reset preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
