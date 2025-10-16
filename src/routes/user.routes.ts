// src/routes/user.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import { getUsersByRole } from '../controllers/doctor.controller';

const router = Router();

// Protegido: solo ADMIN, MEDICO o ENFERMERA pueden filtrar por rol
const canAccessUserList = authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO, Role.ENFERMERA);

router.get('/by-role', authenticateToken, canAccessUserList, getUsersByRole);

export default router;