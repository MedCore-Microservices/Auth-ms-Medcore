// src/services/audit.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logAuditEvent = async (
  action: string,
  details: Record<string, any> = {},
  userId?: number
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details), // Convertimos el objeto a string JSON
        timestamp: new Date()
      }
    });
    console.log(`[AUDIT] ${action} - User: ${userId || 'N/A'}`);
  } catch (error) {
    console.error('Error al registrar evento de auditoría:', error);
 
  }
};