"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDepartmentsWithSpecializations = exports.getDepartmentSpecializations = exports.getDepartments = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        users: true,
                        specializations: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.status(200).json({
            departments
        });
    }
    catch (error) {
        console.error('Error listando departamentos:', error);
        return res.status(500).json({
            message: 'Error al obtener la lista de departamentos.'
        });
    }
};
exports.getDepartments = getDepartments;
// GET /api/departments/:departmentId/specializations - Especialidades por departamento
const getDepartmentSpecializations = async (req, res) => {
    try {
        const { departmentId } = req.params;
        const id = parseInt(departmentId, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'ID de departamento inválido.' });
        }
        // Verificar si el departamento existe
        const department = await prisma.department.findUnique({
            where: { id }
        });
        if (!department) {
            return res.status(404).json({ message: 'Departamento no encontrado.' });
        }
        // Obtener especialidades del departamento
        const specializations = await prisma.specialization.findMany({
            where: {
                departmentId: id
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                _count: {
                    select: {
                        users: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.status(200).json({
            department: {
                id: department.id,
                name: department.name
            },
            specializations
        });
    }
    catch (error) {
        console.error('Error obteniendo especialidades:', error);
        return res.status(500).json({
            message: 'Error al obtener las especialidades del departamento.'
        });
    }
};
exports.getDepartmentSpecializations = getDepartmentSpecializations;
// GET /api/departments/specializations/all - Todos los departamentos con sus especialidades
const getAllDepartmentsWithSpecializations = async (req, res) => {
    try {
        const departmentsWithSpecializations = await prisma.department.findMany({
            include: {
                specializations: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true
                    },
                    orderBy: {
                        name: 'asc'
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return res.status(200).json({
            departments: departmentsWithSpecializations
        });
    }
    catch (error) {
        console.error('Error obteniendo departamentos con especialidades:', error);
        return res.status(500).json({
            message: 'Error al obtener los departamentos con especialidades.'
        });
    }
};
exports.getAllDepartmentsWithSpecializations = getAllDepartmentsWithSpecializations;
//# sourceMappingURL=department.controller.js.map