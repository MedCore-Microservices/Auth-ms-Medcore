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
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
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

  // Transiciones de estado soportadas
  private readonly validTransitions: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    CONFIRMED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: []
  };

  async transition(id: number, nextStatus: string) {
    const appt = await prisma.appointment.findUnique({ where: { id } });
    if (!appt) {
      const err: any = new Error('Cita no encontrada');
      err.code = 'NOT_FOUND';
      throw err;
    }
    const current = (appt.status || 'PENDING').toUpperCase();
    const target = nextStatus.toUpperCase();
    const allowed = this.validTransitions[current] || [];
    if (!allowed.includes(target)) {
      const err: any = new Error('Transición inválida');
      err.code = 'INVALID_STATUS';
      throw err;
    }
    // Actualizar
    return prisma.appointment.update({ where: { id: appt.id }, data: { status: target } });
  }
}

export default new AppointmentService();
