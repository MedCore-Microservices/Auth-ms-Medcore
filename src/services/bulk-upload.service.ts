import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { calculateAge } from '../utils/validation';

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

  const roleMap: { [key: string]: Role } = {
    'MEDICO': Role.MEDICO,
    'ENFERMERA': Role.ENFERMERA,
    'ADMINISTRADOR': Role.ADMINISTRADOR,
    'PACIENTE': Role.PACIENTE
  };

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    try {
      console.log(`Procesando fila ${i + 1}:`, userData.email);

      // Validar duplicados por email
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        results.details.push({
          row: i + 1,
          email: userData.email,
          status: 'ERROR',
          message: `El correo '${userData.email}' ya existe.`
        });
        results.errors++;
        continue;
      }

      // Validar duplicados por identificación
      const existingUserByIdentification = await prisma.user.findUnique({
        where: { identificationNumber: userData.identificationnumber }
      });

      if (existingUserByIdentification) {
        results.details.push({
          row: i + 1,
          email: userData.email,
          status: 'ERROR',
          message: `El número de identificación '${userData.identificationnumber}' ya está registrado.`
        });
        results.errors++;
        continue;
      }

      // Validar fecha de nacimiento
      let dateOfBirth: Date | null = null;
      if (userData.date_of_birth) {
        const parsedDate = new Date(userData.date_of_birth);
        if (isNaN(parsedDate.getTime())) {
          results.details.push({
            row: i + 1,
            email: userData.email,
            status: 'ERROR',
            message: `La fecha de nacimiento '${userData.date_of_birth}' no es válida.`
          });
          results.errors++;
          continue;
        }
        dateOfBirth = parsedDate;
      }

      // Calcular edad
      const age = dateOfBirth ? calculateAge(dateOfBirth) : null;

      // Manejar Department
      let departmentId: number | null = null;
      if (userData.department) {
        const dept = await prisma.department.upsert({
          where: { name: userData.department.toUpperCase() },
          update: {},
          create: { name: userData.department.toUpperCase() }
        });
        departmentId = dept.id;
      }

      // Manejar Specialization
      let specializationId: number | null = null;
      if (userData.specialization && roleMap[userData.role?.toUpperCase()] === Role.MEDICO) {
        const spec = await prisma.specialization.upsert({
          where: { name: userData.specialization.toUpperCase() },
          update: {},
          create: { name: userData.specialization.toUpperCase() }
        });
        specializationId = spec.id;
      }

      // Crear usuario
      const hashedPassword = await bcrypt.hash(userData.current_password, 10);
      await prisma.user.create({
        data: {
          email: userData.email,
          fullname: userData.fullname,
          currentPassword: hashedPassword,
          role: roleMap[userData.role?.toUpperCase()] || Role.PACIENTE,
          status: userData.status || 'PENDING',
          phone: userData.phone || null,
          dateOfBirth,
          age,
          licenseNumber: userData.license_number || null,
          identificationNumber: userData.identificationnumber || null,
          departmentId,
          specializationId
        }
      });

      results.success++;
      results.details.push({
        row: i + 1,
        email: userData.email,
        status: 'SUCCESS',
        message: 'Usuario creado exitosamente.'
      });

    } catch (error: any) {
      console.error(`Error en la fila ${i + 1}:`, error.message);
      results.errors++;
      results.details.push({
        row: i + 1,
        email: userData.email,
        status: 'ERROR',
        message: error.message || 'Error desconocido.'
      });
    }
  }

  return results;
};