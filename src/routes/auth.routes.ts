
import { Router } from 'express';
import { getProfile, login, register } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
export default router;