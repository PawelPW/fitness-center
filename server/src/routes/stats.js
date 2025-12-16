import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as statsController from '../controllers/statsController.js';

const router = express.Router();

// All stats routes require authentication
router.use(authenticate);

// Exercise statistics endpoints
router.get('/exercises', statsController.getAllExerciseStats);
router.get('/exercises/:exerciseName/history', statsController.getExerciseHistory);
router.get('/exercises/:exerciseName/prs', statsController.getExercisePRs);
router.get('/exercises/:exerciseName/volume', statsController.getVolumeStats);

export default router;
