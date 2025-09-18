// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AccessTokenPayload } from '../types/jwt.types'; // Importamos el tipo
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }


// Verificar si el token está en la blacklist
  const blacklistedToken = await prisma.tokenBlacklist.findUnique({
    where: { token }
  });

  if (blacklistedToken) {
    return res.status(401).json({ message: 'Token ha sido revocado' });
  }



  // Tipamos explícitamente los parámetros del callback
  jwt.verify(token, process.env.JWT_SECRET!, (err: jwt.VerifyErrors | null, user: unknown) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }

    // Verificamos que el payload tiene la estructura esperada
    if (typeof user !== 'object' || user === null || !('userId' in user) || !('email' in user) || !('role' in user)) {
      return res.status(403).json({ message: 'Token con formato inválido' });
    }

    req.user = user as AccessTokenPayload;
    next();
  });
};