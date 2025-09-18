
import { Request, Response } from 'express';
import { registerUser } from '../services/auth.service';

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