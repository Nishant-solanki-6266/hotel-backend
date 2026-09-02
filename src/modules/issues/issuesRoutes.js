import { Router } from 'express';
import { getIssues, createIssue, updateIssueStatus } from './issuesController.js';

const router = Router();

router.get('/', getIssues);
router.post('/', createIssue);
router.patch('/:id/status', updateIssueStatus);

export default router;
