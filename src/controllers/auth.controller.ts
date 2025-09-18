
import { Request, Response } from 'express';
import { loginUser, logoutUser, registerUser } from '../services/auth.service';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AccessTokenPayload, JwtUserPayload, RefreshTokenPayload } from '../types/jwt.types';


declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload | RefreshTokenPayload;
    }
  }
}

const prisma = new PrismaClient();
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // Validación básica
    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Todos los campos (email, password, role) son obligatorios.'
      });
    }

   
    const newUser = await registerUser(email, password, role);

    return res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error en el registro:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'El email y la contraseña son obligatorios.'
      });
    }

    const { accessToken, refreshToken, user } = await loginUser(email, password);

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

export const getProfile = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  // Casting explícito: sabemos que este controlador solo es accesible con un access token
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


export const refreshToken = async (req: Request, res: Response) => {
  const { userId } = req.user as RefreshTokenPayload; // El middleware ya verificó que existe

  // Buscar al usuario en la base de datos para obtener email y role
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  // Generar un NUEVO accessToken con toda la información
  const newAccessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  return res.status(200).json({
    message: 'Token de acceso renovado',
    accessToken: newAccessToken
  });
};


export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token de acceso requerido' });
    }

    // Llamar al servicio para invalidar el token
    const result = await logoutUser(token);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error en logout:', error);
    return res.status(500).json({
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};