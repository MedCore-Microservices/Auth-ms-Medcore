import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import { getDoctorAvailability, configureDoctorSchedule, blockDoctorSchedule } from '../controllers/schedule.controller';

const router = Router();

// GET /api/schedule/:doctorId — Ver disponibilidad del médico
router.get(
  '/:doctorId',
  authenticateToken,
  authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO, Role.ENFERMERA),
  getDoctorAvailability
);

// POST /api/schedule/:doctorId — Configurar horarios (bloques de 30 min)
router.post(
  '/:doctorId',
  authenticateToken,
  authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO),
  configureDoctorSchedule
);

// PATCH /api/schedule/:doctorId/block — Bloquear horarios por mantenimiento o ausencia
router.patch(
  '/:doctorId/block',
  authenticateToken,
  authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO),
  blockDoctorSchedule
);

export default router;
