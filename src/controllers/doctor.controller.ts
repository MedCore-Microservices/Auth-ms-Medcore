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

// GET /api/doctors - Listar médicos (paginado)
export const getDoctors = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined;
    const specializationId = req.query.specializationId ? parseInt(req.query.specializationId as string) : undefined;

    const skip = (page - 1) * limit;

    const where: any = { role: Role.MEDICO };
    
    if (status && ['ACTIVE', 'INACTIVE', 'PENDING'].includes(status)) {
      where.status = status;
    }
    
    if (departmentId && !isNaN(departmentId)) {
      where.departmentId = departmentId;
    }

    if (specializationId && !isNaN(specializationId)) {
      where.specializationId = specializationId;
    }

    const [doctors, total] = await Promise.all([
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
          },
          specialization: {
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
      doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error listando médicos:', error);
    return res.status(500).json({ message: 'Error al obtener la lista de médicos.' });
  }
};

// GET /api/doctors/:id - Obtener médico por ID
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = parseInt(id, 10);

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: 'ID de médico inválido.' });
    }

    const doctor = await prisma.user.findUnique({
      where: { id: doctorId, role: Role.MEDICO },
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
        },
        specialization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Médico no encontrado.' });
    }

    return res.status(200).json({ doctor });
  } catch (error: any) {
    console.error('Error obteniendo médico:', error);
    return res.status(500).json({ message: 'Error al obtener el médico.' });
  }
};

// PUT /api/doctors/:id - Actualizar médico
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = parseInt(id, 10);

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: 'ID de médico inválido.' });
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
      departmentId,
      specializationId
    } = req.body;

    // Validar que al menos un campo sea proporcionado
    const updateFields = [
      fullname, phone, licenseNumber, dateOfBirth, age, 
      emergencyContact, bloodType, allergies, chronicDiseases, 
      departmentId, specializationId
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
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({ message: 'Fecha de nacimiento inválida.' });
      }
      const calculatedAge = calculateAge(birthDate);
      if (!isValidAge(calculatedAge)) {
        return res.status(400).json({ message: 'Edad fuera del rango permitido (0-100).' });
      }
      dataToUpdate.dateOfBirth = birthDate;
      dataToUpdate.age = calculatedAge;
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

    if (specializationId !== undefined) {
      if (specializationId && !isNaN(specializationId)) {
        // Verificar que la especialización existe
        const specialization = await prisma.specialization.findUnique({
          where: { id: specializationId }
        });
        
        if (!specialization) {
          return res.status(400).json({ message: 'Especialización no encontrada.' });
        }
        dataToUpdate.specializationId = specializationId;
      } else {
        dataToUpdate.specializationId = null;
      }
    }

    const updatedDoctor = await prisma.user.update({
      where: { id: doctorId, role: Role.MEDICO },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullname: true,
        phone: true,
        licenseNumber: true,
        status: true,
        dateOfBirth: true,
        age: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true
          }
        },
        specialization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    await logAuditEvent('DOCTOR_UPDATED', { doctorId }, (req as any).user?.userId);

    return res.status(200).json({ 
      message: 'Médico actualizado exitosamente.', 
      doctor: updatedDoctor 
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Médico no encontrado.' });
    }
    console.error('Error actualizando médico:', error);
    return res.status(500).json({ message: 'Error al actualizar el médico.' });
  }
};

// PATCH /api/doctors/state/:id - Actualizar estado (ACTIVO/INACTIVO)
export const updateDoctorState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorId = parseInt(id, 10);
    const { status } = req.body;

    if (isNaN(doctorId)) {
      return res.status(400).json({ message: 'ID de médico inválido.' });
    }

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'El estado debe ser "ACTIVE" o "INACTIVE".' });
    }

    const updatedDoctor = await prisma.user.update({
      where: { id: doctorId, role: Role.MEDICO },
      data: { status },
      select: { 
        id: true, 
        email: true, 
        fullname: true,
        status: true, 
        updatedAt: true 
      }
    });

    await logAuditEvent('DOCTOR_STATE_UPDATED', { 
      doctorId, 
      newStatus: status 
    }, (req as any).user?.userId);

    return res.status(200).json({ 
      message: 'Estado del médico actualizado.', 
      doctor: updatedDoctor 
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Médico no encontrado.' });
    }
    console.error('Error actualizando estado:', error);
    return res.status(500).json({ message: 'Error al actualizar el estado del médico.' });
  }
};

// GET /api/doctors/specializations - Obtener todas las especializaciones
export const getSpecializations = async (req: Request, res: Response) => {
  try {
    const specializations = await prisma.specialization.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({ specializations });
  } catch (error: any) {
    console.error('Error obteniendo especializaciones:', error);
    return res.status(500).json({ message: 'Error al obtener las especializaciones.' });
  }
};

// GET /api/doctors/departments - Obtener todos los departamentos
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({ departments });
  } catch (error: any) {
    console.error('Error obteniendo departamentos:', error);
    return res.status(500).json({ message: 'Error al obtener los departamentos.' });
  }
};

// POST /api/users/doctors - Registrar doctor
export const createDoctor = async (req: Request, res: Response) => {
  try {
    const {
      email,
      currentPassword,
      fullname,
      identificationNumber,
      phone,
      licenseNumber,
      dateOfBirth,
      departmentId,
      specializationId
    } = req.body;

    // Validaciones básicas
    if (!email || !currentPassword || !fullname || !identificationNumber || !dateOfBirth || !departmentId || !specializationId) {
      return res.status(400).json({ message: 'Todos los campos obligatorios deben estar presentes.' });
    }

    // Validar email único
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'El correo ya está registrado.' });
    }

    // Validar identificación única
    const existingIdNumber = await prisma.user.findUnique({ where: { identificationNumber } });
    if (existingIdNumber) {
      return res.status(409).json({ message: 'El número de identificación ya está registrado.' });
    }

    // Validar nombre
    const cleanName = sanitizeString(fullname);
    if (!isValidName(cleanName)) {
      return res.status(400).json({ message: 'Nombre inválido.' });
    }

    // Validar fecha de nacimiento y calcular edad
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({ message: 'Fecha de nacimiento inválida.' });
    }
    const age = calculateAge(birthDate);
    if (!isValidAge(age)) {
      return res.status(400).json({ message: 'Edad fuera del rango permitido (0-100).' });
    }

    // Validar departamento
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return res.status(400).json({ message: 'Departamento no encontrado.' });
    }

    // Validar especialización
    const specialization = await prisma.specialization.findUnique({ where: { id: specializationId } });
    if (!specialization) {
      return res.status(400).json({ message: 'Especialización no encontrada.' });
    }

    // Crear doctor
    const doctor = await prisma.user.create({
      data: {
        email,
        currentPassword, // ⚠️ En producción: hashear con bcrypt
        fullname: cleanName,
        identificationNumber,
        phone: phone ? sanitizeString(phone) : null,
        licenseNumber: licenseNumber ? sanitizeString(licenseNumber) : null,
        dateOfBirth: birthDate,
        age,
        role: Role.MEDICO,
        status: 'PENDING', // o 'ACTIVE' según política
        departmentId,
        specializationId
      },
      select: {
        id: true,
        email: true,
        fullname: true,
        identificationNumber: true,
        phone: true,
        licenseNumber: true,
        status: true,
        dateOfBirth: true,
        age: true,
        department: { select: { id: true, name: true } },
        specialization: { select: { id: true, name: true } },
        createdAt: true
      }
    });

    await logAuditEvent('DOCTOR_CREATED', { doctorId: doctor.id }, (req as any).user?.userId);

    return res.status(201).json({ message: 'Médico registrado exitosamente.', doctor });
  } catch (error: any) {
    console.error('Error registrando médico:', error);
    return res.status(500).json({ message: 'Error al registrar el médico.' });
  }
};



// GET /api/users/by-role?role=doctor
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    if (role !== 'doctor') {
      return res.status(400).json({ message: 'Solo se permite el rol "doctor" en este endpoint.' });
    }

    const users = await prisma.user.findMany({
      where: { role: Role.MEDICO },
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
        department: { select: { id: true, name: true } },
        specialization: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ users });
  } catch (error: any) {
    console.error('Error al filtrar usuarios por rol:', error);
    return res.status(500).json({ message: 'Error al obtener usuarios por rol.' });
  }
};


// GET /api/users/by-specialty?specialty=cardiologia - Filtrar doctores por especialidad
export const getDoctorsBySpecialty = async (req: Request, res: Response) => {
  try {
    const { specialty } = req.query;

    if (!specialty || typeof specialty !== 'string') {
      return res.status(400).json({ message: 'El parámetro "specialty" es obligatorio y debe ser una cadena de texto.' });
    }

    const doctors = await prisma.user.findMany({
      where: {
        role: Role.MEDICO,
        specialization: {
          name: {
            contains: specialty,
            mode: 'insensitive'
          }
        }
      },
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
        },
        specialization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { fullname: 'asc' }
    });

    return res.status(200).json({ doctors });
  } catch (error: any) {
    console.error('Error al filtrar médicos por especialidad:', error);
    return res.status(500).json({ message: 'Error al obtener los médicos por especialidad.' });
  }
};

// GET /api/users - Filtros avanzados con query params (unificado)
export const getUsersWithFilters = async (req: Request, res: Response) => {
  try {
    // Parámetros de paginación
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Parámetros de filtro
    const { role, specialty, state, department, search } = req.query;

    // Construir el objeto WHERE para Prisma
    const where: any = {};

    // Filtro por rol
    if (role) {
      const roles = (role as string).split('|').map(r => r.trim().toUpperCase());
      const validRoles = roles.filter(r => Object.values(Role).includes(r as Role));
      
      if (validRoles.length > 0) {
        where.role = { in: validRoles };
      }
    }

    // Filtro por estado
    if (state) {
      const states = (state as string).split('|').map(s => s.trim().toUpperCase());
      const validStates = states.filter(s => ['ACTIVE', 'INACTIVE', 'PENDING'].includes(s));
      
      if (validStates.length > 0) {
        where.status = { in: validStates };
      }
    }

    // Filtro por departamento
    if (department) {
      const departments = (department as string).split('|').map(d => parseInt(d.trim()));
      const validDepartments = departments.filter(d => !isNaN(d));
      
      if (validDepartments.length > 0) {
        where.departmentId = { in: validDepartments };
      }
    }

    // Filtro por especialidad (solo aplica a médicos)
    if (specialty) {
      const specialties = (specialty as string).split('|').map(s => parseInt(s.trim()));
      const validSpecialties = specialties.filter(s => !isNaN(s));
      
      if (validSpecialties.length > 0) {
        where.specializationId = { in: validSpecialties };
        
        // Asegurar que solo se aplique a médicos
        if (!where.role) {
          where.role = Role.MEDICO;
        } else if (Array.isArray(where.role.in)) {
          if (!where.role.in.includes(Role.MEDICO)) {
            where.role.in.push(Role.MEDICO);
          }
        }
      }
    }

    // Búsqueda por texto (nombre, email, identificación)
    if (search) {
      const searchTerm = `%${search}%`;
      where.OR = [
        { fullname: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { identificationNumber: { contains: search as string, mode: 'insensitive' } },
        { licenseNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Consulta principal con los filtros
    const [users, total] = await Promise.all([
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
          role: true,
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
          },
          specialization: {
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
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    console.error('Error en filtros avanzados:', error);
    return res.status(500).json({ 
      message: 'Error al obtener usuarios con filtros.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GET /api/users/filters/metadata - Metadatos para los filtros
export const getFiltersMetadata = async (req: Request, res: Response) => {
  try {
    const [departments, specializations, roleCounts, statusCounts] = await Promise.all([
      prisma.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.specialization.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      }),
      prisma.user.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      })
    ]);

    return res.status(200).json({
      filters: {
        roles: Object.values(Role).map(role => ({
          value: role,
          label: role.toLowerCase(),
          count: roleCounts.find(r => r.role === role)?._count.id || 0
        })),
        statuses: ['ACTIVE', 'INACTIVE', 'PENDING'].map(status => ({
          value: status,
          label: status.toLowerCase(),
          count: statusCounts.find(s => s.status === status)?._count.id || 0
        })),
        departments: departments.map(dept => ({
          value: dept.id,
          label: dept.name
        })),
        specializations: specializations.map(spec => ({
          value: spec.id,
          label: spec.name
        }))
      }
    });
  } catch (error: any) {
    console.error('Error obteniendo metadatos de filtros:', error);
    return res.status(500).json({ 
      message: 'Error al obtener metadatos de filtros.' 
    });
  }
};