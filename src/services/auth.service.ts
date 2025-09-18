// src/services/auth.service.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const registerUser = async (email: string, password: string, role: string) => {
  // Verificar si el email ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  // Encriptar la contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crear el nuevo usuario
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role
    }
  });

  return newUser;
};