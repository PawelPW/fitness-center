import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as trainingController from '../controllers/trainingController.js';

const router = express.Router();

router.use(authenticate);

router.get('/', trainingController.getAllPrograms);
router.get('/:id', trainingController.getProgramById);
router.post('/', trainingController.createProgram);
router.put('/:id', trainingController.updateProgram);
router.delete('/:id', trainingController.deleteProgram);

export default router;
