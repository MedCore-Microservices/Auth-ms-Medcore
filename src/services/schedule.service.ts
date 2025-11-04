import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export type ConfigureScheduleInput = {
  date?: string; // YYYY-MM-DD
  from?: string; // ISO string
  to?: string;   // ISO string
  startHour: string; // HH:mm
  endHour: string;   // HH:mm
  slotMinutes?: number; // default 30
  overwrite?: boolean; // default true
};

export type BlockScheduleInput = {
  start: string; // ISO
  end: string;   // ISO
  reason?: string;
};

const toDate = (s: string) => {
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error('Fecha inválida');
  return d;
};

const setTime = (base: Date, hhmm: string) => {
  const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m)) throw new Error('Hora inválida');
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
};

const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60000);

export class ScheduleService {
  async ensureDoctorExists(doctorId: number) {
    const doctor = await prisma.user.findUnique({ where: { id: doctorId, role: Role.MEDICO } });
    if (!doctor) throw new Error('Médico no encontrado');
    return doctor;
  }

  async configureSchedule(doctorId: number, input: ConfigureScheduleInput) {
    await this.ensureDoctorExists(doctorId);

    const slotMinutes = input.slotMinutes ?? 30;
    const overwrite = input.overwrite ?? true;

    // Determinar rango de días/fechas
    let dayStart: Date;
    let dayEnd: Date;

    if (input.date) {
      const d = toDate(input.date);
      // normalizar a medianoche local
      dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
    } else if (input.from && input.to) {
      dayStart = toDate(input.from);
      dayEnd = toDate(input.to);
      if (dayEnd <= dayStart) throw new Error('Rango inválido');
    } else {
      throw new Error('Debe proporcionar date o from/to');
    }

    // Generar bloques dentro de cada día
    const slotsToCreate: { start: Date; end: Date }[] = [];

    let cursor = new Date(dayStart);
    while (cursor < dayEnd) {
      const currentDayStart = setTime(cursor, input.startHour);
      const currentDayEnd = setTime(cursor, input.endHour);
      if (currentDayEnd <= currentDayStart) {
        throw new Error('El endHour debe ser mayor que startHour');
      }
      let s = currentDayStart;
      while (s < currentDayEnd) {
        const e = addMinutes(s, slotMinutes);
        if (e > currentDayEnd) break;
        slotsToCreate.push({ start: new Date(s), end: new Date(e) });
        s = e;
      }
      // siguiente día si estamos configurando por rango
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
    }

    if (slotsToCreate.length === 0) return { created: 0, updated: 0 };

    let created = 0;
    let updated = 0;

    for (const slot of slotsToCreate) {
      try {
        await prisma.scheduleSlot.create({
          data: {
            doctorId,
            start: slot.start,
            end: slot.end,
            status: 'AVAILABLE'
          }
        });
        created++;
      } catch (err: any) {
        // Si existe y overwrite true, actualizar si estaba BLOQUEADO
        if (err?.code === 'P2002') {
          if (overwrite) {
            const updatedRes = await prisma.scheduleSlot.update({
              where: {
                doctorId_start_end: { doctorId, start: slot.start, end: slot.end }
              },
              data: { status: 'AVAILABLE', blockReason: null }
            });
            if (updatedRes) updated++;
          }
        } else {
          throw err;
        }
      }
    }

    return { created, updated };
  }

  async blockRange(doctorId: number, input: BlockScheduleInput) {
    await this.ensureDoctorExists(doctorId);
    const start = toDate(input.start);
    const end = toDate(input.end);
    if (end <= start) throw new Error('Rango inválido');

    // Obtener todos los slots que encajan en el rango
    const existing = await prisma.scheduleSlot.findMany({
      where: {
        doctorId,
        start: { gte: start },
        end: { lte: end }
      }
    });

    const slotMinutes = 30; // bloquear en bloques de 30 min
    // Crear slots faltantes como BLOCKED
    const toCreate: { start: Date; end: Date }[] = [];
    let s = new Date(start);
    while (s < end) {
      const e = addMinutes(s, slotMinutes);
      if (e > end) break;
      const exists = existing.some((slot) => slot.start.getTime() === s.getTime() && slot.end.getTime() === e.getTime());
      if (!exists) toCreate.push({ start: new Date(s), end: new Date(e) });
      s = e;
    }

    await prisma.$transaction([
      ...toCreate.map((slot) =>
        prisma.scheduleSlot.create({
          data: {
            doctorId,
            start: slot.start,
            end: slot.end,
            status: 'BLOCKED',
            blockReason: input.reason ?? 'Bloqueado'
          }
        })
      ),
      prisma.scheduleSlot.updateMany({
        where: { doctorId, start: { gte: start }, end: { lte: end } },
        data: { status: 'BLOCKED', blockReason: input.reason ?? 'Bloqueado' }
      })
    ]);

    return { blockedFrom: start.toISOString(), blockedTo: end.toISOString() };
  }

  async getAvailability(doctorId: number, from: Date, to: Date) {
    await this.ensureDoctorExists(doctorId);
    if (to <= from) throw new Error('Rango inválido');

    const [slots, appts] = await Promise.all([
      prisma.scheduleSlot.findMany({
        where: { doctorId, start: { gte: from }, end: { lte: to } },
        orderBy: { start: 'asc' }
      }),
      prisma.appointment.findMany({
        where: { doctorId, date: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
        select: { id: true, date: true }
      })
    ]);

    const apptSet = new Set(appts.map((a) => new Date(a.date).getTime()));

    return slots.map((slot) => {
      let computedStatus = slot.status as 'AVAILABLE' | 'BLOCKED' | 'BOOKED';
      if (computedStatus !== 'BLOCKED') {
        if (apptSet.has(new Date(slot.start).getTime())) computedStatus = 'BOOKED';
        else computedStatus = 'AVAILABLE';
      }
      return {
        id: slot.id,
        start: slot.start,
        end: slot.end,
        status: computedStatus,
        blockReason: slot.blockReason ?? null
      };
    });
  }
}

export default new ScheduleService();
