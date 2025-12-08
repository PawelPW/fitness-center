import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as exerciseController from '../controllers/exerciseController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', exerciseController.getAllExercises);
router.get('/type/:type', exerciseController.getExercisesByType);
router.post('/', exerciseController.createExercise);
router.put('/:id', exerciseController.updateExercise);
router.delete('/:id', exerciseController.deleteExercise);

export default router;
