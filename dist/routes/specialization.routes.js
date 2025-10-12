"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const specialization_controller_1 = require("../controllers/specialization.controller");
const router = (0, express_1.Router)();
router.get('/specializations/:departmentName', specialization_controller_1.listSpecializationsByDepartment);
exports.default = router;
//# sourceMappingURL=specialization.routes.js.map