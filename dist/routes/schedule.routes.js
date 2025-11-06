"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const client_1 = require("@prisma/client");
const schedule_controller_1 = require("../controllers/schedule.controller");
const router = (0, express_1.Router)();
// GET /api/schedule/:doctorId — Ver disponibilidad del médico
router.get('/:doctorId', auth_middleware_1.authenticateToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO, client_1.Role.ENFERMERA), schedule_controller_1.getDoctorAvailability);
// POST /api/schedule/:doctorId — Configurar horarios (bloques de 30 min)
router.post('/:doctorId', auth_middleware_1.authenticateToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO), schedule_controller_1.configureDoctorSchedule);
// PATCH /api/schedule/:doctorId/block — Bloquear horarios por mantenimiento o ausencia
router.patch('/:doctorId/block', auth_middleware_1.authenticateToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO), schedule_controller_1.blockDoctorSchedule);
exports.default = router;
//# sourceMappingURL=schedule.routes.js.map