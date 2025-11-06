"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const client_1 = require("@prisma/client");
const department_controller_1 = require("../controllers/department.controller");
const router = (0, express_1.Router)();
// Solo personal autorizado puede acceder a estos endpoints
const canAccessDepartments = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO, client_1.Role.ENFERMERA);
// GET /api/departments → listar todos los departamentos
router.get('/', auth_middleware_1.authenticateToken, canAccessDepartments, department_controller_1.getDepartments);
// GET /api/departments/specializations/all → todos los departamentos con especialidades
router.get('/specializations/all', auth_middleware_1.authenticateToken, canAccessDepartments, department_controller_1.getAllDepartmentsWithSpecializations);
// GET /api/departments/:departmentId/specializations → especialidades por departamento
router.get('/:departmentId/specializations', auth_middleware_1.authenticateToken, canAccessDepartments, department_controller_1.getDepartmentSpecializations);
exports.default = router;
//# sourceMappingURL=department.routes.js.map