"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSpecializationsByDepartment = void 0;
const specialization_service_1 = require("../services/specialization.service");
const listSpecializationsByDepartment = async (req, res) => {
    const { departmentName } = req.params;
    try {
        const specializations = await (0, specialization_service_1.getSpecializationsByDepartment)(departmentName);
        res.status(200).json(specializations);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.listSpecializationsByDepartment = listSpecializationsByDepartment;
//# sourceMappingURL=specialization.controller.js.map