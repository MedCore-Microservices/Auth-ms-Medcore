"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecializationsByDepartment = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getSpecializationsByDepartment = async (departmentName) => {
    try {
        const department = await prisma.department.findUnique({
            where: { name: departmentName },
            include: {
                users: {
                    where: { role: 'MEDICO' }, // Filtrar solo médicos
                    select: {
                        specialization: true, // Obtener especialidades
                    },
                },
            },
        });
        if (!department) {
            throw new Error(`El departamento "${departmentName}" no existe.`);
        }
        // Extraer especialidades únicas
        const specializations = department.users
            .map((user) => user.specialization?.name)
            .filter((name) => name !== undefined);
        return Array.from(new Set(specializations)); // Eliminar duplicados
    }
    catch (error) {
        console.error('Error al listar especialidades por departamento:', error);
        throw error;
    }
};
exports.getSpecializationsByDepartment = getSpecializationsByDepartment;
//# sourceMappingURL=specialization.service.js.map