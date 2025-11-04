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
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
const testFilePath = path.resolve(__dirname, './fixtures/users-test.xlsx');
describe('Search Functionality Testing - Usuarios creados por carga masiva', () => {
    beforeAll(async () => {
        await prisma.user.deleteMany({});
        // Subir archivo antes de buscar
        const fileBuffer = fs.readFileSync(testFilePath);
        await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/bulk-upload')
            .attach('file', testFilePath);
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it('Debe permitir buscar un usuario por email', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
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
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/users')
            .query({ identificationNumber: '1234567890' })
            .set('Authorization', 'Bearer TU_TOKEN_ADMIN');
        expect(res.statusCode).toBe(200);
        expect(res.body[0].identificationNumber).toBe('1234567890');
    });
});
//# sourceMappingURL=bulk-upload.search.test.js.map