"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = void 0;
// audit.service.ts
const client_1 = require("@prisma/client");
const logAuditEvent = async (action, details = {}, userId) => {
    const prisma = new client_1.PrismaClient(); // Instancia local
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
    }
    catch (error) {
        console.error('Error al registrar evento de auditoría:', error);
    }
    finally {
        await prisma.$disconnect();
    }
};
exports.logAuditEvent = logAuditEvent;
//# sourceMappingURL=audit.service.js.map