// src/services/auth.service.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
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

export const loginUser = async (email: string, password: string) => {
  // 1. Buscar al usuario por email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  // 2. Comparar la contraseña proporcionada con la encriptada en la DB
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas');
  }

  // 3. Generar tokens JWT
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' } // 15 minutos
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' } // 7 días
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
};

export const logoutUser = async (token: string) => {
  // Decodificar el token para obtener su expiración (sin verificar la firma aún)
  const decoded: any = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    throw new Error('Token inválido');
  }

  // Convertir exp (timestamp) a Date
  const expiresAt = new Date(decoded.exp * 1000);

  // Guardar el token en la blacklist
  await prisma.tokenBlacklist.create({
    data: {
      token, // Guardamos el token completo para simplicidad
      expiresAt
    }
  });

  return { message: 'Sesión cerrada exitosamente' };
};