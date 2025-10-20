// src/routes/user.routes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import { createDoctor, getDoctorById, getDoctorsBySpecialty, getUsersByRole, updateDoctor, updateDoctorState,  getUsersWithFilters,
  getFiltersMetadata} from '../controllers/doctor.controller';
import { createNurse, getNurseById, updateNurse, updateNurseState } from '../controllers/nurse.controller';

const router = Router();

// Protegido: solo ADMIN, MEDICO o ENFERMERA pueden filtrar por rol
const adminOnly = authorizeRoles(Role.ADMINISTRADOR);
const canManageUsers = authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO, Role.ENFERMERA);
const canEditUsers = authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO);

// Rutas de DOCTORES
router.post('/doctors', authenticateToken, adminOnly, createDoctor);
router.get('/doctors/:id', authenticateToken, canManageUsers, getDoctorById);
router.put('/doctors/:id', authenticateToken, canEditUsers, updateDoctor);
router.patch('/doctors/state/:id', authenticateToken, adminOnly, updateDoctorState);

// Rutas de ENFERMERAS
router.post('/nurses', authenticateToken, adminOnly, createNurse);
router.get('/nurses/:id', authenticateToken, canManageUsers, getNurseById);
router.put('/nurses/:id', authenticateToken, canEditUsers, updateNurse);
router.patch('/nurses/state/:id', authenticateToken, adminOnly, updateNurseState);

// Rutas de consulta
router.get('/by-role', authenticateToken, canManageUsers, getUsersByRole);
router.get('/by-specialty', authenticateToken, canManageUsers, getDoctorsBySpecialty)

//Endpoint unificado con filtros avanzados
router.get('/', authenticateToken, canManageUsers, getUsersWithFilters);

// NUEVO: Metadatos para los filtros
router.get('/filters/metadata', authenticateToken, canManageUsers, getFiltersMetadata);

export default router;