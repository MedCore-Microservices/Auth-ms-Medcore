"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const client_1 = require("@prisma/client");
const specialization_controller_1 = require("../controllers/specialization.controller");
const router = (0, express_1.Router)();
// Solo ADMINISTRADOR puede gestionar especialidades
const canManageSpecializations = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR);
// GET /api/specializations → listar especialidades (paginado)
router.get('/', auth_middleware_1.authenticateToken, specialization_controller_1.getSpecializations);
// GET /api/specializations/:id → obtener especialidad por ID
router.get('/:id', auth_middleware_1.authenticateToken, specialization_controller_1.getSpecializationById);
// POST /api/specializations → crear nueva especialidad
router.post('/', auth_middleware_1.authenticateToken, canManageSpecializations, specialization_controller_1.createSpecialization);
// PUT /api/specializations/:id → actualizar especialidad
router.put('/:id', auth_middleware_1.authenticateToken, canManageSpecializations, specialization_controller_1.updateSpecialization);
// DELETE /api/specializations/:id → eliminar especialidad
router.delete('/:id', auth_middleware_1.authenticateToken, canManageSpecializations, specialization_controller_1.deleteSpecialization);
exports.default = router;
//# sourceMappingURL=specialization.routes.js.map