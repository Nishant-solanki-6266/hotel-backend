import { Router } from 'express';
import { optionalAuth } from '../../middlewares/auth.js';
import { getTasks, getTaskById, createTask, updateTaskStatus } from './tasksController.js';

const router = Router();
router.use(optionalAuth);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTaskById);
router.patch('/:id/status', updateTaskStatus);

export default router;
