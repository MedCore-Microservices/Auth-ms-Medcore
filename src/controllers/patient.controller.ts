
import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import {
  sanitizeString,
  isValidName,
  calculateAge,
  isValidAge
} from '../utils/validation';
import { logAuditEvent } from '../services/audit.service';

const prisma = new PrismaClient();

// GET /api/patients - Listar pacientes (paginado)
export const getPatients = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;

    const skip = (page - 1) * limit;

    const where: any = { role: Role.PACIENTE };
    if (status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
      where.status = status;
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullname: true,
          dateOfBirth: true,
          status: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return res.status(200).json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error listando pacientes:', error);
    return res.status(500).json({ message: 'Error al obtener la lista de pacientes.' });
  }
};

// GET /api/patients/:id - Obtener paciente por ID
export const getPatientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = parseInt(id, 10);

    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'ID de paciente inválido.' });
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: Role.PACIENTE },
      select: {
        id: true,
        email: true,
        fullname: true,
        dateOfBirth: true,
        status: true,
        phone: true,
        bloodType: true,
        allergies: true,
        chronicDiseases: true,
        emergencyContact: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!patient) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }

    return res.status(200).json({ patient });
  } catch (error: any) {
    console.error('Error obteniendo paciente:', error);
    return res.status(500).json({ message: 'Error al obtener el paciente.' });
  }
};

// PUT /api/patients/:id - Actualizar paciente
export const updatePatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = parseInt(id, 10);

    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'ID de paciente inválido.' });
    }

    const { fullname, dateOfBirth, phone, bloodType, allergies, chronicDiseases, emergencyContact } = req.body;

    if (!fullname && !dateOfBirth && !phone && !bloodType && !allergies && !chronicDiseases && !emergencyContact) {
      return res.status(400).json({ message: 'Al menos un campo debe actualizarse.' });
    }

    const dataToUpdate: any = {};

    if (fullname !== undefined) {
      const cleanName = sanitizeString(fullname);
      if (!isValidName(cleanName)) {
        return res.status(400).json({ message: 'Nombre inválido.' });
      }
      dataToUpdate.fullname = cleanName;
    }

    if (dateOfBirth !== undefined) {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ message: 'Fecha de nacimiento inválida.' });
      }
      const age = calculateAge(birthDate);
      if (!isValidAge(age)) {
        return res.status(400).json({ message: 'Edad fuera del rango permitido (0-100).' });
      }
      dataToUpdate.dateOfBirth = birthDate;
    }

    if (phone !== undefined) dataToUpdate.phone = phone ? sanitizeString(phone) : null;
    if (bloodType !== undefined) dataToUpdate.bloodType = bloodType ? sanitizeString(bloodType) : null;
    if (allergies !== undefined) dataToUpdate.allergies = allergies ? sanitizeString(allergies) : null;
    if (chronicDiseases !== undefined) dataToUpdate.chronicDiseases = chronicDiseases ? sanitizeString(chronicDiseases) : null;
    if (emergencyContact !== undefined) dataToUpdate.emergencyContact = emergencyContact ? sanitizeString(emergencyContact) : null;

    const updatedPatient = await prisma.user.update({
      where: { id: patientId, role: Role.PACIENTE },
      data: dataToUpdate, // ✅ CORREGIDO: "data:" en lugar de solo "dataToUpdate"
      select: {
        id: true,
        email: true,
        fullname: true,
        dateOfBirth: true,
        status: true,
        phone: true,
        updatedAt: true
      }
    });

    await logAuditEvent('PATIENT_UPDATED', { patientId }, (req as any).user?.userId);

    return res.status(200).json({ message: 'Paciente actualizado exitosamente.', patient: updatedPatient });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }
    console.error('Error actualizando paciente:', error);
    return res.status(500).json({ message: 'Error al actualizar el paciente.' });
  }
};

// PATCH /api/patients/state/:id - Actualizar estado (ACTIVO/INACTIVO)
export const updatePatientState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const patientId = parseInt(id, 10);
    const { status } = req.body;

    if (isNaN(patientId)) {
      return res.status(400).json({ message: 'ID de paciente inválido.' });
    }

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'El estado debe ser "ACTIVE" o "INACTIVE".' });
    }

    const updatedPatient = await prisma.user.update({
      where: { id: patientId, role: Role.PACIENTE },
      data: { status }, // ✅ CORREGIDO: objeto con "status"
      select: { id: true, email: true, status: true, updatedAt: true }
    });

    await logAuditEvent('PATIENT_STATE_UPDATED', { patientId, newStatus: status }, (req as any).user?.userId);

    return res.status(200).json({ message: 'Estado del paciente actualizado.', patient: updatedPatient });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }
    console.error('Error actualizando estado:', error);
    return res.status(500).json({ message: 'Error al actualizar el estado del paciente.' });
  }
};