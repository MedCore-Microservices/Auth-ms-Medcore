
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !user.role) {
      return res.status(403).json({ message: 'Acceso denegado: no autorizado' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Acceso denegado: rol no permitido' });
    }

    next();
  };
};