
import request from 'supertest';
import app from '../app';
import * as path from 'path';

const invalidCsvPath = path.resolve(__dirname, './fixtures/invalid-headers.csv');
const wrongFormatPath = path.resolve(__dirname, './fixtures/image.jpg');

describe('Document Upload/Retrieval Testing', () => {
  it('Debe rechazar archivo sin encabezados correctos', async () => {
    const res = await request(app)
      .post('/api/auth/bulk-upload')
      .attach('file', invalidCsvPath);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Encabezados inválidos');
  });

  it('Debe rechazar archivo con formato no soportado', async () => {
    const res = await request(app)
      .post('/api/auth/bulk-upload')
      .attach('file', wrongFormatPath);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Formato de archivo no soportado');
  });

  it('Debe rechazar archivo sin filas de datos', async () => {
    const emptyXlsx = path.resolve(__dirname, './fixtures/empty.xlsx');
    const res = await request(app)
      .post('/api/auth/bulk-upload')
      .attach('file', emptyXlsx);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('El archivo está vacío');
  });

  it('Debe rechazar si falta el archivo', async () => {
    const res = await request(app)
      .post('/api/auth/bulk-upload')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Se requiere un archivo');
  });
});