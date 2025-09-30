import { Router } from 'express';
import { bulkUploadUsers } from '../controllers/bulk-upload.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Solo usuarios autenticados pueden hacer cargue masivo
router.post('/bulk-upload/users', authenticateToken, bulkUploadUsers);

export default router;