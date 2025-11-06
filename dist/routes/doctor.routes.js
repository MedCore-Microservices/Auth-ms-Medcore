"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const client_1 = require("@prisma/client");
const doctor_controller_1 = require("../controllers/doctor.controller");
const router = (0, express_1.Router)();
// Solo ADMINISTRADOR, MEDICO o ENFERMERA pueden gestionar médicos
const canManageDoctors = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO, client_1.Role.ENFERMERA);
const adminOnly = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR);
router.post('/', auth_middleware_1.authenticateToken, adminOnly, doctor_controller_1.createDoctor);
router.get('/users/by-role', doctor_controller_1.getUsersByRole);
router.get('/users/by-specialty', doctor_controller_1.getDoctorsBySpecialty);
// Solo ADMINISTRADOR puede cambiar estados
const canChangeState = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR);
// Solo el propio médico o ADMINISTRADOR puede editar datos completos
const canEditDoctor = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO);
// Rutas públicas para obtener especializaciones y departamentos
router.get('/specializations', doctor_controller_1.getSpecializations);
router.get('/departments', doctor_controller_1.getDepartments);
// GET /api/doctors → listar médicos (paginado)
router.get('/', auth_middleware_1.authenticateToken, canManageDoctors, doctor_controller_1.getDoctors);
// GET /api/doctors/:id → obtener médico por ID
router.get('/:id', auth_middleware_1.authenticateToken, canManageDoctors, doctor_controller_1.getDoctorById);
// PUT /api/doctors/:id → actualizar datos del médico
router.put('/:id', auth_middleware_1.authenticateToken, canEditDoctor, doctor_controller_1.updateDoctor);
// PATCH /api/doctors/state/:id → actualizar estado (ACTIVO/INACTIVO)
router.patch('/state/:id', auth_middleware_1.authenticateToken, canChangeState, doctor_controller_1.updateDoctorState);
exports.default = router;
//# sourceMappingURL=doctor.routes.js.map