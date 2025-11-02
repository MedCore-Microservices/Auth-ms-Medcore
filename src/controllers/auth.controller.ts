import { Request, Response } from 'express';
import { loginUser, logoutUser, registerUser as registerService,verifyEmailCode} from '../services/auth.service';
import * as jwt from 'jsonwebtoken';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/jwt.types';
import { logAuditEvent } from '../services/audit.service';
import { resendVerificationCode } from './../services/auth.service';

// Extensión de Express para incluir el payload del token
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload | RefreshTokenPayload;
    }
  }
}

//  Eliminamos Prisma del controlador: se usa solo en los servicios

/**
 * Registro general (puede usarse si se decide permitir rol, pero NO recomendado para público)
 * lo dejamos como registro público con rol fijo.
 */
export const register = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const fromNested = (paths: string[]): any => {
      for (const p of paths) {
        try {
          const val = p.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), body);
          if (val !== undefined && val !== null && String(val).trim() !== '') return val;
        } catch {}
      }
      return undefined;
    };
    const email = body.email;
    const password = body.password;
    const fullname = body.fullname;
    // Normalización de campos opcionales (admite variantes desde el frontend)
    const identificationNumber = (() => {
      const v = fromNested([
        'identificationNumber',
        'identification_number',
        'identificacion',
        'patient.identificationNumber',
        'patient.identification_number'
      ]);
      return v !== undefined ? String(v).trim() : undefined;
    })();

    const dateOfBirth = (() => {
      const v = fromNested([
        'dateOfBirth',
        'dateofBirth',
        'birthDate',
        'fechaNacimiento',
        'patient.dateOfBirth',
        'patient.birthDate'
      ]);
      return v !== undefined ? String(v).trim() : undefined;
    })();

    const gender = (() => {
      const v = fromNested(['gender', 'sexo', 'patient.gender']);
      return v !== undefined ? String(v).trim() : undefined;
    })();

    const phone = (() => {
      const v = fromNested(['phone', 'phoneNumber', 'telefono', 'patient.phone']);
      return v !== undefined ? String(v).trim() : undefined;
    })();

    // Debug no sensible: solo claves y content-type (evita loguear valores como password)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const keys = Object.keys(req.body || {});
        // eslint-disable-next-line no-console
        console.log('[register] content-type:', req.headers['content-type'], 'keys:', keys);
        // eslint-disable-next-line no-console
        console.log('[register] normalized fields:', {
          hasIdentificationNumber: identificationNumber !== undefined,
          identificationNumber,
          hasDateOfBirth: dateOfBirth !== undefined,
          dateOfBirth,
          hasGender: gender !== undefined,
          gender,
          hasPhone: phone !== undefined,
          phone
        });
      } catch {}
    }

    const missing: string[] = [];
    if (!email) missing.push('email');
    if (!password) missing.push('password');
    if (!fullname) missing.push('fullname');
    if (missing.length > 0) {
      return res.status(400).json({
        message: 'Campos obligatorios faltantes',
        missing
      });
    }

    // Construir payload y pasarlo al servicio
    const payload = {
      email,
      password,
      fullname,
      identificationNumber,
      dateOfBirth,
      gender,
      phone
    };

    const newUser = await registerService(payload);

    await logAuditEvent('USER_REGISTER', {
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
        identificationNumber: newUser.identificationNumber ?? null,
        dateOfBirth: newUser.dateOfBirth ?? null,
        age: newUser.age ?? null,
        gender: newUser.gender ?? null,
        phone: newUser.phone ?? null,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error en el registro:', error);
    return res.status(400).json({
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};


export const registerPublicUser = async (req: Request, res: Response) => {
  return register(req, res);
};

/**
 * Inicio de sesión
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'El email y la contraseña son obligatorios.'
      });
    }

    const { accessToken, refreshToken, user } = await loginUser(email, password);

    await logAuditEvent('USER_LOGIN', {
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
  } catch (error: any) {
    console.error('Error en el login:', error);
    return res.status(401).json({
      message: 'Credenciales inválidas',
      error: error.message
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  const userPayload = req.user as AccessTokenPayload;

  return res.status(200).json({
    message: 'Perfil del usuario',
    user: {
      id: userPayload.userId,
      email: userPayload.email,
      role: userPayload.role,
    }
  });
};

/**
 * Renovar access token usando refresh token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as RefreshTokenPayload;

  
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    await prisma.$disconnect(); 

    return res.status(200).json({
      message: 'Token de acceso renovado',
      accessToken: newAccessToken
    });
  } catch (error: any) {
    console.error('Error al renovar token:', error);
    return res.status(401).json({
      message: 'No autorizado',
      error: error.message
    });
  }
};

/**
 * Cerrar sesión (añadir token a blacklist)
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    const decoded: any = jwt.decode(token);
    const userId = decoded?.userId;

    const result = await logoutUser(token);

    await logAuditEvent('USER_LOGOUT', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }, userId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error en logout:', error);
    return res.status(500).json({
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};


export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: 'Email y código de verificación son obligatorios.'
      });
    }

    const result = await verifyEmailCode(email, code);

    await logAuditEvent('EMAIL_VERIFIED', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(200).json({
      message: result.message,
      user: result.user
    });
  } catch (error: any) {
    console.error('Error en verificación de email:', error);
    return res.status(400).json({
      message: 'Error al verificar email',
      error: error.message
    });
  }
};

/**
 * Reenviar código de verificación
 */
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email es obligatorio.'
      });
    }

    const result = await resendVerificationCode(email);

    await logAuditEvent('VERIFICATION_CODE_RESENT', {
      email: email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(200).json({
      message: result.message,
      expiresAt: result.expiresAt
    });
  } catch (error: any) {
    console.error('Error al reenviar código:', error);
    return res.status(400).json({
      message: 'Error al reenviar código de verificación',
      error: error.message
    });
  }
};

