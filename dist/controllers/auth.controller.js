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
exports.resendVerification = exports.verifyEmail = exports.logout = exports.refreshToken = exports.getProfile = exports.login = exports.registerPublicUser = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const jwt = __importStar(require("jsonwebtoken"));
const audit_service_1 = require("../services/audit.service");
const auth_service_2 = require("./../services/auth.service");
//  Eliminamos Prisma del controlador: se usa solo en los servicios
/**
 * Registro general (puede usarse si se decide permitir rol, pero NO recomendado para público)
 * lo dejamos como registro público con rol fijo.
 */
const register = async (req, res) => {
    try {
        const { email, password, fullname } = req.body;
        if (!email || !password || !fullname) {
            return res.status(400).json({
                message: 'Email, contraseña y nombre completo son obligatorios.'
            });
        }
        // El rol se establece automáticamente como PATIENT en el servicio
        const newUser = await (0, auth_service_1.registerUser)(email, password, fullname);
        await (0, audit_service_1.logAuditEvent)('USER_REGISTER', {
            email: newUser.email,
            role: newUser.role,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        return res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUser.id,
                email: newUser.email,
                fullname: newUser.fullname,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        });
    }
    catch (error) {
        console.error('Error en el registro:', error);
        return res.status(400).json({
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};
exports.register = register;
const registerPublicUser = async (req, res) => {
    return (0, exports.register)(req, res);
};
exports.registerPublicUser = registerPublicUser;
/**
 * Inicio de sesión
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: 'El email y la contraseña son obligatorios.'
            });
        }
        const { accessToken, refreshToken, user } = await (0, auth_service_1.loginUser)(email, password);
        await (0, audit_service_1.logAuditEvent)('USER_LOGIN', {
            email: user.email,
            role: user.role,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }, user.id);
        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            accessToken,
            refreshToken,
            user
        });
    }
    catch (error) {
        console.error('Error en el login:', error);
        return res.status(401).json({
            message: 'Credenciales inválidas',
            error: error.message
        });
    }
};
exports.login = login;
/**
 * Obtener perfil del usuario autenticado
 */
const getProfile = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const userPayload = req.user;
    return res.status(200).json({
        message: 'Perfil del usuario',
        user: {
            id: userPayload.userId,
            email: userPayload.email,
            role: userPayload.role,
        }
    });
};
exports.getProfile = getProfile;
/**
 * Renovar access token usando refresh token
 */
const refreshToken = async (req, res) => {
    try {
        const { userId } = req.user;
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const newAccessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        await prisma.$disconnect();
        return res.status(200).json({
            message: 'Token de acceso renovado',
            accessToken: newAccessToken
        });
    }
    catch (error) {
        console.error('Error al renovar token:', error);
        return res.status(401).json({
            message: 'No autorizado',
            error: error.message
        });
    }
};
exports.refreshToken = refreshToken;
/**
 * Cerrar sesión (añadir token a blacklist)
 */
const logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token de acceso requerido' });
        }
        const decoded = jwt.decode(token);
        const userId = decoded?.userId;
        const result = await (0, auth_service_1.logoutUser)(token);
        await (0, audit_service_1.logAuditEvent)('USER_LOGOUT', {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        }, userId);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Error en logout:', error);
        return res.status(500).json({
            message: 'Error al cerrar sesión',
            error: error.message
        });
    }
};
exports.logout = logout;
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({
                message: 'Email y código de verificación son obligatorios.'
            });
        }
        const result = await (0, auth_service_1.verifyEmailCode)(email, code);
        await (0, audit_service_1.logAuditEvent)('EMAIL_VERIFIED', {
            email: email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        return res.status(200).json({
            message: result.message,
            user: result.user
        });
    }
    catch (error) {
        console.error('Error en verificación de email:', error);
        return res.status(400).json({
            message: 'Error al verificar email',
            error: error.message
        });
    }
};
exports.verifyEmail = verifyEmail;
/**
 * Reenviar código de verificación
 */
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                message: 'Email es obligatorio.'
            });
        }
        const result = await (0, auth_service_2.resendVerificationCode)(email);
        await (0, audit_service_1.logAuditEvent)('VERIFICATION_CODE_RESENT', {
            email: email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        return res.status(200).json({
            message: result.message,
            expiresAt: result.expiresAt
        });
    }
    catch (error) {
        console.error('Error al reenviar código:', error);
        return res.status(400).json({
            message: 'Error al reenviar código de verificación',
            error: error.message
        });
    }
};
exports.resendVerification = resendVerification;
//# sourceMappingURL=auth.controller.js.map