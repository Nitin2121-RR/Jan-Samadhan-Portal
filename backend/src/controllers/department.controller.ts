import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all departments
export const getAllDepartments = async (_req: AuthRequest, res: Response): Promise<void> => {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      description: true,
    },
  });

  res.json({ departments });
};

// Get department by ID with authorities
export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      authorities: {
        where: { role: 'authority' },
        select: {
          id: true,
          name: true,
          email: true,
          authorityLevel: true,
          position: true,
        },
        orderBy: { authorityLevel: 'asc' },
      },
      _count: {
        select: { grievances: true },
      },
    },
  });

  if (!department) {
    res.status(404).json({ error: 'Department not found' });
    return;
  }

  res.json({ department });
};

// Get authorities in a department (for reassignment dropdown)
export const getDepartmentAuthorities = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const authorities = await prisma.user.findMany({
    where: {
      departmentId: id,
      role: 'authority',
    },
    select: {
      id: true,
      name: true,
      email: true,
      authorityLevel: true,
      position: true,
    },
    orderBy: { authorityLevel: 'asc' },
  });

  res.json({ authorities });
};

// Get department by category (for AI assignment)
export const getDepartmentByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  const { category } = req.params;

  const department = await prisma.department.findFirst({
    where: { category },
    include: {
      authorities: {
        where: {
          role: 'authority',
          authorityLevel: 'gro', // Prefer GROs for initial assignment
        },
        select: {
          id: true,
          name: true,
        },
        take: 1,
      },
    },
  });

  res.json({ department });
};
