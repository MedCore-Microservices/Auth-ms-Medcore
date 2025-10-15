
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const testFilePath = path.resolve(__dirname, './fixtures/users-test.xlsx');

describe('Search Functionality Testing - Usuarios creados por carga masiva', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({});
    // Subir archivo antes de buscar
    const fileBuffer = fs.readFileSync(testFilePath);
    await request(app)
      .post('/api/auth/bulk-upload')
      .attach('file', testFilePath);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Debe permitir buscar un usuario por email', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ email: 'medico@test.com' })
      .set('Authorization', 'Bearer TU_TOKEN_ADMIN'); // Ajusta según tu auth

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].email).toBe('medico@test.com');
    expect(res.body[0].fullname).toBe('Dr. Juan Pérez');
  });

  it('Debe permitir buscar por número de identificación', async () => {
    const res = await request(app)
      .get('/api/users')
      .query({ identificationNumber: '1234567890' })
      .set('Authorization', 'Bearer TU_TOKEN_ADMIN');

    expect(res.statusCode).toBe(200);
    expect(res.body[0].identificationNumber).toBe('1234567890');
  });
});