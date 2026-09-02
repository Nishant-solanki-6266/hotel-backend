import { Router } from 'express';
import authRoutes from './modules/auth/authRoutes.js';
import roomsRoutes from './modules/rooms/roomsRoutes.js';
import tasksRoutes from './modules/tasks/tasksRoutes.js';
import issuesRoutes from './modules/issues/issuesRoutes.js';
import conversationsRoutes from './modules/conversations/conversationsRoutes.js';
import managerRoutes from './modules/manager/managerRoutes.js';
import upsellsRoutes from './modules/upsells/upsellsRoutes.js';
import whatsappRoutes from './modules/whatsapp/whatsappRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'hotelogx-connect-backend', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/rooms', roomsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/issues', issuesRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/manager', managerRoutes);
router.use('/upsells', upsellsRoutes);
router.use('/whatsapp', whatsappRoutes);

export default router;
