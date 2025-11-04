// src/app.ts
import express from 'express';
import authRoutes from './routes/auth.routes';
import dotenv from 'dotenv'; 
import patientRoutes from './routes/patient.routes';
import departmentRoutes from './routes/department.routes';
import nurseRoutes from './routes/nurse.routes';
import specializationRoutes from './routes/specialization.routes';
import doctorRoutes from './routes/doctor.routes';
import userRoutes from './routes/user.routes';
import appointmentRoutes from './routes/appointment.routes';
import scheduleRoutes from './routes/schedule.routes';

dotenv.config();
const app = express();
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

app.use(express.json());
// Soportar application/x-www-form-urlencoded (formularios clásicos)
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/nurses', nurseRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/schedule', scheduleRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Servicio de Autenticación de MedCore está funcionando!');
});

// ✅ ELIMINAR EL IF PROBLEMÁTICO - INICIAR SERVIDOR DIRECTAMENTE
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

export default app;