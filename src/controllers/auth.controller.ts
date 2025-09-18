
import { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/auth.service';

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
  // ¡El middleware ya verificó el token y puso 'req.user'!
  if (!req.user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  return res.status(200).json({
    message: 'Perfil del usuario',
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
};