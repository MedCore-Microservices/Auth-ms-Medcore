// src/app.ts
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import dotenv from 'dotenv'; 
import patientRoutes from './routes/patient.routes';
import departmentRoutes from './routes/department.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: "http://localhost:3001", // ← frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'] 

}));
app.use(express.json()); // Para parsear el body de las peticiones JSON

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/departments', departmentRoutes);

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

export default app;