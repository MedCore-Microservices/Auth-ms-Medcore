"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockDoctorSchedule = exports.configureDoctorSchedule = exports.getDoctorAvailability = void 0;
const schedule_service_1 = __importDefault(require("../services/schedule.service"));
const parseIntParam = (value) => {
    const n = parseInt(value, 10);
    if (isNaN(n))
        throw new Error('Parámetro inválido');
    return n;
};
// GET /api/schedule/:doctorId?from=ISO&to=ISO
const getDoctorAvailability = async (req, res) => {
    try {
        const doctorId = parseIntParam(req.params.doctorId);
        const { from, to } = req.query;
        let fromDate;
        let toDate;
        if (from && to) {
            fromDate = new Date(from);
            toDate = new Date(to);
        }
        else {
            // Rango por defecto: hoy 00:00 hasta +7 días
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            fromDate = today;
            toDate = new Date(today);
            toDate.setDate(toDate.getDate() + 7);
        }
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()))
            return res.status(400).json({ message: 'Rango inválido' });
        const data = await schedule_service_1.default.getAvailability(doctorId, fromDate, toDate);
        return res.status(200).json({ availability: data });
    }
    catch (error) {
        const msg = error?.message || 'Error al consultar disponibilidad';
        const status = msg.includes('Médico no encontrado') ? 404 : 400;
        return res.status(status).json({ message: msg });
    }
};
exports.getDoctorAvailability = getDoctorAvailability;
// POST /api/schedule/:doctorId
const configureDoctorSchedule = async (req, res) => {
    try {
        const doctorId = parseIntParam(req.params.doctorId);
        const { date, from, to, startHour, endHour, slotMinutes, overwrite } = req.body;
        if (!startHour || !endHour)
            return res.status(400).json({ message: 'startHour y endHour son requeridos' });
        const result = await schedule_service_1.default.configureSchedule(doctorId, {
            date,
            from,
            to,
            startHour,
            endHour,
            slotMinutes,
            overwrite
        });
        return res.status(201).json({ message: 'Horario configurado', result });
    }
    catch (error) {
        const msg = error?.message || 'Error al configurar el horario';
        const status = msg.includes('Médico no encontrado') ? 404 : 400;
        return res.status(status).json({ message: msg });
    }
};
exports.configureDoctorSchedule = configureDoctorSchedule;
// PATCH /api/schedule/:doctorId/block
const blockDoctorSchedule = async (req, res) => {
    try {
        const doctorId = parseIntParam(req.params.doctorId);
        const { start, end, reason } = req.body;
        if (!start || !end)
            return res.status(400).json({ message: 'start y end son requeridos' });
        const result = await schedule_service_1.default.blockRange(doctorId, { start, end, reason });
        return res.status(200).json({ message: 'Horario bloqueado', result });
    }
    catch (error) {
        const msg = error?.message || 'Error al bloquear el horario';
        const status = msg.includes('Médico no encontrado') ? 404 : 400;
        return res.status(status).json({ message: msg });
    }
};
exports.blockDoctorSchedule = blockDoctorSchedule;
//# sourceMappingURL=schedule.controller.js.map