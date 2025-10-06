import path from 'path';
import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { bulkCreateUsers } from '../services/bulk-upload.service';
import { logAuditEvent } from '../services/audit.service';

const parseFileToUsers = (buffer: Buffer, originalname: string): any[] => {
  const extension = path.extname(originalname).toLowerCase();
  let workbook;

  if (extension === '.csv') {
    const csv = buffer.toString('utf8');
    workbook = XLSX.read(csv, { type: 'string', cellDates: true });
  } else if (extension === '.xlsx' || extension === '.xls') {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } else {
    throw new Error('Formato de archivo no soportado');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length < 2) {
    throw new Error('El archivo está vacío o no tiene datos');
  }

  const headers = data[0].map((h: string) => h.trim());
  const expectedHeaders = [
    'email', 'fullname', 'role', 'current_password',
    'status', 'specialization', 'department',
    'license_number', 'phone', 'date_of_birth',
    'identificationnumber'
  ];

  // Validar que los encabezados coincidan (ignorando mayúsculas/minúsculas y espacios)
  const normalizedHeaders = headers.map((h: string) => h.toLowerCase().replace(/\s+/g, '_'));
  const normalizedExpected = expectedHeaders.map(h => h.toLowerCase());

  if (!normalizedExpected.every(h => normalizedHeaders.includes(h))) {
    throw new Error(`Encabezados inválidos. Se esperan: ${expectedHeaders.join(', ')}`);
  }

  // Mapear filas a objetos
  const users = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue; // saltar filas vacías

    const user: any = {};
    headers.forEach((header: string, idx: number) => {
      const key = header.toLowerCase().replace(/\s+/g, '_');
      if (normalizedExpected.includes(key)) {
        user[key] = row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : '';
      }
    });

    console.log('Datos del usuario procesados:', user);

    // Validar campos obligatorios
    if (!user.email || !user.fullname || !user.role || !user.current_password || user.identificationNumber) {
      throw new Error(`Fila ${i + 1}: faltan campos obligatorios (email, fullname, role, current_password)`);
    }

    users.push(user);
  }

  return users;
};

export const bulkUploadUsers = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Se requiere un archivo' });
    }

    const users = parseFileToUsers(req.file.buffer, req.file.originalname);

    console.log(`Procesando cargue masivo de ${users.length} usuarios desde archivo`);

    const result = await bulkCreateUsers(users);

    await logAuditEvent('BULK_UPLOAD_USERS', {
      total: users.length,
      success: result.success,
      errors: result.errors,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      filename: req.file.originalname
    });

    return res.status(200).json({
      message: `Cargue masivo completado: ${result.success} exitosos, ${result.errors} errores`,
      ...result
    });

  } catch (error: any) {
    console.error('Error en cargue masivo:', error);
    return res.status(400).json({
      message: 'Error al procesar el archivo',
      error: error.message
    });
  }
};