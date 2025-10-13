
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Ruta del archivo de prueba
const testFilePath = path.resolve(__dirname, './fixtures/users-test.xlsx');

describe('Data Integrity Testing - Carga Masiva de Usuarios', () => {
  beforeAll(async () => {
    // Limpiar base de datos antes de las pruebas
    await prisma.user.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.specialization.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Debe crear usuarios con datos correctos y relaciones', async () => {
    const fileBuffer = fs.readFileSync(testFilePath);

    const res = await request(app)
      .post('/api/auth/bulk-upload')
      .attach('file', testFilePath)
      .expect(200);

    expect(res.body.success).toBe(2); 
    expect(res.body.errors).toBe(0);

    // Verificar que el usuario médico se creó correctamente
    const medico = await prisma.user.findUnique({
      where: { email: 'medico@test.com' },
      include: { department: true, specialization: true }
    });

    expect(medico).not.toBeNull();
    expect(medico?.role).toBe('MEDICO');
    expect(medico?.department?.name).toBe('CARDIOLOGÍA');
    expect(medico?.specialization?.name).toBe('CARDIOLOGÍA INTERVENCIONISTA');
    expect(medico?.identificationNumber).toBe('1234567890');
    expect(medico?.status).toBe('PENDING'); // o 'PENDING' según tu lógica

    // Verificar que la contraseña está hasheada
    const isPasswordPlain = medico?.currentPassword === 'Password123!';
    expect(isPasswordPlain).toBe(false);
    const isMatch = await require('bcrypt').compare('Password123!', medico?.currentPassword || '');
    expect(isMatch).toBe(true);

    // Verificar enfermera sin especialización
    const enfermera = await prisma.user.findUnique({
      where: { email: 'enfermera@test.com' },
      include: { department: true, specialization: true }
    });

    expect(enfermera?.role).toBe('ENFERMERA');
    expect(enfermera?.specialization).toBeNull();
    expect(enfermera?.department?.name).toBe('ENFERMERÍA');
  });
});