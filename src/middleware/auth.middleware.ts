
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Extendemos el tipo Request para incluir 'user'
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. Obtener el token del header "Authorization"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  // 2. Verificar y decodificar el token
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }

    // 3. Adjuntar la información del usuario al objeto 'req'
    req.user = user as JwtPayload;
    next(); // Pasar al siguiente middleware o controlador
  });
};