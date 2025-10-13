import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import {
  sanitizeString,
  isValidName
} from '../utils/validation';
import { logAuditEvent } from '../services/audit.service';

const prisma = new PrismaClient();

// GET /api/nurses - Listar enfermeras (paginado)
export const getNurses = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;

    const skip = (page - 1) * limit;

    const where: any = { role: Role.ENFERMERA };
    
    if (status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
      where.status = status;
    }
    
    if (departmentId && !isNaN(departmentId)) {
      where.departmentId = departmentId;
    }

    const [nurses, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullname: true,
          identificationNumber: true,
          phone: true,
          status: true,
          licenseNumber: true,
          dateOfBirth: true,
          age: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return res.status(200).json({
      nurses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error listando enfermeras:', error);
    return res.status(500).json({ message: 'Error al obtener la lista de enfermeras.' });
  }
};

// GET /api/nurses/:id - Obtener enfermera por ID
export const getNurseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const nurseId = parseInt(id, 10);

    if (isNaN(nurseId)) {
      return res.status(400).json({ message: 'ID de enfermera inválido.' });
    }

    const nurse = await prisma.user.findUnique({
      where: { id: nurseId, role: Role.ENFERMERA },
      select: {
        id: true,
        email: true,
        fullname: true,
        identificationNumber: true,
        phone: true,
        status: true,
        licenseNumber: true,
        dateOfBirth: true,
        age: true,
        emergencyContact: true,
        bloodType: true,
        allergies: true,
        chronicDiseases: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!nurse) {
      return res.status(404).json({ message: 'Enfermera no encontrada.' });
    }

    return res.status(200).json({ nurse });
  } catch (error: any) {
    console.error('Error obteniendo enfermera:', error);
    return res.status(500).json({ message: 'Error al obtener la enfermera.' });
  }
};

// PUT /api/nurses/:id - Actualizar enfermera
export const updateNurse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const nurseId = parseInt(id, 10);

    if (isNaN(nurseId)) {
      return res.status(400).json({ message: 'ID de enfermera inválido.' });
    }

    const { 
      fullname, 
      phone, 
      licenseNumber, 
      dateOfBirth, 
      age,
      emergencyContact,
      bloodType,
      allergies,
      chronicDiseases,
      departmentId
    } = req.body;

    // Validar que al menos un campo sea proporcionado
    const updateFields = [
      fullname, phone, licenseNumber, dateOfBirth, age, 
      emergencyContact, bloodType, allergies, chronicDiseases, departmentId
    ];
    
    if (updateFields.every(field => field === undefined)) {
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

    if (phone !== undefined) {
      dataToUpdate.phone = phone ? sanitizeString(phone) : null;
    }

    if (licenseNumber !== undefined) {
      dataToUpdate.licenseNumber = licenseNumber ? sanitizeString(licenseNumber) : null;
    }

    if (dateOfBirth !== undefined) {
      dataToUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    if (age !== undefined) {
      dataToUpdate.age = age ? parseInt(age) : null;
    }

    if (emergencyContact !== undefined) {
      dataToUpdate.emergencyContact = emergencyContact ? sanitizeString(emergencyContact) : null;
    }

    if (bloodType !== undefined) {
      dataToUpdate.bloodType = bloodType ? sanitizeString(bloodType) : null;
    }

    if (allergies !== undefined) {
      dataToUpdate.allergies = allergies ? sanitizeString(allergies) : null;
    }

    if (chronicDiseases !== undefined) {
      dataToUpdate.chronicDiseases = chronicDiseases ? sanitizeString(chronicDiseases) : null;
    }

    if (departmentId !== undefined) {
      if (departmentId && !isNaN(departmentId)) {
        // Verificar que el departamento existe
        const department = await prisma.department.findUnique({
          where: { id: departmentId }
        });
        
        if (!department) {
          return res.status(400).json({ message: 'Departamento no encontrado.' });
        }
        dataToUpdate.departmentId = departmentId;
      } else {
        dataToUpdate.departmentId = null;
      }
    }

    const updatedNurse = await prisma.user.update({
      where: { id: nurseId, role: Role.ENFERMERA },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullname: true,
        phone: true,
        licenseNumber: true,
        status: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    await logAuditEvent('NURSE_UPDATED', { nurseId }, (req as any).user?.userId);

    return res.status(200).json({ 
      message: 'Enfermera actualizada exitosamente.', 
      nurse: updatedNurse 
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Enfermera no encontrada.' });
    }
    console.error('Error actualizando enfermera:', error);
    return res.status(500).json({ message: 'Error al actualizar la enfermera.' });
  }
};

// PATCH /api/nurses/state/:id - Actualizar estado (ACTIVO/INACTIVO)
export const updateNurseState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const nurseId = parseInt(id, 10);
    const { status } = req.body;

    if (isNaN(nurseId)) {
      return res.status(400).json({ message: 'ID de enfermera inválido.' });
    }

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'El estado debe ser "ACTIVE" o "INACTIVE".' });
    }

    const updatedNurse = await prisma.user.update({
      where: { id: nurseId, role: Role.ENFERMERA },
      data: { status },
      select: { 
        id: true, 
        email: true, 
        fullname: true,
        status: true, 
        updatedAt: true 
      }
    });

    await logAuditEvent('NURSE_STATE_UPDATED', { 
      nurseId, 
      newStatus: status 
    }, (req as any).user?.userId);

    return res.status(200).json({ 
      message: 'Estado de la enfermera actualizado.', 
      nurse: updatedNurse 
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Enfermera no encontrada.' });
    }
    console.error('Error actualizando estado:', error);
    return res.status(500).json({ message: 'Error al actualizar el estado de la enfermera.' });
  }
};