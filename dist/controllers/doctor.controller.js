"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiltersMetadata = exports.getUsersWithFilters = exports.getDoctorsBySpecialty = exports.getUsersByRole = exports.createDoctor = exports.getDepartments = exports.getSpecializations = exports.updateDoctorState = exports.updateDoctor = exports.getDoctorById = exports.getDoctors = void 0;
const client_1 = require("@prisma/client");
const validation_1 = require("../utils/validation");
const audit_service_1 = require("../services/audit.service");
const prisma = new client_1.PrismaClient();
// GET /api/doctors - Listar médicos (paginado)
const getDoctors = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const departmentId = req.query.departmentId ? parseInt(req.query.departmentId) : undefined;
        const specializationId = req.query.specializationId ? parseInt(req.query.specializationId) : undefined;
        const skip = (page - 1) * limit;
        const where = { role: client_1.Role.MEDICO };
        if (status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
            where.status = status;
        }
        if (departmentId && !isNaN(departmentId)) {
            where.departmentId = departmentId;
        }
        if (specializationId && !isNaN(specializationId)) {
            where.specializationId = specializationId;
        }
        const [doctors, total] = await Promise.all([
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
                    },
                    specialization: {
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
            doctors,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error listando médicos:', error);
        return res.status(500).json({ message: 'Error al obtener la lista de médicos.' });
    }
};
exports.getDoctors = getDoctors;
// GET /api/doctors/:id - Obtener médico por ID
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = parseInt(id, 10);
        if (isNaN(doctorId)) {
            return res.status(400).json({ message: 'ID de médico inválido.' });
        }
        const doctor = await prisma.user.findUnique({
            where: { id: doctorId, role: client_1.Role.MEDICO },
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
                },
                specialization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!doctor) {
            return res.status(404).json({ message: 'Médico no encontrado.' });
        }
        return res.status(200).json({ doctor });
    }
    catch (error) {
        console.error('Error obteniendo médico:', error);
        return res.status(500).json({ message: 'Error al obtener el médico.' });
    }
};
exports.getDoctorById = getDoctorById;
// PUT /api/doctors/:id - Actualizar médico
const updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = parseInt(id, 10);
        if (isNaN(doctorId)) {
            return res.status(400).json({ message: 'ID de médico inválido.' });
        }
        const { fullname, phone, licenseNumber, dateOfBirth, age, emergencyContact, bloodType, allergies, chronicDiseases, departmentId, specializationId } = req.body;
        // Validar que al menos un campo sea proporcionado
        const updateFields = [
            fullname, phone, licenseNumber, dateOfBirth, age,
            emergencyContact, bloodType, allergies, chronicDiseases,
            departmentId, specializationId
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
            const birthDate = new Date(dateOfBirth);
            if (isNaN(birthDate.getTime())) {
                return res.status(400).json({ message: 'Fecha de nacimiento inválida.' });
            }
            const calculatedAge = (0, validation_1.calculateAge)(birthDate);
            if (!(0, validation_1.isValidAge)(calculatedAge)) {
                return res.status(400).json({ message: 'Edad fuera del rango permitido (0-100).' });
            }
            dataToUpdate.dateOfBirth = birthDate;
            dataToUpdate.age = calculatedAge;
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
        if (specializationId !== undefined) {
            if (specializationId && !isNaN(specializationId)) {
                // Verificar que la especialización existe
                const specialization = await prisma.specialization.findUnique({
                    where: { id: specializationId }
                });
                if (!specialization) {
                    return res.status(400).json({ message: 'Especialización no encontrada.' });
                }
                dataToUpdate.specializationId = specializationId;
            }
            else {
                dataToUpdate.specializationId = null;
            }
        }
        const updatedDoctor = await prisma.user.update({
            where: { id: doctorId, role: client_1.Role.MEDICO },
            data: dataToUpdate,
            select: {
                id: true,
                email: true,
                fullname: true,
                phone: true,
                licenseNumber: true,
                status: true,
                dateOfBirth: true,
                age: true,
                updatedAt: true,
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                specialization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        await (0, audit_service_1.logAuditEvent)('DOCTOR_UPDATED', { doctorId }, req.user?.userId);
        return res.status(200).json({
            message: 'Médico actualizado exitosamente.',
            doctor: updatedDoctor
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Médico no encontrado.' });
        }
        console.error('Error actualizando médico:', error);
        return res.status(500).json({ message: 'Error al actualizar el médico.' });
    }
};
exports.updateDoctor = updateDoctor;
// PATCH /api/doctors/state/:id - Actualizar estado (ACTIVO/INACTIVO)
const updateDoctorState = async (req, res) => {
    try {
        const { id } = req.params;
        const doctorId = parseInt(id, 10);
        const { status } = req.body;
        if (isNaN(doctorId)) {
            return res.status(400).json({ message: 'ID de médico inválido.' });
        }
        if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'El estado debe ser "ACTIVE" o "INACTIVE".' });
        }
        const updatedDoctor = await prisma.user.update({
            where: { id: doctorId, role: client_1.Role.MEDICO },
            data: { status },
            select: {
                id: true,
                email: true,
                fullname: true,
                status: true,
                updatedAt: true
            }
        });
        await (0, audit_service_1.logAuditEvent)('DOCTOR_STATE_UPDATED', {
            doctorId,
            newStatus: status
        }, req.user?.userId);
        return res.status(200).json({
            message: 'Estado del médico actualizado.',
            doctor: updatedDoctor
        });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Médico no encontrado.' });
        }
        console.error('Error actualizando estado:', error);
        return res.status(500).json({ message: 'Error al actualizar el estado del médico.' });
    }
};
exports.updateDoctorState = updateDoctorState;
// GET /api/doctors/specializations - Obtener todas las especializaciones
const getSpecializations = async (req, res) => {
    try {
        const specializations = await prisma.specialization.findMany({
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
            },
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ specializations });
    }
    catch (error) {
        console.error('Error obteniendo especializaciones:', error);
        return res.status(500).json({ message: 'Error al obtener las especializaciones.' });
    }
};
exports.getSpecializations = getSpecializations;
// GET /api/doctors/departments - Obtener todos los departamentos
const getDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true
            },
            orderBy: { name: 'asc' }
        });
        return res.status(200).json({ departments });
    }
    catch (error) {
        console.error('Error obteniendo departamentos:', error);
        return res.status(500).json({ message: 'Error al obtener los departamentos.' });
    }
};
exports.getDepartments = getDepartments;
// POST /api/users/doctors - Registrar doctor
const createDoctor = async (req, res) => {
    try {
        const { email, currentPassword, fullname, identificationNumber, phone, licenseNumber, dateOfBirth, departmentId, specializationId } = req.body;
        // Validaciones básicas
        if (!email || !currentPassword || !fullname || !identificationNumber || !dateOfBirth || !departmentId || !specializationId) {
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
        // Validar especialización
        const specialization = await prisma.specialization.findUnique({ where: { id: specializationId } });
        if (!specialization) {
            return res.status(400).json({ message: 'Especialización no encontrada.' });
        }
        // Crear doctor
        const doctor = await prisma.user.create({
            data: {
                email,
                currentPassword, // ⚠️ En producción: hashear con bcrypt
                fullname: cleanName,
                identificationNumber,
                phone: phone ? (0, validation_1.sanitizeString)(phone) : null,
                licenseNumber: licenseNumber ? (0, validation_1.sanitizeString)(licenseNumber) : null,
                dateOfBirth: birthDate,
                age,
                role: client_1.Role.MEDICO,
                status: 'PENDING', // o 'ACTIVE' según política
                departmentId,
                specializationId
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
                specialization: { select: { id: true, name: true } },
                createdAt: true
            }
        });
        await (0, audit_service_1.logAuditEvent)('DOCTOR_CREATED', { doctorId: doctor.id }, req.user?.userId);
        return res.status(201).json({ message: 'Médico registrado exitosamente.', doctor });
    }
    catch (error) {
        console.error('Error registrando médico:', error);
        return res.status(500).json({ message: 'Error al registrar el médico.' });
    }
};
exports.createDoctor = createDoctor;
// GET /api/users/by-role?role=doctor
const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.query;
        if (role !== 'doctor') {
            return res.status(400).json({ message: 'Solo se permite el rol "doctor" en este endpoint.' });
        }
        const users = await prisma.user.findMany({
            where: { role: client_1.Role.MEDICO },
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
                department: { select: { id: true, name: true } },
                specialization: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ users });
    }
    catch (error) {
        console.error('Error al filtrar usuarios por rol:', error);
        return res.status(500).json({ message: 'Error al obtener usuarios por rol.' });
    }
};
exports.getUsersByRole = getUsersByRole;
// GET /api/users/by-specialty?specialty=cardiologia - Filtrar doctores por especialidad
const getDoctorsBySpecialty = async (req, res) => {
    try {
        const { specialty } = req.query;
        if (!specialty || typeof specialty !== 'string') {
            return res.status(400).json({ message: 'El parámetro "specialty" es obligatorio y debe ser una cadena de texto.' });
        }
        const doctors = await prisma.user.findMany({
            where: {
                role: client_1.Role.MEDICO,
                specialization: {
                    name: {
                        contains: specialty,
                        mode: 'insensitive'
                    }
                }
            },
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
                },
                specialization: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { fullname: 'asc' }
        });
        return res.status(200).json({ doctors });
    }
    catch (error) {
        console.error('Error al filtrar médicos por especialidad:', error);
        return res.status(500).json({ message: 'Error al obtener los médicos por especialidad.' });
    }
};
exports.getDoctorsBySpecialty = getDoctorsBySpecialty;
// GET /api/users - Filtros avanzados con query params (unificado)
const getUsersWithFilters = async (req, res) => {
    try {
        // Parámetros de paginación
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Parámetros de filtro
        const { role, specialty, state, department, search } = req.query;
        // Construir el objeto WHERE para Prisma
        const where = {};
        // Filtro por rol
        if (role) {
            const roles = role.split('|').map(r => r.trim().toUpperCase());
            const validRoles = roles.filter(r => Object.values(client_1.Role).includes(r));
            if (validRoles.length > 0) {
                where.role = { in: validRoles };
            }
        }
        // Filtro por estado
        if (state) {
            const states = state.split('|').map(s => s.trim().toUpperCase());
            const validStates = states.filter(s => ['ACTIVE', 'INACTIVE', 'PENDING'].includes(s));
            if (validStates.length > 0) {
                where.status = { in: validStates };
            }
        }
        // Filtro por departamento
        if (department) {
            const departments = department.split('|').map(d => parseInt(d.trim()));
            const validDepartments = departments.filter(d => !isNaN(d));
            if (validDepartments.length > 0) {
                where.departmentId = { in: validDepartments };
            }
        }
        // Filtro por especialidad (solo aplica a médicos)
        if (specialty) {
            const specialties = specialty.split('|').map(s => parseInt(s.trim()));
            const validSpecialties = specialties.filter(s => !isNaN(s));
            if (validSpecialties.length > 0) {
                where.specializationId = { in: validSpecialties };
                // Asegurar que solo se aplique a médicos
                if (!where.role) {
                    where.role = client_1.Role.MEDICO;
                }
                else if (Array.isArray(where.role.in)) {
                    if (!where.role.in.includes(client_1.Role.MEDICO)) {
                        where.role.in.push(client_1.Role.MEDICO);
                    }
                }
            }
        }
        // Búsqueda por texto (nombre, email, identificación)
        if (search) {
            const searchTerm = `%${search}%`;
            where.OR = [
                { fullname: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { identificationNumber: { contains: search, mode: 'insensitive' } },
                { licenseNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Consulta principal con los filtros
        const [users, total] = await Promise.all([
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
                    role: true,
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
                    },
                    specialization: {
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
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    }
    catch (error) {
        console.error('Error en filtros avanzados:', error);
        return res.status(500).json({
            message: 'Error al obtener usuarios con filtros.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getUsersWithFilters = getUsersWithFilters;
// GET /api/users/filters/metadata - Metadatos para los filtros
const getFiltersMetadata = async (req, res) => {
    try {
        const [departments, specializations, roleCounts, statusCounts] = await Promise.all([
            prisma.department.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),
            prisma.specialization.findMany({
                select: { id: true, name: true },
                orderBy: { name: 'asc' }
            }),
            prisma.user.groupBy({
                by: ['role'],
                _count: {
                    id: true
                }
            }),
            prisma.user.groupBy({
                by: ['status'],
                _count: {
                    id: true
                }
            })
        ]);
        return res.status(200).json({
            filters: {
                roles: Object.values(client_1.Role).map(role => ({
                    value: role,
                    label: role.toLowerCase(),
                    count: roleCounts.find(r => r.role === role)?._count.id || 0
                })),
                statuses: ['ACTIVE', 'INACTIVE', 'PENDING'].map(status => ({
                    value: status,
                    label: status.toLowerCase(),
                    count: statusCounts.find(s => s.status === status)?._count.id || 0
                })),
                departments: departments.map(dept => ({
                    value: dept.id,
                    label: dept.name
                })),
                specializations: specializations.map(spec => ({
                    value: spec.id,
                    label: spec.name
                }))
            }
        });
    }
    catch (error) {
        console.error('Error obteniendo metadatos de filtros:', error);
        return res.status(500).json({
            message: 'Error al obtener metadatos de filtros.'
        });
    }
};
exports.getFiltersMetadata = getFiltersMetadata;
//# sourceMappingURL=doctor.controller.js.map