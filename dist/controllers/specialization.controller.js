"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSpecialization = exports.updateSpecialization = exports.createSpecialization = exports.getSpecializationById = exports.getSpecializations = void 0;
const client_1 = require("@prisma/client");
const audit_service_1 = require("../services/audit.service");
const prisma = new client_1.PrismaClient();
// GET /api/specializations - Listar todas las especialidades
const getSpecializations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const departmentId = req.query.departmentId ? parseInt(req.query.departmentId) : undefined;
        const skip = (page - 1) * limit;
        const where = {};
        if (departmentId && !isNaN(departmentId)) {
            where.departmentId = departmentId;
        }
        const [specializations, total] = await Promise.all([
            prisma.specialization.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            users: true
                        }
                    },
                    department: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.specialization.count({ where })
        ]);
        return res.status(200).json({
            specializations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error listando especialidades:', error);
        return res.status(500).json({ message: 'Error al obtener la lista de especialidades.' });
    }
};
exports.getSpecializations = getSpecializations;
// GET /api/specializations/:id - Obtener especialidad por ID
const getSpecializationById = async (req, res) => {
    try {
        const { id } = req.params;
        const specializationId = parseInt(id, 10);
        if (isNaN(specializationId)) {
            return res.status(400).json({ message: 'ID de especialidad inválido.' });
        }
        const specialization = await prisma.specialization.findUnique({
            where: { id: specializationId },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                users: {
                    select: {
                        id: true,
                        fullname: true,
                        email: true,
                        status: true
                    }
                }
            }
        });
        if (!specialization) {
            return res.status(404).json({ message: 'Especialidad no encontrada.' });
        }
        return res.status(200).json({ specialization });
    }
    catch (error) {
        console.error('Error obteniendo especialidad:', error);
        return res.status(500).json({ message: 'Error al obtener la especialidad.' });
    }
};
exports.getSpecializationById = getSpecializationById;
// POST /api/specializations - Crear nueva especialidad
const createSpecialization = async (req, res) => {
    try {
        const { name, departmentId } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'El nombre de la especialidad es obligatorio.' });
        }
        // Verificar si el departamento existe si se proporciona
        if (departmentId) {
            const department = await prisma.department.findUnique({
                where: { id: departmentId }
            });
            if (!department) {
                return res.status(400).json({ message: 'Departamento no encontrado.' });
            }
        }
        const newSpecialization = await prisma.specialization.create({
            data: {
                name: name.trim(),
                departmentId: departmentId || null
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        await (0, audit_service_1.logAuditEvent)('SPECIALIZATION_CREATED', {
            specializationId: newSpecialization.id,
            name: newSpecialization.name
        }, req.user?.userId);
        return res.status(201).json({
            message: 'Especialidad creada exitosamente.',
            specialization: newSpecialization
        });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Ya existe una especialidad con este nombre.' });
        }
        console.error('Error creando especialidad:', error);
        return res.status(500).json({ message: 'Error al crear la especialidad.' });
    }
};
exports.createSpecialization = createSpecialization;
// PUT /api/specializations/:id - Actualizar especialidad
const updateSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const specializationId = parseInt(id, 10);
        const { name, departmentId } = req.body;
        if (isNaN(specializationId)) {
            return res.status(400).json({ message: 'ID de especialidad inválido.' });
        }
        if (!name && departmentId === undefined) {
            return res.status(400).json({ message: 'Al menos un campo debe actualizarse.' });
        }
        const dataToUpdate = {};
        if (name !== undefined) {
            dataToUpdate.name = name.trim();
        }
        if (departmentId !== undefined) {
            if (departmentId && !isNaN(departmentId)) {
                // Verificar que el departamento existe
                const department = await prisma.department.findUnique({
                    where: { id: departmentId }
                });
                if (!department) {
                    return res.status(400).json({ message: 'Departamento no encontrado.' });
                }
                dataToUpdate.departmentId = departmentId;
            }
            else {
                dataToUpdate.departmentId = null;
            }
        }
        const updatedSpecialization = await prisma.specialization.update({
            where: { id: specializationId },
            data: dataToUpdate,
            select: {
                id: true,
                name: true,
                updatedAt: true,
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        await (0, audit_service_1.logAuditEvent)('SPECIALIZATION_UPDATED', {
            specializationId,
            name: updatedSpecialization.name
        }, req.user?.userId);
        return res.status(200).json({
            message: 'Especialidad actualizada exitosamente.',
            specialization: updatedSpecialization
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Especialidad no encontrada.' });
        }
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Ya existe una especialidad con este nombre.' });
        }
        console.error('Error actualizando especialidad:', error);
        return res.status(500).json({ message: 'Error al actualizar la especialidad.' });
    }
};
exports.updateSpecialization = updateSpecialization;
// DELETE /api/specializations/:id - Eliminar especialidad
const deleteSpecialization = async (req, res) => {
    try {
        const { id } = req.params;
        const specializationId = parseInt(id, 10);
        if (isNaN(specializationId)) {
            return res.status(400).json({ message: 'ID de especialidad inválido.' });
        }
        // Verificar si hay médicos asociados a esta especialidad
        const doctorsCount = await prisma.user.count({
            where: {
                specializationId: specializationId,
                role: 'MEDICO'
            }
        });
        if (doctorsCount > 0) {
            return res.status(400).json({
                message: `No se puede eliminar la especialidad porque tiene ${doctorsCount} médico(s) asociado(s).`
            });
        }
        await prisma.specialization.delete({
            where: { id: specializationId }
        });
        await (0, audit_service_1.logAuditEvent)('SPECIALIZATION_DELETED', {
            specializationId
        }, req.user?.userId);
        return res.status(200).json({
            message: 'Especialidad eliminada exitosamente.'
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Especialidad no encontrada.' });
        }
        console.error('Error eliminando especialidad:', error);
        return res.status(500).json({ message: 'Error al eliminar la especialidad.' });
    }
};
exports.deleteSpecialization = deleteSpecialization;
//# sourceMappingURL=specialization.controller.js.map