import { Router } from 'express';
import { getThreads, handleAction } from './whatsappController.js';

const router = Router();

router.get('/threads', getThreads);
router.post('/action', handleAction);

export default router;
