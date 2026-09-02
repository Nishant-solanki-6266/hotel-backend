import { Router } from 'express';
import {
  getBriefing,
  getActivityFeed,
  getAiRules,
  getKnowledgeDocs,
} from './managerController.js';

const router = Router();

router.get('/briefing', getBriefing);
router.get('/activity', getActivityFeed);
router.get('/rules', getAiRules);
router.get('/knowledge', getKnowledgeDocs);

export default router;
