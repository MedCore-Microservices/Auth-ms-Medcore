
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import {
  getPatients,
  getPatientById,
  updatePatient,
  updatePatientState
} from '../controllers/patient.controller';

const router = Router();

// Solo ADMINISTRADOR, MEDICO o ENFERMERA pueden gestionar pacientes
const canManagePatients = authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO, Role.ENFERMERA);

// GET /api/patients → listar pacientes (paginado)
router.get('/', authenticateToken, canManagePatients, getPatients);

// GET /api/patients/:id → obtener paciente por ID
router.get('/:id', authenticateToken, canManagePatients, getPatientById);

// PUT /api/patients/:id → actualizar datos del paciente
router.put('/:id', authenticateToken, canManagePatients, updatePatient);

// PATCH /api/patients/state/:id → actualizar estado (ACTIVO/INACTIVO)
router.patch('/state/:id', authenticateToken, canManagePatients, updatePatientState);

export default router;