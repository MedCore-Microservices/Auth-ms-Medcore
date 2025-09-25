import { PrismaClient,Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Añadimos `fullname` como parámetro (es obligatorio)
export const registerUser = async (
  email: string,
  password: string,
  fullname: string, //  obligatorio
  role:Role= 'PATIENT' // valor por defecto opcional en la función
) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error('El correo electrónico ya está registrado.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      currentPassword: hashedPassword, 
      fullname,                        //  obligatorio
      role                            // Prisma acepta el string si coincide con el enum
    }
  });

  return newUser;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error('Credenciales inválidas');
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