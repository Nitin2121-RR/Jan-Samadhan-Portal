import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(255),
  phone: z.string().max(20).optional(),
  role: z.enum(['citizen', 'authority']),
  address: z.string().max(500).optional(),
  department: z.string().max(255).optional(), // Legacy field
  position: z.string().max(255).optional(),
  departmentId: z.string().uuid().optional(), // New department relation
  authorityLevel: z.enum(['director', 'nodal_officer', 'gro', 'field_officer']).optional(),
}).refine(
  (data) => {
    if (data.role === 'citizen' && !data.address) {
      return false;
    }
    if (data.role === 'authority' && !data.departmentId) {
      return false;
    }
    return true;
  },
  {
    message: 'Citizen must provide address. Authority must provide departmentId.',
  }
);

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(100),
});

export const signup = async (req: Request, res: Response): Promise<void> => {
  const data = signupSchema.parse(req.body);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // For authorities, get department name for legacy field
  let departmentName: string | null = null;
  if (data.role === 'authority' && data.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
      select: { name: true },
    });
    departmentName = dept?.name || data.department || null;
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      role: data.role,
      address: data.role === 'citizen' ? data.address : null,
      department: data.role === 'authority' ? departmentName : null,
      position: data.role === 'authority' ? data.position : null,
      departmentId: data.role === 'authority' ? data.departmentId : null,
      authorityLevel: data.role === 'authority' ? (data.authorityLevel as any) || 'gro' : null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      address: true,
      department: true,
      position: true,
      departmentId: true,
      authorityLevel: true,
    },
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    user,
    token,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const data = loginSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isValid = await comparePassword(data.password, user.password);

  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      department: user.department,
      position: user.position,
      departmentId: user.departmentId,
      authorityLevel: user.authorityLevel,
    },
    token,
  });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      address: true,
      department: true,
      position: true,
      departmentId: true,
      authorityLevel: true,
      department_rel: {
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
        },
      },
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ user });
};

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const data = forgotPasswordSchema.parse(req.body);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  // Always return success to prevent email enumeration attacks
  // In a real app, you would send an email with a reset link
  if (user) {
    // Generate a reset token (in production, store this and send via email)
    const resetToken = Math.random().toString(36).substring(2, 15) +
                       Math.random().toString(36).substring(2, 15);

    // In production:
    // 1. Store resetToken hash in database with expiry
    // 2. Send email with reset link containing the token
    console.log(`Password reset requested for ${data.email}. Token: ${resetToken}`);
  }

  res.json({
    message: 'If an account exists with this email, you will receive password reset instructions.',
  });
};

