import express from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, userController.getProfile);

// Update user profile
router.put(
  '/profile',
  authenticate,
  [
    body('username').optional().trim().isLength({ min: 3 }).escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('age').optional().isInt({ min: 13, max: 120 }),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('weight_kg').optional().isFloat({ min: 20, max: 500 }),
    body('height_cm').optional().isFloat({ min: 50, max: 300 }),
    body('target_weight_kg').optional().isFloat({ min: 20, max: 500 }),
    body('fitness_goal').optional().isIn(['weight_loss', 'muscle_gain', 'maintenance', 'endurance']),
    body('activity_level').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    body('weekly_workout_target').optional().isInt({ min: 1, max: 14 }),
  ],
  userController.updateProfile
);

export default router;
