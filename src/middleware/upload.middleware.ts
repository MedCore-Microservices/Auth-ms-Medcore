
import multer from 'multer';
import path from 'path';

const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60 MB

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Solo se permiten archivos CSV o XLSX'));
  }
  cb(null, true);
};

export const upload = multer({
  storage: multer.memoryStorage(), // guarda en memoria (no en disco)
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});