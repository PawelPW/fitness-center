import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as sessionController from '../controllers/sessionController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', sessionController.getAllSessions);
router.get('/stats', sessionController.getSessionStats);
router.get('/upcoming', sessionController.getUpcomingPlannedSessions); // BE-5: Get upcoming planned sessions
router.get('/:id', sessionController.getSessionById);
router.post('/', sessionController.createSession);
router.post('/planned', sessionController.createPlannedSession); // BE-2: Create planned session
router.post('/planned/bulk', sessionController.bulkCreatePlannedSessions); // BE-6: Bulk create planned sessions
router.put('/planned/:id', sessionController.updatePlannedSession); // BE-3: Update planned session
router.delete('/planned/:id', sessionController.deletePlannedSession); // BE-4: Delete planned session
router.patch('/:id', sessionController.updateSession);
router.post('/:sessionId/exercises', sessionController.createSessionExercise);
router.delete('/:id', sessionController.deleteSession);

export default router;
