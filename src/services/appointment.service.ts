import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export type CreateAppointmentInput = {
  userId: number;
  doctorId?: number | null;
  // specializationId is planned but pending migration; ignored for now
  specializationId?: number | null;
  medicalRecordId?: number | null;
  date: Date;
  reason: string;
};

export type UpdateAppointmentInput = {
  doctorId?: number | null;
  specializationId?: number | null;
  medicalRecordId?: number | null;
  date?: Date;
  reason?: string | null;
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
};

export class AppointmentService {
  async create(data: CreateAppointmentInput) {
    // Basic existence validation for user and optional doctor
    const [patient, doctor] = await Promise.all([
      prisma.user.findUnique({ where: { id: data.userId, role: Role.PACIENTE } }),
      data.doctorId ? prisma.user.findUnique({ where: { id: data.doctorId, role: Role.MEDICO } }) : Promise.resolve(null)
    ]);

    if (!patient) throw new Error('Paciente no encontrado');
    if (data.doctorId && !doctor) throw new Error('Médico no encontrado');

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

  async getById(id: number) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullname: true, email: true } },
        doctor: { select: { id: true, fullname: true, email: true } },
        // specialization include pending migration
      }
    });
  }

  async getByPatient(patientId: number) {
    return prisma.appointment.findMany({
      where: { userId: patientId },
      orderBy: { date: 'desc' },
      include: {
        doctor: { select: { id: true, fullname: true } }
      }
    });
  }

  async getByDoctor(doctorId: number) {
    return prisma.appointment.findMany({
      where: { doctorId },
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, fullname: true } }
      }
    });
  }

  async update(id: number, data: UpdateAppointmentInput) {
    // Cast to any until Prisma Client is regenerated with latest schema
    return prisma.appointment.update({
      where: { id },
      data: data as any
    });
  }

  async cancel(id: number) {
    // Soft delete as cancel
    return prisma.appointment.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}

export default new AppointmentService();
