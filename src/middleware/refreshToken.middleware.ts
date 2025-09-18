
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { RefreshTokenPayload } from '../types/jwt.types'; 


export const refreshTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token requerido' });
  }

  // Tipamos explícitamente los parámetros del callback
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, (err: jwt.VerifyErrors | null, user: unknown) => {
    if (err) {
      return res.status(403).json({ message: 'Refresh token inválido o expirado' });
    }

    // Verificamos que el payload tiene la estructura esperada
    if (typeof user !== 'object' || user === null || !('userId' in user)) {
      return res.status(403).json({ message: 'Refresh token con formato inválido' });
    }

    req.user = user as RefreshTokenPayload;
    next();
  });
};