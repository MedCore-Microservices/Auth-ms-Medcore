"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const client_1 = require("@prisma/client");
const nurse_controller_1 = require("../controllers/nurse.controller");
const router = (0, express_1.Router)();
// Solo ADMINISTRADOR, MEDICO o ENFERMERA pueden gestionar enfermeras
const canManageNurses = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO, client_1.Role.ENFERMERA);
// GET /api/nurses → listar enfermeras (paginado)
router.get('/', auth_middleware_1.authenticateToken, canManageNurses, nurse_controller_1.getNurses);
// GET /api/nurses/:id → obtener enfermera por ID
router.get('/:id', auth_middleware_1.authenticateToken, canManageNurses, nurse_controller_1.getNurseById);
// PUT /api/nurses/:id → actualizar datos de la enfermera
router.put('/:id', auth_middleware_1.authenticateToken, canManageNurses, nurse_controller_1.updateNurse);
// PATCH /api/nurses/state/:id → actualizar estado (ACTIVO/INACTIVO)
router.patch('/state/:id', auth_middleware_1.authenticateToken, canManageNurses, nurse_controller_1.updateNurseState);
exports.default = router;
//# sourceMappingURL=nurse.routes.js.map