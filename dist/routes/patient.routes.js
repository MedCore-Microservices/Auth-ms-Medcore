"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const authorization_middleware_1 = require("../middleware/authorization.middleware");
const client_1 = require("@prisma/client");
const patient_controller_1 = require("../controllers/patient.controller");
const bulk_upload_controller_1 = require("../controllers/bulk-upload.controller");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// Solo ADMINISTRADOR, MEDICO o ENFERMERA pueden gestionar pacientes
const canManagePatients = (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR, client_1.Role.MEDICO, client_1.Role.ENFERMERA);
// GET /api/patients → listar pacientes (paginado)
router.get('/', auth_middleware_1.authenticateToken, canManagePatients, patient_controller_1.getPatients);
// GET /api/patients/:id → obtener paciente por ID
router.get('/:id', auth_middleware_1.authenticateToken, canManagePatients, patient_controller_1.getPatientById);
// PUT /api/patients/:id → actualizar datos del paciente
router.put('/:id', auth_middleware_1.authenticateToken, canManagePatients, patient_controller_1.updatePatient);
// PATCH /api/patients/state/:id → actualizar estado (ACTIVO/INACTIVO)
router.patch('/state/:id', auth_middleware_1.authenticateToken, canManagePatients, patient_controller_1.updatePatientState);
// POST /bulk-import → cargue masivo (solo ADMINISTRADOR)
router.post('/bulk-import', auth_middleware_1.authenticateToken, (0, authorization_middleware_1.authorizeRoles)(client_1.Role.ADMINISTRADOR), upload_middleware_1.upload.single('file'), bulk_upload_controller_1.bulkUploadUsers);
exports.default = router;
//# sourceMappingURL=patient.routes.js.map