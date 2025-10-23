import { PrismaClient,Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

import { generateVerificationCode } from '../utils/generateCode'; 

import { sendVerificationEmail } from '../config/emailConfig';
const prisma = new PrismaClient();

console.log("🛠️ Prisma Client Path:", require.resolve("@prisma/client"));

export const registerUser = async (
  email: string,
  password: string,
  fullname: string
) => {
  console.log("📥 Validando usuario existente con email:", email);
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error("⚠️ Usuario ya registrado:", existingUser);
    throw new Error('El correo electrónico ya está registrado.');
  }

  console.log("🔒 Hasheando contraseña para el usuario:", email);
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log("📧 Generando código de verificación para:", email);
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

  console.log("🗂️ Creando usuario en la base de datos:", { email, fullname });
  const newUser = await prisma.user.create({
    data: {
      email: email,
      currentPassword: hashedPassword,
      fullname: fullname,
      role: Role.PACIENTE,
      status: 'PENDING',
      verificationCode: code,
      verificationExpires: expiresAt,
    }
  });

  console.log("📤 Usuario creado exitosamente:", newUser);

  try {
    console.log("📨 Enviando correo de verificación a:", email);
    await sendVerificationEmail(email, fullname, code);
  } catch (error) {
    console.error("⚠️ Error al enviar el correo de verificación:", error);
  }

  return newUser;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

    if (user.status !== 'ACTIVE') {
    throw new Error('Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.currentPassword);

  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas');
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
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
  const decoded: any = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    throw new Error('Token inválido');
  }

  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.tokenBlacklist.create({
    data: {
      token,
      expiresAt
    }
  });

  return { message: 'Sesión cerrada exitosamente' };
};

export const verifyEmailCode = async (email: string, code: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user.status === 'ACTIVE') {
    throw new Error('La cuenta ya está verificada');
  }

  if (!user.verificationCode || !user.verificationExpires) {
    throw new Error('Código de verificación no disponible');
  }

  // Verificar si el código expiró
  if (new Date() > user.verificationExpires) {
    throw new Error('El código de verificación ha expirado');
  }

  // Verificar si el código coincide
  if (user.verificationCode !== code) {
    throw new Error('Código de verificación incorrecto');
  }

  // Actualizar usuario a ACTIVO y limpiar código
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      status: 'ACTIVE',
      verificationCode: null,
      verificationExpires: null,
      updatedAt: new Date()
    }
  });

  return {
    message: 'Email verificado exitosamente. Tu cuenta ahora está activa.',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      status: updatedUser.status
    }
  };
};

/**
 * Reenviar código de verificación
 */
export const resendVerificationCode = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user.status === 'ACTIVE') {
    throw new Error('La cuenta ya está verificada');
  }


  const newCode = generateVerificationCode();
  const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

  await prisma.user.update({
    where: { email },
    data: {
      verificationCode: newCode,
      verificationExpires: newExpiresAt,
      updatedAt: new Date()
    }
  });

  
  try {
    await sendVerificationEmail(email, user.fullname, newCode);
  } catch (error) {
    console.error('Error al reenviar email de verificación:', error);
    throw new Error('No se pudo enviar el email de verificación');
  }

  return {
    message: 'Nuevo código de verificación enviado a tu email',
    expiresAt: newExpiresAt
  };
};