import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorization.middleware';
import { Role } from '@prisma/client';
import {
  getDepartments,
  getDepartmentSpecializations,
  getAllDepartmentsWithSpecializations
} from '../controllers/department.controller';

const router = Router();

// Solo personal autorizado puede acceder a estos endpoints
const canAccessDepartments = authorizeRoles(
  Role.ADMINISTRADOR, 
  Role.MEDICO, 
  Role.ENFERMERA
);

// GET /api/departments → listar todos los departamentos
router.get('/', authenticateToken, canAccessDepartments, getDepartments);

// GET /api/departments/specializations/all → todos los departamentos con especialidades
router.get('/specializations/all', authenticateToken, canAccessDepartments, getAllDepartmentsWithSpecializations);

// GET /api/departments/:departmentId/specializations → especialidades por departamento
router.get('/:departmentId/specializations', authenticateToken, canAccessDepartments, getDepartmentSpecializations);

export default router;