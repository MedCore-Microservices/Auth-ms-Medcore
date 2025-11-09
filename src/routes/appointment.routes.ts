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
  cancelAppointment,
  confirmAppointmentAction,
  startAppointmentAction,
  completeAppointmentAction,
  markNoShowAppointmentAction
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

// Acciones de estado específicas
// POST /api/appointments/:id/confirm — Confirmar cita
router.post('/:id/confirm', authenticateToken, canManageAppointments, confirmAppointmentAction);
// POST /api/appointments/:id/start — Marcar en curso
router.post('/:id/start', authenticateToken, canManageAppointments, startAppointmentAction);
// Alias histórico: /in-progress
router.post('/:id/in-progress', authenticateToken, canManageAppointments, startAppointmentAction);
// POST /api/appointments/:id/complete — Completar cita
router.post('/:id/complete', authenticateToken, canManageAppointments, completeAppointmentAction);
// POST /api/appointments/:id/mark-no-show — Paciente no se presentó
router.post('/:id/mark-no-show', authenticateToken, canManageAppointments, markNoShowAppointmentAction);

export default router;
