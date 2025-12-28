import { validationResult } from 'express-validator';
import pool from '../config/database.js';

/**
 * Get user profile
 * @route GET /api/user/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, username, email, joined_date, age, gender,
              weight_kg, height_cm, target_weight_kg, fitness_goal,
              activity_level, weekly_workout_target, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        joinedDate: user.joined_date,
        age: user.age,
        gender: user.gender,
        weight_kg: user.weight_kg,
        height_cm: user.height_cm,
        target_weight_kg: user.target_weight_kg,
        fitness_goal: user.fitness_goal,
        activity_level: user.activity_level,
        weekly_workout_target: user.weekly_workout_target,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
};

/**
 * Update user profile
 * @route PUT /api/user/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const {
      username,
      email,
      age,
      gender,
      weight_kg,
      height_cm,
      target_weight_kg,
      fitness_goal,
      activity_level,
      weekly_workout_target
    } = req.body;

    // Check if username or email is being changed and already exists for another user
    if (username || email) {
      const checkQuery = username && email
        ? 'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3'
        : username
        ? 'SELECT id FROM users WHERE username = $1 AND id != $2'
        : 'SELECT id FROM users WHERE email = $1 AND id != $2';

      const checkParams = username && email
        ? [username, email, userId]
        : username
        ? [username, userId]
        : [email, userId];

      const existingUser = await pool.query(checkQuery, checkParams);

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          error: 'Username or email already taken'
        });
      }
    }

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (age !== undefined) {
      updates.push(`age = $${paramIndex++}`);
      values.push(age);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`);
      values.push(gender);
    }
    if (weight_kg !== undefined) {
      updates.push(`weight_kg = $${paramIndex++}`);
      values.push(weight_kg);
    }
    if (height_cm !== undefined) {
      updates.push(`height_cm = $${paramIndex++}`);
      values.push(height_cm);
    }
    if (target_weight_kg !== undefined) {
      updates.push(`target_weight_kg = $${paramIndex++}`);
      values.push(target_weight_kg);
    }
    if (fitness_goal !== undefined) {
      updates.push(`fitness_goal = $${paramIndex++}`);
      values.push(fitness_goal);
    }
    if (activity_level !== undefined) {
      updates.push(`activity_level = $${paramIndex++}`);
      values.push(activity_level);
    }
    if (weekly_workout_target !== undefined) {
      updates.push(`weekly_workout_target = $${paramIndex++}`);
      values.push(weekly_workout_target);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add user ID as final parameter
    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, joined_date, age, gender,
                weight_kg, height_cm, target_weight_kg, fitness_goal,
                activity_level, weekly_workout_target, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        joinedDate: user.joined_date,
        age: user.age,
        gender: user.gender,
        weight_kg: user.weight_kg,
        height_cm: user.height_cm,
        target_weight_kg: user.target_weight_kg,
        fitness_goal: user.fitness_goal,
        activity_level: user.activity_level,
        weekly_workout_target: user.weekly_workout_target,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
