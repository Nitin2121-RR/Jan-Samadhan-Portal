import { Router } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  getDepartmentAuthorities,
  getDepartmentByCategory,
} from '../controllers/department.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route - list all departments (for signup dropdown)
router.get('/', getAllDepartments);

// Get department by ID with authorities
router.get('/:id', authenticate, getDepartmentById);

// Get authorities in a department (for reassignment)
router.get('/:id/authorities', authenticate, getDepartmentAuthorities);

// Get department by category (internal use for assignment)
router.get('/category/:category', authenticate, getDepartmentByCategory);

export default router;
