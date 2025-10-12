"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUploadUsers = void 0;
const path_1 = __importDefault(require("path"));
const XLSX = __importStar(require("xlsx"));
const bulk_upload_service_1 = require("../services/bulk-upload.service");
const audit_service_1 = require("../services/audit.service");
const parseFileToUsers = (buffer, originalname) => {
    const extension = path_1.default.extname(originalname).toLowerCase();
    let workbook;
    if (extension === '.csv') {
        const csv = buffer.toString('utf8');
        workbook = XLSX.read(csv, { type: 'string', cellDates: true });
    }
    else if (extension === '.xlsx' || extension === '.xls') {
        workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    }
    else {
        throw new Error('Formato de archivo no soportado');
    }
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (data.length < 2) {
        throw new Error('El archivo está vacío o no tiene datos');
    }
    const headers = data[0].map((h) => h.trim());
    const expectedHeaders = [
        'email', 'fullname', 'role', 'current_password',
        'status', 'specialization', 'department',
        'license_number', 'phone', 'date_of_birth',
        'identificationnumber'
    ];
    // Validar que los encabezados coincidan (ignorando mayúsculas/minúsculas y espacios)
    const normalizedHeaders = headers.map((h) => h.toLowerCase().replace(/\s+/g, '_'));
    const normalizedExpected = expectedHeaders.map(h => h.toLowerCase());
    if (!normalizedExpected.every(h => normalizedHeaders.includes(h))) {
        throw new Error(`Encabezados inválidos. Se esperan: ${expectedHeaders.join(', ')}`);
    }
    // Mapear filas a objetos
    const users = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0 || (row.length === 1 && !row[0]))
            continue; // saltar filas vacías
        const user = {};
        headers.forEach((header, idx) => {
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
const bulkUploadUsers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Se requiere un archivo' });
        }
        const users = parseFileToUsers(req.file.buffer, req.file.originalname);
        console.log(`Procesando cargue masivo de ${users.length} usuarios desde archivo`);
        const result = await (0, bulk_upload_service_1.bulkCreateUsers)(users);
        await (0, audit_service_1.logAuditEvent)('BULK_UPLOAD_USERS', {
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
    }
    catch (error) {
        console.error('Error en cargue masivo:', error);
        return res.status(400).json({
            message: 'Error al procesar el archivo',
            error: error.message
        });
    }
};
exports.bulkUploadUsers = bulkUploadUsers;
//# sourceMappingURL=bulk-upload.controller.js.map