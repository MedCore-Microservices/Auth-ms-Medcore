"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateUsers = void 0;
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const validation_1 = require("../utils/validation");
const prisma = new client_1.PrismaClient();
const bulkCreateUsers = async (users) => {
    const results = {
        success: 0,
        errors: 0,
        details: []
    };
    const roleMap = {
        'MEDICO': client_1.Role.MEDICO,
        'ENFERMERA': client_1.Role.ENFERMERA,
        'ADMINISTRADOR': client_1.Role.ADMINISTRADOR,
        'PACIENTE': client_1.Role.PACIENTE
    };
    for (let i = 0; i < users.length; i++) {
        const userData = users[i];
        try {
            console.log(`Procesando fila ${i + 1}:`, userData.email);
            // Validar duplicados por email
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });
            if (existingUser) {
                results.details.push({
                    row: i + 1,
                    email: userData.email,
                    status: 'ERROR',
                    message: `El correo '${userData.email}' ya existe.`
                });
                results.errors++;
                continue;
            }
            // Validar duplicados por identificación
            const existingUserByIdentification = await prisma.user.findUnique({
                where: { identificationNumber: userData.identificationnumber }
            });
            if (existingUserByIdentification) {
                results.details.push({
                    row: i + 1,
                    email: userData.email,
                    status: 'ERROR',
                    message: `El número de identificación '${userData.identificationnumber}' ya está registrado.`
                });
                results.errors++;
                continue;
            }
            // Validar fecha de nacimiento
            let dateOfBirth = null;
            if (userData.date_of_birth) {
                const parsedDate = new Date(userData.date_of_birth);
                if (isNaN(parsedDate.getTime())) {
                    results.details.push({
                        row: i + 1,
                        email: userData.email,
                        status: 'ERROR',
                        message: `La fecha de nacimiento '${userData.date_of_birth}' no es válida.`
                    });
                    results.errors++;
                    continue;
                }
                dateOfBirth = parsedDate;
            }
            // Calcular edad
            const age = dateOfBirth ? (0, validation_1.calculateAge)(dateOfBirth) : null;
            // Manejar Department
            let departmentId = null;
            if (userData.department) {
                const dept = await prisma.department.upsert({
                    where: { name: userData.department.toUpperCase() },
                    update: {},
                    create: { name: userData.department.toUpperCase() }
                });
                departmentId = dept.id;
            }
            // Manejar Specialization
            let specializationId = null;
            if (userData.specialization && roleMap[userData.role?.toUpperCase()] === client_1.Role.MEDICO) {
                const spec = await prisma.specialization.upsert({
                    where: { name: userData.specialization.toUpperCase() },
                    update: {},
                    create: { name: userData.specialization.toUpperCase() }
                });
                specializationId = spec.id;
            }
            // Crear usuario
            const hashedPassword = await bcrypt.hash(userData.current_password, 10);
            await prisma.user.create({
                data: {
                    email: userData.email,
                    fullname: userData.fullname,
                    currentPassword: hashedPassword,
                    role: roleMap[userData.role?.toUpperCase()] || client_1.Role.PACIENTE,
                    status: userData.status || 'PENDING',
                    phone: userData.phone || null,
                    dateOfBirth,
                    age,
                    licenseNumber: userData.license_number || null,
                    identificationNumber: userData.identificationnumber || null,
                    departmentId,
                    specializationId
                }
            });
            results.success++;
            results.details.push({
                row: i + 1,
                email: userData.email,
                status: 'SUCCESS',
                message: 'Usuario creado exitosamente.'
            });
        }
        catch (error) {
            console.error(`Error en la fila ${i + 1}:`, error.message);
            results.errors++;
            results.details.push({
                row: i + 1,
                email: userData.email,
                status: 'ERROR',
                message: error.message || 'Error desconocido.'
            });
        }
    }
    return results;
};
exports.bulkCreateUsers = bulkCreateUsers;
//# sourceMappingURL=bulk-upload.service.js.map