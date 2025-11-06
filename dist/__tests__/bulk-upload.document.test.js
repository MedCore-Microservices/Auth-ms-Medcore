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
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const path = __importStar(require("path"));
const invalidCsvPath = path.resolve(__dirname, './fixtures/invalid-headers.csv');
const wrongFormatPath = path.resolve(__dirname, './fixtures/image.jpg');
describe('Document Upload/Retrieval Testing', () => {
    it('Debe rechazar archivo sin encabezados correctos', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/bulk-upload')
            .attach('file', invalidCsvPath);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('Encabezados inválidos');
    });
    it('Debe rechazar archivo con formato no soportado', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/bulk-upload')
            .attach('file', wrongFormatPath);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('Formato de archivo no soportado');
    });
    it('Debe rechazar archivo sin filas de datos', async () => {
        const emptyXlsx = path.resolve(__dirname, './fixtures/empty.xlsx');
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/bulk-upload')
            .attach('file', emptyXlsx);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain('El archivo está vacío');
    });
    it('Debe rechazar si falta el archivo', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/bulk-upload')
            .send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Se requiere un archivo');
    });
});
//# sourceMappingURL=bulk-upload.document.test.js.map