
import request from 'supertest';
import app from '../app';

describe('Rutas públicas del microservicio de autenticación', () => {

  it('GET / debe responder con un mensaje de bienvenida', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('¡Servicio de Autenticación de MedCore está funcionando!');
  });

  it('GET /api/auth debe devolver 404 (no existe endpoint GET)', async () => {
    const res = await request(app).get('/api/auth');
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/patients debe devolver 401 (requiere autenticación)', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/login debe responder con 400 si faltan credenciales', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('El email y la contraseña son obligatorios.');
  });

  // ✅ CORREGIDO: ahora falla en validación, no en DB
  it('POST /api/auth/login debe responder con 400 si falta la contraseña', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usuario@test.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('El email y la contraseña son obligatorios.');
  });

  it('POST /api/auth/seguridad/registro-publico-usuarios debe responder con 400 si faltan datos', async () => {
    const res = await request(app)
      .post('/api/auth/seguridad/registro-publico-usuarios')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email, contraseña y nombre completo son obligatorios.');
  });

  it('POST /api/auth/verify-email debe responder con 400 si faltan email o código', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email y código de verificación son obligatorios.');
  });

  it('POST /api/auth/resend-verification debe responder con 400 si falta email', async () => {
    const res = await request(app).post('/api/auth/resend-verification').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Email es obligatorio.');
  });

});