// audit.service.ts
import { PrismaClient } from '@prisma/client';

export const logAuditEvent = async (
  action: string,
  details: Record<string, any> = {},
  userId?: number
) => {
  const prisma = new PrismaClient(); // Instancia local

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
        timestamp: new Date()
      }
    });
    console.log(`[AUDIT] ${action} - User: ${userId || 'N/A'}`);
  } catch (error) {
    console.error('Error al registrar evento de auditoría:', error);
  } finally {
   
    await prisma.$disconnect();
  }
};