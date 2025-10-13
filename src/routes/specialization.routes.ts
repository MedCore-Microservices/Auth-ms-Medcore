import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import {
  getSpecializations,
  getSpecializationById,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization
} from '../controllers/specialization.controller';

const router = Router();

// Solo ADMINISTRADOR puede gestionar especialidades
const canManageSpecializations = authorizeRoles(Role.ADMINISTRADOR);

// GET /api/specializations → listar especialidades (paginado)
router.get('/', authenticateToken, getSpecializations);

// GET /api/specializations/:id → obtener especialidad por ID
router.get('/:id', authenticateToken, getSpecializationById);

// POST /api/specializations → crear nueva especialidad
router.post('/', authenticateToken, canManageSpecializations, createSpecialization);

// PUT /api/specializations/:id → actualizar especialidad
router.put('/:id', authenticateToken, canManageSpecializations, updateSpecialization);

// DELETE /api/specializations/:id → eliminar especialidad
router.delete('/:id', authenticateToken, canManageSpecializations, deleteSpecialization);

export default router;