import { Router } from 'express';
import {
  getConversations,
  getConversationById,
  sendReply,
  toggleTakeover,
} from './conversationsController.js';

const router = Router();

router.get('/', getConversations);
router.get('/:id', getConversationById);
router.post('/:id/reply', sendReply);
router.post('/:id/takeover', toggleTakeover);

export default router;
