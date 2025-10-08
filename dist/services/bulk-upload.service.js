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
const prisma = new client_1.PrismaClient();
const bulkCreateUsers = async (users) => {
    const results = {
        success: 0,
        errors: 0,
        details: []
    };
    // Mapeo de roles del Excel al enum actualizado
    const roleMap = {
        'MEDICO': client_1.Role.MEDICO,
        'ENFERMERA': client_1.Role.ENFERMERA,
        'ADMINISTRADOR': client_1.Role.ADMINISTRADOR,
        'PACIENTE': client_1.Role.PACIENTE
    };
    for (const userData of users) {
        try {
            console.log('Procesando usuario:', userData.email);
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email }
            });
            if (existingUser) {
                results.details.push({
                    email: userData.email,
                    status: 'SKIPPED',
                    message: 'Usuario ya existe'
                });
                continue;
            }
            const existingUserByIdentification = await prisma.user.findUnique({
                where: { identificationNumber: userData.identificationnumber }
            });
            if (existingUserByIdentification) {
                results.details.push({
                    email: userData.email,
                    status: 'SKIPPED',
                    message: `El número de identificación ${userData.identificationnumber} ya está registrado`
                });
                continue;
            }
            const hashedPassword = await bcrypt.hash(userData.current_password, 10);
            // Normalizar rol
            const userRole = roleMap[userData.role?.toUpperCase()] || client_1.Role.PACIENTE;
            // 1. Manejar Department (solo si aplica)
            let departmentId = null;
            if (userData.department) {
                const dept = await prisma.department.upsert({
                    where: { name: userData.department.toUpperCase() },
                    update: {},
                    create: { name: userData.department.toUpperCase() }
                });
                departmentId = dept.id;
            }
            // 2. Manejar Specialization (solo para médicos)
            let specializationId = null;
            if (userData.specialization && userRole === client_1.Role.MEDICO) {
                const spec = await prisma.specialization.upsert({
                    where: { name: userData.specialization.toUpperCase() },
                    update: {},
                    create: { name: userData.specialization.toUpperCase() }
                });
                specializationId = spec.id;
            }
            console.log('Procesando usuario:', userData.email);
            console.log('Número de identificación:', userData.identificationnumber);
            const uniquePatientId = `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            // 3. Crear usuario con relaciones
            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    fullname: userData.fullname,
                    currentPassword: hashedPassword,
                    role: userRole,
                    status: userData.status || 'PENDING',
                    phone: userData.phone || null,
                    dateOfBirth: userData.date_of_birth ? new Date(userData.date_of_birth) : null,
                    licenseNumber: userData.license_number || null,
                    identificationNumber: userData.identificationnumber || null,
                    departmentId,
                    specializationId
                }
            });
            results.success++;
            results.details.push({
                email: userData.email,
                status: 'CREATED',
                message: 'Usuario creado exitosamente'
            });
        }
        catch (error) {
            console.error('Error creando usuario:', userData.email, error);
            results.errors++;
            results.details.push({
                email: userData.email,
                status: 'ERROR',
                message: error.message || 'Error desconocido'
            });
        }
    }
    return results;
};
exports.bulkCreateUsers = bulkCreateUsers;
//# sourceMappingURL=bulk-upload.service.js.map