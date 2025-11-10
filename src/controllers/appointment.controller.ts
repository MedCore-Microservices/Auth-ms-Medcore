import { Request, Response } from 'express';
import appointmentService from '../services/appointment.service';

const parseDateTime = (dateStr?: string) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

// POST /api/appointments
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, specializationId, medicalRecordId, date, time, reason } = req.body;

    if (!patientId || !reason || !(date || time)) {
      return res.status(400).json({ message: 'patientId, date/time y reason son requeridos' });
    }

    // Permitir date completo o combinar date+time
    let dateTime: Date | null = null;
    if (date && time) dateTime = parseDateTime(`${date}T${time}`);
    else if (date) dateTime = parseDateTime(date);
    else if (time) dateTime = parseDateTime(time);

    if (!dateTime) return res.status(400).json({ message: 'Fecha/hora inválida' });

    const created = await appointmentService.create({
      userId: parseInt(patientId, 10),
      doctorId: doctorId ? parseInt(doctorId, 10) : null,
      specializationId: specializationId ? parseInt(specializationId, 10) : null,
      medicalRecordId: medicalRecordId ? parseInt(medicalRecordId, 10) : null,
      date: dateTime,
      reason: String(reason)
    });

    return res.status(201).json({ message: 'Cita creada', appointment: created });
  } catch (error: any) {
    console.error('Error creando cita:', error);
    return res.status(500).json({ message: 'Error al crear la cita', error: error.message });
  }
};

// GET /api/appointments/:id
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    const appt = await appointmentService.getById(id);
    if (!appt) return res.status(404).json({ message: 'Cita no encontrada' });
    return res.status(200).json({ appointment: appt });
  } catch (error: any) {
    console.error('Error consultando cita:', error);
    return res.status(500).json({ message: 'Error al consultar la cita' });
  }
};

// GET /api/appointments/patient/:patientId
export const getAppointmentsByPatient = async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId, 10);
    if (isNaN(patientId)) return res.status(400).json({ message: 'ID de paciente inválido' });
    const appts = await appointmentService.getByPatient(patientId);
    return res.status(200).json({ appointments: appts });
  } catch (error: any) {
    console.error('Error consultando citas de paciente:', error);
    return res.status(500).json({ message: 'Error al consultar citas del paciente' });
  }
};

// GET /api/appointments/doctor/:doctorId
export const getAppointmentsByDoctor = async (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);
    if (isNaN(doctorId)) return res.status(400).json({ message: 'ID de médico inválido' });
    const appts = await appointmentService.getByDoctor(doctorId);
    return res.status(200).json({ appointments: appts });
  } catch (error: any) {
    console.error('Error consultando citas de médico:', error);
    return res.status(500).json({ message: 'Error al consultar citas del médico' });
  }
};

// PUT /api/appointments/:id
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    const { doctorId, specializationId, medicalRecordId, date, time, reason, status } = req.body;

    const payload: any = {};
    if (doctorId !== undefined) payload.doctorId = doctorId ? parseInt(doctorId, 10) : null;
    if (specializationId !== undefined)
      payload.specializationId = specializationId ? parseInt(specializationId, 10) : null;
    if (medicalRecordId !== undefined)
      payload.medicalRecordId = medicalRecordId ? parseInt(medicalRecordId, 10) : null;

    if (date || time) {
      let dateTime: Date | null = null;
      if (date && time) dateTime = parseDateTime(`${date}T${time}`);
      else if (date) dateTime = parseDateTime(date);
      else if (time) dateTime = parseDateTime(time);
      if (!dateTime) return res.status(400).json({ message: 'Fecha/hora inválida' });
      payload.date = dateTime;
    }

    if (reason !== undefined) payload.reason = reason ? String(reason) : null;
    if (status !== undefined) {
      const allowed = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
      if (!allowed.includes(status)) return res.status(400).json({ message: 'Estado inválido' });
      payload.status = status;
    }

    const updated = await appointmentService.update(id, payload);
    return res.status(200).json({ message: 'Cita actualizada', appointment: updated });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ message: 'Cita no encontrada' });
    console.error('Error actualizando cita:', error);
    return res.status(500).json({ message: 'Error al actualizar la cita' });
  }
};

// DELETE /api/appointments/:id
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const cancelled = await appointmentService.cancel(id);
    return res.status(200).json({ message: 'Cita cancelada', appointment: cancelled });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ message: 'Cita no encontrada' });
    console.error('Error cancelando cita:', error);
    return res.status(500).json({ message: 'Error al cancelar la cita' });
  }
};

// POST /api/appointments/:id/confirm
export const confirmAppointmentAction = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const updated = await appointmentService.transition(id, 'CONFIRMED');
    return res.status(200).json({ message: 'Cita confirmada', appointment: updated });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ message: 'Cita no encontrada' });
    if (error.code === 'INVALID_STATUS') return res.status(400).json({ message: 'Transición inválida' });
    console.error('Error confirmando cita:', error);
    return res.status(500).json({ message: 'Error al confirmar la cita' });
  }
};

// POST /api/appointments/:id/start (o /in-progress)
export const startAppointmentAction = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const updated = await appointmentService.transition(id, 'IN_PROGRESS');
    return res.status(200).json({ message: 'Cita en curso', appointment: updated });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ message: 'Cita no encontrada' });
    if (error.code === 'INVALID_STATUS') return res.status(400).json({ message: 'Transición inválida' });
    console.error('Error iniciando cita:', error);
    return res.status(500).json({ message: 'Error al iniciar la cita' });
  }
};

// POST /api/appointments/:id/complete
export const completeAppointmentAction = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const updated = await appointmentService.transition(id, 'COMPLETED');
    return res.status(200).json({ message: 'Cita completada', appointment: updated });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ message: 'Cita no encontrada' });
    if (error.code === 'INVALID_STATUS') return res.status(400).json({ message: 'Transición inválida' });
    console.error('Error completando cita:', error);
    return res.status(500).json({ message: 'Error al completar la cita' });
  }
};

// POST /api/appointments/:id/mark-no-show
export const markNoShowAppointmentAction = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const updated = await appointmentService.transition(id, 'NO_SHOW');
    return res.status(200).json({ message: 'Paciente no se presentó', appointment: updated });
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ message: 'Cita no encontrada' });
    if (error.code === 'INVALID_STATUS') return res.status(400).json({ message: 'Transición inválida' });
    console.error('Error marcando no-show:', error);
    return res.status(500).json({ message: 'Error al marcar no-show' });
  }
};
