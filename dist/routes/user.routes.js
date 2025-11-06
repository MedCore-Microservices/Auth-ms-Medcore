"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const client_1 = require("@prisma/client");
const doctor_controller_1 = require("../controllers/doctor.controller");
const nurse_controller_1 = require("../controllers/nurse.controller");
const router = (0, express_1.Router)();
// Protegido: solo ADMIN, MEDICO o ENFERMERA pueden filtrar por rol
const adminOnly = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR);
const canManageUsers = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO, client_1.Role.ENFERMERA);
const canEditUsers = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO);
// Rutas de DOCTORES
router.post('/doctors', auth_middleware_1.authenticateToken, adminOnly, doctor_controller_1.createDoctor);
router.get('/doctors/:id', auth_middleware_1.authenticateToken, canManageUsers, doctor_controller_1.getDoctorById);
router.put('/doctors/:id', auth_middleware_1.authenticateToken, canEditUsers, doctor_controller_1.updateDoctor);
router.patch('/doctors/state/:id', auth_middleware_1.authenticateToken, adminOnly, doctor_controller_1.updateDoctorState);
// Rutas de ENFERMERAS
router.post('/nurses', auth_middleware_1.authenticateToken, adminOnly, nurse_controller_1.createNurse);
router.get('/nurses/:id', auth_middleware_1.authenticateToken, canManageUsers, nurse_controller_1.getNurseById);
router.put('/nurses/:id', auth_middleware_1.authenticateToken, canEditUsers, nurse_controller_1.updateNurse);
router.patch('/nurses/state/:id', auth_middleware_1.authenticateToken, adminOnly, nurse_controller_1.updateNurseState);
// Rutas de consulta
router.get('/by-role', auth_middleware_1.authenticateToken, canManageUsers, doctor_controller_1.getUsersByRole);
router.get('/by-specialty', auth_middleware_1.authenticateToken, canManageUsers, doctor_controller_1.getDoctorsBySpecialty);
//Endpoint unificado con filtros avanzados
router.get('/', auth_middleware_1.authenticateToken, canManageUsers, doctor_controller_1.getUsersWithFilters);
// NUEVO: Metadatos para los filtros
router.get('/filters/metadata', auth_middleware_1.authenticateToken, canManageUsers, doctor_controller_1.getFiltersMetadata);
exports.default = router;
//# sourceMappingURL=user.routes.js.map