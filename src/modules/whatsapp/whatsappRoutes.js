import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
  getThreads,
  handleAction,
  verifyWebhook,
  handleWebhook,
  sendTestMessage,
  handleEmbeddedSignupExchange,
  handleOAuthCallback,
} from './whatsappController.js';

const router = Router();

router.get('/threads', authenticate, getThreads);
router.post('/action', authenticate, handleAction);
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);
router.post('/send', authenticate, sendTestMessage);
router.post('/embedded-signup', authenticate, handleEmbeddedSignupExchange);
router.get('/oauth/callback', handleOAuthCallback);

export default router;


