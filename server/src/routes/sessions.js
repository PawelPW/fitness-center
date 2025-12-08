import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as sessionController from '../controllers/sessionController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', sessionController.getAllSessions);
router.get('/stats', sessionController.getSessionStats);
router.get('/:id', sessionController.getSessionById);
router.post('/', sessionController.createSession);
router.patch('/:id', sessionController.updateSession);
router.post('/:sessionId/exercises', sessionController.createSessionExercise);
router.delete('/:id', sessionController.deleteSession);

export default router;
