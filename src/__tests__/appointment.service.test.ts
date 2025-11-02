import { PrismaClient, Role } from '@prisma/client';
import { AppointmentService } from '../services/appointment.service';

jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findUnique: jest.fn()
    },
    appointment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    }
  };
  return {
    PrismaClient: jest.fn(() => mPrisma),
    Role: { ADMINISTRADOR: 'ADMINISTRADOR', MEDICO: 'MEDICO', ENFERMERA: 'ENFERMERA', PACIENTE: 'PACIENTE' }
  };
});

const prisma = new PrismaClient() as any;

describe('AppointmentService', () => {
  const service = new AppointmentService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('create: creates appointment when patient and doctor exist', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 10, role: Role.PACIENTE }) // patient
      .mockResolvedValueOnce({ id: 20, role: Role.MEDICO }); // doctor

    prisma.appointment.create.mockResolvedValue({ id: 1, userId: 10, doctorId: 20, reason: 'Chequeo', date: new Date().toISOString(), status: 'PENDING' });

    const res = await service.create({ userId: 10, doctorId: 20, date: new Date(), reason: 'Chequeo' });

    expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
    expect(prisma.appointment.create).toHaveBeenCalled();
    expect(res).toHaveProperty('id');
  });

  test('create: throws if patient not found', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.create({ userId: 999, date: new Date(), reason: 'X' })).rejects.toThrow('Paciente no encontrado');
  });

  test('create: throws if doctorId provided but doctor not found', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 10, role: Role.PACIENTE }) // patient
      .mockResolvedValueOnce(null); // doctor

    await expect(service.create({ userId: 10, doctorId: 123, date: new Date(), reason: 'X' })).rejects.toThrow('Médico no encontrado');
  });

  test('getByPatient: returns list', async () => {
    prisma.appointment.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const res = await service.getByPatient(10);
    expect(Array.isArray(res)).toBe(true);
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 10 } }));
  });

  test('cancel: sets status to CANCELLED', async () => {
    prisma.appointment.update.mockResolvedValue({ id: 1, status: 'CANCELLED' });
    const res = await service.cancel(1);
    expect(res.status).toBe('CANCELLED');
    expect(prisma.appointment.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { status: 'CANCELLED' } });
  });
});