"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AppointmentService {
    async create(data) {
        // Basic existence validation for user and optional doctor
        const [patient, doctor] = await Promise.all([
            prisma.user.findUnique({ where: { id: data.userId, role: client_1.Role.PACIENTE } }),
            data.doctorId ? prisma.user.findUnique({ where: { id: data.doctorId, role: client_1.Role.MEDICO } }) : Promise.resolve(null)
        ]);
        if (!patient)
            throw new Error('Paciente no encontrado');
        if (data.doctorId && !doctor)
            throw new Error('Médico no encontrado');
        return prisma.appointment.create({
            data: {
                userId: data.userId,
                doctorId: data.doctorId ?? null,
                medicalRecordId: data.medicalRecordId ?? null,
                date: data.date,
                reason: data.reason
            }
        });
    }
    async getById(id) {
        return prisma.appointment.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, fullname: true, email: true } },
                doctor: { select: { id: true, fullname: true, email: true } },
                // specialization include pending migration
            }
        });
    }
    async getByPatient(patientId) {
        return prisma.appointment.findMany({
            where: { userId: patientId },
            orderBy: { date: 'desc' },
            include: {
                doctor: { select: { id: true, fullname: true } }
            }
        });
    }
    async getByDoctor(doctorId) {
        return prisma.appointment.findMany({
            where: { doctorId },
            orderBy: { date: 'desc' },
            include: {
                user: { select: { id: true, fullname: true } }
            }
        });
    }
    async update(id, data) {
        // Cast to any until Prisma Client is regenerated with latest schema
        return prisma.appointment.update({
            where: { id },
            data: data
        });
    }
    async cancel(id) {
        // Soft delete as cancel
        return prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
    }
}
exports.AppointmentService = AppointmentService;
exports.default = new AppointmentService();
//# sourceMappingURL=appointment.service.js.map