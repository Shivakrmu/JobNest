import express from 'express';
import { login, getSession, logout, supabaseVerify, googleAuth } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/google', googleAuth);
router.post('/supabase', supabaseVerify);
router.get('/session', authenticateToken, getSession);
router.post('/logout', authenticateToken, logout);

export default router;

