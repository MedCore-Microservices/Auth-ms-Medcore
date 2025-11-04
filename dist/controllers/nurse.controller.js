"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNurse = exports.updateNurseState = exports.updateNurse = exports.getNurseById = exports.getNurses = void 0;
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const audit_service_1 = require("../services/audit.service");
const prisma = new client_1.PrismaClient();
// GET /api/nurses - Listar enfermeras (paginado)
const getNurses = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const departmentId = req.query.departmentId ? parseInt(req.query.departmentId) : undefined;
        const skip = (page - 1) * limit;
        const where = { role: client_1.Role.ENFERMERA };
        if (status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
            where.status = status;
        }
        if (departmentId && !isNaN(departmentId)) {
            where.departmentId = departmentId;
        }
        const [nurses, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    fullname: true,
                    identificationNumber: true,
                    phone: true,
                    status: true,
                    licenseNumber: true,
                    dateOfBirth: true,
                    age: true,
                    createdAt: true,
                    updatedAt: true,
                    department: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);
        return res.status(200).json({
            nurses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error listando enfermeras:', error);
        return res.status(500).json({ message: 'Error al obtener la lista de enfermeras.' });
    }
};
exports.getNurses = getNurses;
// GET /api/nurses/:id - Obtener enfermera por ID
const getNurseById = async (req, res) => {
    try {
        const { id } = req.params;
        const nurseId = parseInt(id, 10);
        if (isNaN(nurseId)) {
            return res.status(400).json({ message: 'ID de enfermera inválido.' });
        }
        const nurse = await prisma.user.findUnique({
            where: { id: nurseId, role: client_1.Role.ENFERMERA },
            select: {
                id: true,
                email: true,
                fullname: true,
                identificationNumber: true,
                phone: true,
                status: true,
                licenseNumber: true,
                dateOfBirth: true,
                age: true,
                emergencyContact: true,
                bloodType: true,
                allergies: true,
                chronicDiseases: true,
                createdAt: true,
                updatedAt: true,
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!nurse) {
            return res.status(404).json({ message: 'Enfermera no encontrada.' });
        }
        return res.status(200).json({ nurse });
    }
    catch (error) {
        console.error('Error obteniendo enfermera:', error);
        return res.status(500).json({ message: 'Error al obtener la enfermera.' });
    }
};
exports.getNurseById = getNurseById;
// PUT /api/nurses/:id - Actualizar enfermera
const updateNurse = async (req, res) => {
    try {
        const { id } = req.params;
        const nurseId = parseInt(id, 10);
        if (isNaN(nurseId)) {
            return res.status(400).json({ message: 'ID de enfermera inválido.' });
        }
        const { fullname, phone, licenseNumber, dateOfBirth, age, emergencyContact, bloodType, allergies, chronicDiseases, departmentId } = req.body;
        // Validar que al menos un campo sea proporcionado
        const updateFields = [
            fullname, phone, licenseNumber, dateOfBirth, age,
            emergencyContact, bloodType, allergies, chronicDiseases, departmentId
        ];
        if (updateFields.every(field => field === undefined)) {
            return res.status(400).json({ message: 'Al menos un campo debe actualizarse.' });
        }
        const dataToUpdate = {};
        if (fullname !== undefined) {
            const cleanName = (0, validation_1.sanitizeString)(fullname);
            if (!(0, validation_1.isValidName)(cleanName)) {
                return res.status(400).json({ message: 'Nombre inválido.' });
            }
            dataToUpdate.fullname = cleanName;
        }
        if (phone !== undefined) {
            dataToUpdate.phone = phone ? (0, validation_1.sanitizeString)(phone) : null;
        }
        if (licenseNumber !== undefined) {
            dataToUpdate.licenseNumber = licenseNumber ? (0, validation_1.sanitizeString)(licenseNumber) : null;
        }
        if (dateOfBirth !== undefined) {
            dataToUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        }
        if (age !== undefined) {
            dataToUpdate.age = age ? parseInt(age) : null;
        }
        if (emergencyContact !== undefined) {
            dataToUpdate.emergencyContact = emergencyContact ? (0, validation_1.sanitizeString)(emergencyContact) : null;
        }
        if (bloodType !== undefined) {
            dataToUpdate.bloodType = bloodType ? (0, validation_1.sanitizeString)(bloodType) : null;
        }
        if (allergies !== undefined) {
            dataToUpdate.allergies = allergies ? (0, validation_1.sanitizeString)(allergies) : null;
        }
        if (chronicDiseases !== undefined) {
            dataToUpdate.chronicDiseases = chronicDiseases ? (0, validation_1.sanitizeString)(chronicDiseases) : null;
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
        const updatedNurse = await prisma.user.update({
            where: { id: nurseId, role: client_1.Role.ENFERMERA },
            data: dataToUpdate,
            select: {
                id: true,
                email: true,
                fullname: true,
                phone: true,
                licenseNumber: true,
                status: true,
                updatedAt: true,
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        await (0, audit_service_1.logAuditEvent)('NURSE_UPDATED', { nurseId }, req.user?.userId);
        return res.status(200).json({
            message: 'Enfermera actualizada exitosamente.',
            nurse: updatedNurse
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Enfermera no encontrada.' });
        }
        console.error('Error actualizando enfermera:', error);
        return res.status(500).json({ message: 'Error al actualizar la enfermera.' });
    }
};
exports.updateNurse = updateNurse;
// PATCH /api/nurses/state/:id - Actualizar estado (ACTIVO/INACTIVO)
const updateNurseState = async (req, res) => {
    try {
        const { id } = req.params;
        const nurseId = parseInt(id, 10);
        const { status } = req.body;
        if (isNaN(nurseId)) {
            return res.status(400).json({ message: 'ID de enfermera inválido.' });
        }
        if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'El estado debe ser "ACTIVE" o "INACTIVE".' });
        }
        const updatedNurse = await prisma.user.update({
            where: { id: nurseId, role: client_1.Role.ENFERMERA },
            data: { status },
            select: {
                id: true,
                email: true,
                fullname: true,
                status: true,
                updatedAt: true
            }
        });
        await (0, audit_service_1.logAuditEvent)('NURSE_STATE_UPDATED', {
            nurseId,
            newStatus: status
        }, req.user?.userId);
        return res.status(200).json({
            message: 'Estado de la enfermera actualizado.',
            nurse: updatedNurse
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Enfermera no encontrada.' });
        }
        console.error('Error actualizando estado:', error);
        return res.status(500).json({ message: 'Error al actualizar el estado de la enfermera.' });
    }
};
exports.updateNurseState = updateNurseState;
// POST /api/users/nurses - Registrar enfermera
const createNurse = async (req, res) => {
    try {
        const { email, currentPassword, fullname, identificationNumber, phone, licenseNumber, dateOfBirth, departmentId } = req.body;
        // Validaciones básicas
        if (!email || !currentPassword || !fullname || !identificationNumber || !dateOfBirth || !departmentId) {
            return res.status(400).json({ message: 'Todos los campos obligatorios deben estar presentes.' });
        }
        // Validar email único
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'El correo ya está registrado.' });
        }
        // Validar identificación única
        const existingIdNumber = await prisma.user.findUnique({ where: { identificationNumber } });
        if (existingIdNumber) {
            return res.status(409).json({ message: 'El número de identificación ya está registrado.' });
        }
        // Validar nombre
        const cleanName = (0, validation_1.sanitizeString)(fullname);
        if (!(0, validation_1.isValidName)(cleanName)) {
            return res.status(400).json({ message: 'Nombre inválido.' });
        }
        // Validar fecha de nacimiento y calcular edad
        const birthDate = new Date(dateOfBirth);
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({ message: 'Fecha de nacimiento inválida.' });
        }
        const age = (0, validation_1.calculateAge)(birthDate);
        if (!(0, validation_1.isValidAge)(age)) {
            return res.status(400).json({ message: 'Edad fuera del rango permitido (0-100).' });
        }
        // Validar departamento
        const department = await prisma.department.findUnique({ where: { id: departmentId } });
        if (!department) {
            return res.status(400).json({ message: 'Departamento no encontrado.' });
        }
        // Crear enfermera
        const nurse = await prisma.user.create({
            data: {
                email,
                currentPassword, // ⚠️ En producción: hashear con bcrypt
                fullname: cleanName,
                identificationNumber,
                phone: phone ? (0, validation_1.sanitizeString)(phone) : null,
                licenseNumber: licenseNumber ? (0, validation_1.sanitizeString)(licenseNumber) : null,
                dateOfBirth: birthDate,
                age,
                role: client_1.Role.ENFERMERA,
                status: 'PENDING',
                departmentId
            },
            select: {
                id: true,
                email: true,
                fullname: true,
                identificationNumber: true,
                phone: true,
                licenseNumber: true,
                status: true,
                dateOfBirth: true,
                age: true,
                department: { select: { id: true, name: true } },
                createdAt: true
            }
        });
        await (0, audit_service_1.logAuditEvent)('NURSE_CREATED', { nurseId: nurse.id }, req.user?.userId);
        return res.status(201).json({ message: 'Enfermera registrada exitosamente.', nurse });
    }
    catch (error) {
        console.error('Error registrando enfermera:', error);
        return res.status(500).json({ message: 'Error al registrar la enfermera.' });
    }
};
exports.createNurse = createNurse;
//# sourceMappingURL=nurse.controller.js.map