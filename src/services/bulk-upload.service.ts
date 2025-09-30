import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface BulkUser {
  email: string;
  fullname: string;
  role: string;
  current_password: string;
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

  for (const userData of users) {
    try {
      console.log('Procesando usuario:', userData.email);

      // Verificar si el usuario ya existe
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

      // Hashear password
      const hashedPassword = await bcrypt.hash(userData.current_password, 10);

      // Mapear rol del CSV al enum de Prisma
      const roleMap: { [key: string]: Role } = {
        'MEDICO': Role.DOCTOR,
        'ENFERMERA': Role.NURSE,
        'ADMINISTRADOR': Role.ADMIN,
        'PACIENTE': Role.PATIENT
      };

      const userRole = roleMap[userData.role.toUpperCase()] || Role.PATIENT;

      // PRIMERO crear el usuario
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          fullname: userData.fullname,
          currentPassword: hashedPassword,
          role: userRole,
          status: userData.status || 'PENDING'
        }
      });

      // LUEGO crear el medicalProfile usando SQL directo (evita error TypeScript)
      if (userData.specialization || userData.department || userData.license_number || userData.phone || userData.date_of_birth) {
        await prisma.$executeRaw`
          INSERT INTO "MedicalProfile" 
          ("userId", "specialization", "department", "licenseNumber", "phone", "dateOfBirth", "createdAt", "updatedAt")
          VALUES (
            ${user.id}, 
            ${userData.specialization}, 
            ${userData.department}, 
            ${userData.license_number}, 
            ${userData.phone}, 
            ${userData.date_of_birth ? new Date(userData.date_of_birth) : null},
            NOW(), 
            NOW()
          )
        `;
      }

      results.success++;
      results.details.push({
        email: userData.email,
        status: 'CREATED',
        message: 'Usuario y perfil médico creados exitosamente'
      });

    } catch (error: any) {
      console.error('Error creando usuario:', userData.email, error);
      results.errors++;
      results.details.push({
        email: userData.email,
        status: 'ERROR',
        message: error.message
      });
    }
  }

  return results;
};