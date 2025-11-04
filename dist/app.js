"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dotenv_1 = __importDefault(require("dotenv"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const nurse_routes_1 = __importDefault(require("./routes/nurse.routes"));
const specialization_routes_1 = __importDefault(require("./routes/specialization.routes"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 3001;
// ✅ CORS MANUAL - ELIMINA CUALQUIER CONFIGURACIÓN DUPLICADA
app.use((req, res, next) => {
    console.log('🔄 CORS ejecutándose para:', req.method, req.url);
    // FORZAR los headers CORS correctos
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    // Manejar preflight OPTIONS
    if (req.method === 'OPTIONS') {
        console.log('✅ Respondiendo preflight OPTIONS');
        return res.status(200).end();
    }
    next();
});
app.use(express_1.default.json());
// Soportar application/x-www-form-urlencoded (formularios clásicos)
app.use(express_1.default.urlencoded({ extended: true }));
// Rutas
app.use('/api/auth', auth_routes_1.default);
app.use('/api/patients', patient_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/nurses', nurse_routes_1.default);
app.use('/api/specializations', specialization_routes_1.default);
app.use('/api/doctors', doctor_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/schedule', schedule_routes_1.default);
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Servicio de Autenticación de MedCore está funcionando!');
});
// ✅ ELIMINAR EL IF PROBLEMÁTICO - INICIAR SERVIDOR DIRECTAMENTE
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map