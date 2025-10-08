"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePatientState = exports.updatePatient = exports.getPatientById = exports.getPatients = void 0;
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const audit_service_1 = require("../services/audit.service");
const prisma = new client_1.PrismaClient();
// GET /api/patients - Listar pacientes (paginado)
const getPatients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const skip = (page - 1) * limit;
        const where = { role: client_1.Role.PACIENTE };
        if (status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
            where.status = status;
        }
        const [patients, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    fullname: true,
                    dateOfBirth: true,
                    status: true,
                    phone: true,
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count({ where })
        ]);
        return res.status(200).json({
            patients,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error listando pacientes:', error);
        return res.status(500).json({ message: 'Error al obtener la lista de pacientes.' });
    }
};
exports.getPatients = getPatients;
// GET /api/patients/:id - Obtener paciente por ID
const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = parseInt(id, 10);
        if (isNaN(patientId)) {
            return res.status(400).json({ message: 'ID de paciente inválido.' });
        }
        const patient = await prisma.user.findUnique({
            where: { id: patientId, role: client_1.Role.PACIENTE },
            select: {
                id: true,
                email: true,
                fullname: true,
                dateOfBirth: true,
                status: true,
                phone: true,
                bloodType: true,
                allergies: true,
                chronicDiseases: true,
                emergencyContact: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!patient) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }
        return res.status(200).json({ patient });
    }
    catch (error) {
        console.error('Error obteniendo paciente:', error);
        return res.status(500).json({ message: 'Error al obtener el paciente.' });
    }
};
exports.getPatientById = getPatientById;
// PUT /api/patients/:id - Actualizar paciente
const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = parseInt(id, 10);
        if (isNaN(patientId)) {
            return res.status(400).json({ message: 'ID de paciente inválido.' });
        }
        const { fullname, dateOfBirth, phone, bloodType, allergies, chronicDiseases, emergencyContact } = req.body;
        if (!fullname && !dateOfBirth && !phone && !bloodType && !allergies && !chronicDiseases && !emergencyContact) {
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
        if (dateOfBirth !== undefined) {
            const birthDate = new Date(dateOfBirth);
            if (isNaN(birthDate.getTime())) {
                return res.status(400).json({ message: 'Fecha de nacimiento inválida.' });
            }
            const age = (0, validation_1.calculateAge)(birthDate);
            if (!(0, validation_1.isValidAge)(age)) {
                return res.status(400).json({ message: 'Edad fuera del rango permitido (0-100).' });
            }
            dataToUpdate.dateOfBirth = birthDate;
        }
        if (phone !== undefined)
            dataToUpdate.phone = phone ? (0, validation_1.sanitizeString)(phone) : null;
        if (bloodType !== undefined)
            dataToUpdate.bloodType = bloodType ? (0, validation_1.sanitizeString)(bloodType) : null;
        if (allergies !== undefined)
            dataToUpdate.allergies = allergies ? (0, validation_1.sanitizeString)(allergies) : null;
        if (chronicDiseases !== undefined)
            dataToUpdate.chronicDiseases = chronicDiseases ? (0, validation_1.sanitizeString)(chronicDiseases) : null;
        if (emergencyContact !== undefined)
            dataToUpdate.emergencyContact = emergencyContact ? (0, validation_1.sanitizeString)(emergencyContact) : null;
        const updatedPatient = await prisma.user.update({
            where: { id: patientId, role: client_1.Role.PACIENTE },
            data: dataToUpdate, // ✅ CORREGIDO: "data:" en lugar de solo "dataToUpdate"
            select: {
                id: true,
                email: true,
                fullname: true,
                dateOfBirth: true,
                status: true,
                phone: true,
                updatedAt: true
            }
        });
        await (0, audit_service_1.logAuditEvent)('PATIENT_UPDATED', { patientId }, req.user?.userId);
        return res.status(200).json({ message: 'Paciente actualizado exitosamente.', patient: updatedPatient });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }
        console.error('Error actualizando paciente:', error);
        return res.status(500).json({ message: 'Error al actualizar el paciente.' });
    }
};
exports.updatePatient = updatePatient;
// PATCH /api/patients/state/:id - Actualizar estado (ACTIVO/INACTIVO)
const updatePatientState = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = parseInt(id, 10);
        const { status } = req.body;
        if (isNaN(patientId)) {
            return res.status(400).json({ message: 'ID de paciente inválido.' });
        }
        if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'El estado debe ser "ACTIVE" o "INACTIVE".' });
        }
        const updatedPatient = await prisma.user.update({
            where: { id: patientId, role: client_1.Role.PACIENTE },
            data: { status }, // ✅ CORREGIDO: objeto con "status"
            select: { id: true, email: true, status: true, updatedAt: true }
        });
        await (0, audit_service_1.logAuditEvent)('PATIENT_STATE_UPDATED', { patientId, newStatus: status }, req.user?.userId);
        return res.status(200).json({ message: 'Estado del paciente actualizado.', patient: updatedPatient });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }
        console.error('Error actualizando estado:', error);
        return res.status(500).json({ message: 'Error al actualizar el estado del paciente.' });
    }
};
exports.updatePatientState = updatePatientState;
//# sourceMappingURL=patient.controller.js.map