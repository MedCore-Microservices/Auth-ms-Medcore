"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const client_1 = require("@prisma/client");
const appointment_controller_1 = require("../controllers/appointment.controller");
const router = (0, express_1.Router)();
// Roles permitidos: ADMINISTRADOR, MEDICO, ENFERMERA
const canManageAppointments = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO, client_1.Role.ENFERMERA);
// POST /api/appointments — Crear cita
router.post('/', auth_middleware_1.authenticateToken, canManageAppointments, appointment_controller_1.createAppointment);
// GET /api/appointments/:id — Consultar cita por ID
router.get('/:id', auth_middleware_1.authenticateToken, canManageAppointments, appointment_controller_1.getAppointmentById);
// GET /api/appointments/patient/:patientId — Citas de un paciente
router.get('/patient/:patientId', auth_middleware_1.authenticateToken, canManageAppointments, appointment_controller_1.getAppointmentsByPatient);
// GET /api/appointments/doctor/:doctorId — Citas de un doctor
router.get('/doctor/:doctorId', auth_middleware_1.authenticateToken, canManageAppointments, appointment_controller_1.getAppointmentsByDoctor);
// PUT /api/appointments/:id — Modificar cita
router.put('/:id', auth_middleware_1.authenticateToken, canManageAppointments, appointment_controller_1.updateAppointment);
// DELETE /api/appointments/:id — Cancelar cita (soft cancel)
router.delete('/:id', auth_middleware_1.authenticateToken, canManageAppointments, appointment_controller_1.cancelAppointment);
exports.default = router;
//# sourceMappingURL=appointment.routes.js.map