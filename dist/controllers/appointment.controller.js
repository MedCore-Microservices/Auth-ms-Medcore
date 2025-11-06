"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAppointment = exports.updateAppointment = exports.getAppointmentsByDoctor = exports.getAppointmentsByPatient = exports.getAppointmentById = exports.createAppointment = void 0;
const appointment_service_1 = __importDefault(require("../services/appointment.service"));
const parseDateTime = (dateStr) => {
    if (!dateStr)
        return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};
// POST /api/appointments
const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, specializationId, medicalRecordId, date, time, reason } = req.body;
        if (!patientId || !reason || !(date || time)) {
            return res.status(400).json({ message: 'patientId, date/time y reason son requeridos' });
        }
        // Permitir date completo o combinar date+time
        let dateTime = null;
        if (date && time)
            dateTime = parseDateTime(`${date}T${time}`);
        else if (date)
            dateTime = parseDateTime(date);
        else if (time)
            dateTime = parseDateTime(time);
        if (!dateTime)
            return res.status(400).json({ message: 'Fecha/hora inválida' });
        const created = await appointment_service_1.default.create({
            userId: parseInt(patientId, 10),
            doctorId: doctorId ? parseInt(doctorId, 10) : null,
            specializationId: specializationId ? parseInt(specializationId, 10) : null,
            medicalRecordId: medicalRecordId ? parseInt(medicalRecordId, 10) : null,
            date: dateTime,
            reason: String(reason)
        });
        return res.status(201).json({ message: 'Cita creada', appointment: created });
    }
    catch (error) {
        console.error('Error creando cita:', error);
        return res.status(500).json({ message: 'Error al crear la cita', error: error.message });
    }
};
exports.createAppointment = createAppointment;
// GET /api/appointments/:id
const getAppointmentById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id))
            return res.status(400).json({ message: 'ID inválido' });
        const appt = await appointment_service_1.default.getById(id);
        if (!appt)
            return res.status(404).json({ message: 'Cita no encontrada' });
        return res.status(200).json({ appointment: appt });
    }
    catch (error) {
        console.error('Error consultando cita:', error);
        return res.status(500).json({ message: 'Error al consultar la cita' });
    }
};
exports.getAppointmentById = getAppointmentById;
// GET /api/appointments/patient/:patientId
const getAppointmentsByPatient = async (req, res) => {
    try {
        const patientId = parseInt(req.params.patientId, 10);
        if (isNaN(patientId))
            return res.status(400).json({ message: 'ID de paciente inválido' });
        const appts = await appointment_service_1.default.getByPatient(patientId);
        return res.status(200).json({ appointments: appts });
    }
    catch (error) {
        console.error('Error consultando citas de paciente:', error);
        return res.status(500).json({ message: 'Error al consultar citas del paciente' });
    }
};
exports.getAppointmentsByPatient = getAppointmentsByPatient;
// GET /api/appointments/doctor/:doctorId
const getAppointmentsByDoctor = async (req, res) => {
    try {
        const doctorId = parseInt(req.params.doctorId, 10);
        if (isNaN(doctorId))
            return res.status(400).json({ message: 'ID de médico inválido' });
        const appts = await appointment_service_1.default.getByDoctor(doctorId);
        return res.status(200).json({ appointments: appts });
    }
    catch (error) {
        console.error('Error consultando citas de médico:', error);
        return res.status(500).json({ message: 'Error al consultar citas del médico' });
    }
};
exports.getAppointmentsByDoctor = getAppointmentsByDoctor;
// PUT /api/appointments/:id
const updateAppointment = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id))
            return res.status(400).json({ message: 'ID inválido' });
        const { doctorId, specializationId, medicalRecordId, date, time, reason, status } = req.body;
        const payload = {};
        if (doctorId !== undefined)
            payload.doctorId = doctorId ? parseInt(doctorId, 10) : null;
        if (specializationId !== undefined)
            payload.specializationId = specializationId ? parseInt(specializationId, 10) : null;
        if (medicalRecordId !== undefined)
            payload.medicalRecordId = medicalRecordId ? parseInt(medicalRecordId, 10) : null;
        if (date || time) {
            let dateTime = null;
            if (date && time)
                dateTime = parseDateTime(`${date}T${time}`);
            else if (date)
                dateTime = parseDateTime(date);
            else if (time)
                dateTime = parseDateTime(time);
            if (!dateTime)
                return res.status(400).json({ message: 'Fecha/hora inválida' });
            payload.date = dateTime;
        }
        if (reason !== undefined)
            payload.reason = reason ? String(reason) : null;
        if (status !== undefined) {
            const allowed = ['PENDING', 'COMPLETED', 'CANCELLED'];
            if (!allowed.includes(status))
                return res.status(400).json({ message: 'Estado inválido' });
            payload.status = status;
        }
        const updated = await appointment_service_1.default.update(id, payload);
        return res.status(200).json({ message: 'Cita actualizada', appointment: updated });
    }
    catch (error) {
        if (error?.code === 'P2025')
            return res.status(404).json({ message: 'Cita no encontrada' });
        console.error('Error actualizando cita:', error);
        return res.status(500).json({ message: 'Error al actualizar la cita' });
    }
};
exports.updateAppointment = updateAppointment;
// DELETE /api/appointments/:id
const cancelAppointment = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id))
            return res.status(400).json({ message: 'ID inválido' });
        const cancelled = await appointment_service_1.default.cancel(id);
        return res.status(200).json({ message: 'Cita cancelada', appointment: cancelled });
    }
    catch (error) {
        if (error?.code === 'P2025')
            return res.status(404).json({ message: 'Cita no encontrada' });
        console.error('Error cancelando cita:', error);
        return res.status(500).json({ message: 'Error al cancelar la cita' });
    }
};
exports.cancelAppointment = cancelAppointment;
//# sourceMappingURL=appointment.controller.js.map