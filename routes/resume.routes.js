import express from 'express';
import { authenticateToken } from '../middlewares/jwt.js';
import { handleUploadMiddleware } from '../middlewares/multer.js';
import { analyzeResume, getUserAnalyses } from '../controllers/resume.controller.js';

const router = express.Router();

router.post('/analyze', authenticateToken, handleUploadMiddleware, analyzeResume);
router.get('/analyses', authenticateToken, getUserAnalyses);

export default router;
