import { Request, Response } from 'express';
import scheduleService from '../services/schedule.service';

const parseIntParam = (value: string) => {
  const n = parseInt(value, 10);
  if (isNaN(n)) throw new Error('Parámetro inválido');
  return n;
};

// GET /api/schedule/:doctorId?from=ISO&to=ISO
export const getDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const doctorId = parseIntParam(req.params.doctorId);
    const { from, to } = req.query as { from?: string; to?: string };

    let fromDate: Date;
    let toDate: Date;
    if (from && to) {
      fromDate = new Date(from);
      toDate = new Date(to);
    } else {
      // Rango por defecto: hoy 00:00 hasta +7 días
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      fromDate = today;
      toDate = new Date(today);
      toDate.setDate(toDate.getDate() + 7);
    }

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return res.status(400).json({ message: 'Rango inválido' });

    const data = await scheduleService.getAvailability(doctorId, fromDate, toDate);
    return res.status(200).json({ availability: data });
  } catch (error: any) {
    const msg = error?.message || 'Error al consultar disponibilidad';
    const status = msg.includes('Médico no encontrado') ? 404 : 400;
    return res.status(status).json({ message: msg });
  }
};

// POST /api/schedule/:doctorId
export const configureDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const doctorId = parseIntParam(req.params.doctorId);
    const { date, from, to, startHour, endHour, slotMinutes, overwrite } = req.body;

    if (!startHour || !endHour) return res.status(400).json({ message: 'startHour y endHour son requeridos' });

    const result = await scheduleService.configureSchedule(doctorId, {
      date,
      from,
      to,
      startHour,
      endHour,
      slotMinutes,
      overwrite
    });

    return res.status(201).json({ message: 'Horario configurado', result });
  } catch (error: any) {
    const msg = error?.message || 'Error al configurar el horario';
    const status = msg.includes('Médico no encontrado') ? 404 : 400;
    return res.status(status).json({ message: msg });
  }
};

// PATCH /api/schedule/:doctorId/block
export const blockDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const doctorId = parseIntParam(req.params.doctorId);
    const { start, end, reason } = req.body as { start?: string; end?: string; reason?: string };
    if (!start || !end) return res.status(400).json({ message: 'start y end son requeridos' });

    const result = await scheduleService.blockRange(doctorId, { start, end, reason });
    return res.status(200).json({ message: 'Horario bloqueado', result });
  } catch (error: any) {
    const msg = error?.message || 'Error al bloquear el horario';
    const status = msg.includes('Médico no encontrado') ? 404 : 400;
    return res.status(status).json({ message: msg });
  }
};
