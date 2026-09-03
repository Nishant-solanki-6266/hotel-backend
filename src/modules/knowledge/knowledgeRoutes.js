import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { listKnowledge, uploadKnowledge, deleteKnowledge } from './knowledgeController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'];
    const allowedExts = ['.pdf', '.docx', '.txt', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, TXT, CSV are allowed.'));
    }
  },
});

router.use(authenticate);
router.get('/', listKnowledge);
router.post('/', upload.single('file'), uploadKnowledge);
router.delete('/:id', deleteKnowledge);

export default router;
