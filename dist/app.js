"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dotenv_1 = __importDefault(require("dotenv"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: "http://localhost:3001", // ← frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json()); // Para parsear el body de las peticiones JSON
// Rutas
app.use('/api/auth', auth_routes_1.default);
app.use('/api/patients', patient_routes_1.default);
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡Servicio de Autenticación de MedCore está funcionando!');
});
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    });
}
/*app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});*/
exports.default = app;
//# sourceMappingURL=app.js.map