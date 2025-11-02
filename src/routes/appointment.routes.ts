import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import {
  createAppointment,
  getAppointmentById,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  updateAppointment,
  cancelAppointment
} from '../controllers/appointment.controller';

const router = Router();

// Roles permitidos: ADMINISTRADOR, MEDICO, ENFERMERA
const canManageAppointments = authorizeRoles(Role.ADMINISTRADOR, Role.MEDICO, Role.ENFERMERA);

// POST /api/appointments — Crear cita
router.post('/', authenticateToken, canManageAppointments, createAppointment);

// GET /api/appointments/:id — Consultar cita por ID
router.get('/:id', authenticateToken, canManageAppointments, getAppointmentById);

// GET /api/appointments/patient/:patientId — Citas de un paciente
router.get('/patient/:patientId', authenticateToken, canManageAppointments, getAppointmentsByPatient);

// GET /api/appointments/doctor/:doctorId — Citas de un doctor
router.get('/doctor/:doctorId', authenticateToken, canManageAppointments, getAppointmentsByDoctor);

// PUT /api/appointments/:id — Modificar cita
router.put('/:id', authenticateToken, canManageAppointments, updateAppointment);

// DELETE /api/appointments/:id — Cancelar cita (soft cancel)
router.delete('/:id', authenticateToken, canManageAppointments, cancelAppointment);

export default router;
