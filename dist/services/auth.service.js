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
exports.resendVerificationCode = exports.verifyEmailCode = exports.logoutUser = exports.loginUser = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const generateCode_1 = require("../utils/generateCode");
const emailConfig_1 = require("../config/emailConfig");
const prisma = new client_1.PrismaClient();
const registerUser = async (email, password, fullname) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('El correo electrónico ya está registrado.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const code = (0, generateCode_1.generateVerificationCode)(); // ✅ Genera el código
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    //
    const newUser = await prisma.user.create({
        data: {
            email,
            currentPassword: hashedPassword,
            fullname,
            role: client_1.Role.PACIENTE,
            status: 'PENDING', // estado inicial
            verificationCode: code, // código de 6 dígitos
            verificationExpires: expiresAt, // fecha de expiración
        }
    });
    // ✅ Envía el código por correo
    try {
        await (0, emailConfig_1.sendVerificationEmail)(email, fullname, code); // 👈 pasa el código
    }
    catch (error) {
        console.error('⚠️ No se pudo enviar el código de verificación:', error);
        // Opcional: eliminar usuario si falla el correo
    }
    return newUser;
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        throw new Error('Credenciales inválidas');
    }
    if (user.status !== 'ACTIVE') {
        throw new Error('Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
    }
    const isPasswordValid = await bcrypt.compare(password, user.currentPassword);
    if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
    }
    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            role: user.role
        }
    };
};
exports.loginUser = loginUser;
const logoutUser = async (token) => {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
        throw new Error('Token inválido');
    }
    const expiresAt = new Date(decoded.exp * 1000);
    await prisma.tokenBlacklist.create({
        data: {
            token,
            expiresAt
        }
    });
    return { message: 'Sesión cerrada exitosamente' };
};
exports.logoutUser = logoutUser;
const verifyEmailCode = async (email, code) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    if (user.status === 'ACTIVE') {
        throw new Error('La cuenta ya está verificada');
    }
    if (!user.verificationCode || !user.verificationExpires) {
        throw new Error('Código de verificación no disponible');
    }
    // Verificar si el código expiró
    if (new Date() > user.verificationExpires) {
        throw new Error('El código de verificación ha expirado');
    }
    // Verificar si el código coincide
    if (user.verificationCode !== code) {
        throw new Error('Código de verificación incorrecto');
    }
    // Actualizar usuario a ACTIVO y limpiar código
    const updatedUser = await prisma.user.update({
        where: { email },
        data: {
            status: 'ACTIVE',
            verificationCode: null,
            verificationExpires: null,
            updatedAt: new Date()
        }
    });
    return {
        message: 'Email verificado exitosamente. Tu cuenta ahora está activa.',
        user: {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status
        }
    };
};
exports.verifyEmailCode = verifyEmailCode;
/**
 * Reenviar código de verificación
 */
const resendVerificationCode = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    if (user.status === 'ACTIVE') {
        throw new Error('La cuenta ya está verificada');
    }
    const newCode = (0, generateCode_1.generateVerificationCode)();
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.user.update({
        where: { email },
        data: {
            verificationCode: newCode,
            verificationExpires: newExpiresAt,
            updatedAt: new Date()
        }
    });
    try {
        await (0, emailConfig_1.sendVerificationEmail)(email, user.fullname, newCode);
    }
    catch (error) {
        console.error('Error al reenviar email de verificación:', error);
        throw new Error('No se pudo enviar el email de verificación');
    }
    return {
        message: 'Nuevo código de verificación enviado a tu email',
        expiresAt: newExpiresAt
    };
};
exports.resendVerificationCode = resendVerificationCode;
//# sourceMappingURL=auth.service.js.map