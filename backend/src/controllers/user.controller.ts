import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/password';

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  password: z.string().min(6).optional(),
});

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      address: true,
      department: true,
      position: true,
      createdAt: true,
      _count: {
        select: {
          grievances: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Calculate stats for citizens
  let stats = {
    reported: 0,
    resolved: 0,
    upvotes: 0,
  };

  if (user.role === 'citizen') {
    const [reportedCount, resolvedCount, upvotesCount] = await Promise.all([
      prisma.grievance.count({
        where: { userId: user.id },
      }),
      prisma.grievance.count({
        where: { userId: user.id, status: 'resolved' },
      }),
      prisma.upvote.count({
        where: {
          grievance: {
            userId: user.id,
          },
        },
      }),
    ]);

    stats = {
      reported: reportedCount,
      resolved: resolvedCount,
      upvotes: upvotesCount,
    };
  }

  res.json({ user, stats });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const data = updateProfileSchema.parse(req.body);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.position !== undefined) updateData.position = data.position;
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      address: true,
      department: true,
      position: true,
      createdAt: true,
    },
  });

  res.json({ user });
};

