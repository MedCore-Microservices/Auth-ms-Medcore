import { Request, Response } from 'express';
import { bulkCreateUsers } from '../services/bulk-upload.service';
import { logAuditEvent } from '../services/audit.service';

export const bulkUploadUsers = async (req: Request, res: Response) => {
  try {
    const { users } = req.body;

    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        message: 'Se requiere un array de usuarios en el cuerpo de la solicitud'
      });
    }

    console.log(`Procesando cargue masivo de ${users.length} usuarios`);

    const result = await bulkCreateUsers(users);

    // Log de auditoría
    await logAuditEvent('BULK_UPLOAD_USERS', {
      total: users.length,
      success: result.success,
      errors: result.errors,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(200).json({
      message: `Cargue masivo completado: ${result.success} exitosos, ${result.errors} errores`,
      ...result
    });

  } catch (error: any) {
    console.error('Error en cargue masivo:', error);
    return res.status(500).json({
      message: 'Error interno del servidor en cargue masivo',
      error: error.message
    });
  }
};