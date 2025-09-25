
import { Router } from 'express';
import { getProfile, login, logout, refreshToken, register, registerPublicUser } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { refreshTokenMiddleware } from '../middleware/refreshToken.middleware';

const router = Router();

router.post('/seguridad/registro-publico-usuarios', registerPublicUser);
//router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.post('/refresh-token', refreshTokenMiddleware, refreshToken);
export default router;