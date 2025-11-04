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
// Ruta del archivo de prueba
const testFilePath = path.resolve(__dirname, './fixtures/users-test.xlsx');
describe('Data Integrity Testing - Carga Masiva de Usuarios', () => {
    beforeAll(async () => {
        // Limpiar base de datos antes de las pruebas
        await prisma.user.deleteMany({});
        await prisma.department.deleteMany({});
        await prisma.specialization.deleteMany({});
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it('Debe crear usuarios con datos correctos y relaciones', async () => {
        const fileBuffer = fs.readFileSync(testFilePath);
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/bulk-upload')
            .attach('file', testFilePath)
            .expect(200);
        expect(res.body.success).toBe(2);
        expect(res.body.errors).toBe(0);
        // Verificar que el usuario médico se creó correctamente
        const medico = await prisma.user.findUnique({
            where: { email: 'medico@test.com' },
            include: { department: true, specialization: true }
        });
        expect(medico).not.toBeNull();
        expect(medico?.role).toBe('MEDICO');
        expect(medico?.department?.name).toBe('CARDIOLOGÍA');
        expect(medico?.specialization?.name).toBe('CARDIOLOGÍA INTERVENCIONISTA');
        expect(medico?.identificationNumber).toBe('1234567890');
        expect(medico?.status).toBe('PENDING'); // o 'PENDING' según tu lógica
        // Verificar que la contraseña está hasheada
        const isPasswordPlain = medico?.currentPassword === 'Password123!';
        expect(isPasswordPlain).toBe(false);
        const isMatch = await require('bcrypt').compare('Password123!', medico?.currentPassword || '');
        expect(isMatch).toBe(true);
        // Verificar enfermera sin especialización
        const enfermera = await prisma.user.findUnique({
            where: { email: 'enfermera@test.com' },
            include: { department: true, specialization: true }
        });
        expect(enfermera?.role).toBe('ENFERMERA');
        expect(enfermera?.specialization).toBeNull();
        expect(enfermera?.department?.name).toBe('ENFERMERÍA');
    });
});
//# sourceMappingURL=bulk-upload.integrity.test.js.map