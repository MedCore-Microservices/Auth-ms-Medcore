import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface BulkUser {
  email: string;
  fullname: string;
  role: string;
  current_password: string;
  identificationnumber: string;
  status: string;
  specialization?: string;
  department?: string;
  license_number?: string;
  phone?: string;
  date_of_birth?: string;
}

export const bulkCreateUsers = async (users: BulkUser[]) => {
  const results = {
    success: 0,
    errors: 0,
    details: [] as any[]
  };

  // Mapeo de roles del Excel al enum actualizado
  const roleMap: { [key: string]: Role } = {
    'MEDICO': Role.MEDICO,
    'ENFERMERA': Role.ENFERMERA,
    'ADMINISTRADOR': Role.ADMINISTRADOR,
    'PACIENTE': Role.PACIENTE
  };

  for (const userData of users) {
    try {
      console.log('Procesando usuario:', userData.email);

      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        results.details.push({
          email: userData.email,
          status: 'SKIPPED',
          message: 'Usuario ya existe'
        });
        continue;
      }

      const existingUserByIdentification = await prisma.user.findUnique({
        where: { identificationNumber: userData.identificationnumber }
      });

      if (existingUserByIdentification) {
        results.details.push({
          email: userData.email,
          status: 'SKIPPED',
          message: `El número de identificación ${userData.identificationnumber} ya está registrado`
        });
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.current_password, 10);

      // Normalizar rol
      const userRole = roleMap[userData.role?.toUpperCase()] || Role.PACIENTE;

      // 1. Manejar Department (solo si aplica)
      let departmentId: number | null = null;
      if (userData.department) {
        const dept = await prisma.department.upsert({
          where: { name: userData.department.toUpperCase() },
          update: {},
          create: { name: userData.department.toUpperCase() }
        });
        departmentId = dept.id;
      }

      // 2. Manejar Specialization (solo para médicos)
      let specializationId: number | null = null;
      if (userData.specialization && userRole === Role.MEDICO) {
        const spec = await prisma.specialization.upsert({
          where: { name: userData.specialization.toUpperCase() },
          update: {},
          create: { name: userData.specialization.toUpperCase() }
        });
        specializationId = spec.id;
      }

      console.log('Procesando usuario:', userData.email);
      console.log('Número de identificación:', userData.identificationnumber);

      const uniquePatientId = `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      // 3. Crear usuario con relaciones
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          fullname: userData.fullname,
          currentPassword: hashedPassword,
          role: userRole,
          status: userData.status || 'PENDING',
          phone: userData.phone || null,
          dateOfBirth: userData.date_of_birth ? new Date(userData.date_of_birth) : null,
          licenseNumber: userData.license_number || null,
          identificationNumber: userData.identificationnumber || null,
          departmentId,
          specializationId
        }
      });

      results.success++;
      results.details.push({
        email: userData.email,
        status: 'CREATED',
        message: 'Usuario creado exitosamente'
      });

    } catch (error: any) {
      console.error('Error creando usuario:', userData.email, error);
      results.errors++;
      results.details.push({
        email: userData.email,
        status: 'ERROR',
        message: error.message || 'Error desconocido'
      });
    }
  }

  return results;
};