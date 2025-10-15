import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import {
  getDoctors,
  getDoctorById,
  updateDoctor,
  updateDoctorState,
  getSpecializations,
  getDepartments
} from '../controllers/doctor.controller';

const router = Router();

// Solo ADMINISTRADOR, MEDICO o ENFERMERA pueden gestionar médicos
const canManageDoctors = authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO, Role.ENFERMERA);

// Solo ADMINISTRADOR puede cambiar estados
const canChangeState = authorizeRoles(Role.ADMINISTRADOR);

// Solo el propio médico o ADMINISTRADOR puede editar datos completos
const canEditDoctor = authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO);

// Rutas públicas para obtener especializaciones y departamentos
router.get('/specializations', getSpecializations);
router.get('/departments', getDepartments);

// GET /api/doctors → listar médicos (paginado)
router.get('/', authenticateToken, canManageDoctors, getDoctors);

// GET /api/doctors/:id → obtener médico por ID
router.get('/:id', authenticateToken, canManageDoctors, getDoctorById);

// PUT /api/doctors/:id → actualizar datos del médico
router.put('/:id', authenticateToken, canEditDoctor, updateDoctor);

// PATCH /api/doctors/state/:id → actualizar estado (ACTIVO/INACTIVO)
router.patch('/state/:id', authenticateToken, canChangeState, updateDoctorState);

export default router;