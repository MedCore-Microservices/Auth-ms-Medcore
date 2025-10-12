"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60 MB
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Solo se permiten archivos CSV o XLSX'));
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // guarda en memoria (no en disco)
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
});
//# sourceMappingURL=upload.middleware.js.map