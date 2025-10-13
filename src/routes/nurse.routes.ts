import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import {
  getNurses,
  getNurseById,
  updateNurse,
  updateNurseState
} from '../controllers/nurse.controller';

const router = Router();

// Solo ADMINISTRADOR, MEDICO o ENFERMERA pueden gestionar enfermeras
const canManageNurses = authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO, Role.ENFERMERA);

// GET /api/nurses → listar enfermeras (paginado)
router.get('/', authenticateToken, canManageNurses, getNurses);

// GET /api/nurses/:id → obtener enfermera por ID
router.get('/:id', authenticateToken, canManageNurses, getNurseById);

// PUT /api/nurses/:id → actualizar datos de la enfermera
router.put('/:id', authenticateToken, canManageNurses, updateNurse);

// PATCH /api/nurses/state/:id → actualizar estado (ACTIVO/INACTIVO)
router.patch('/state/:id', authenticateToken, canManageNurses, updateNurseState);

export default router;