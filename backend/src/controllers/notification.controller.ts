import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { read, page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    userId: req.user.id,
  };

  if (read !== undefined) {
    where.read = read === 'true';
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false,
      },
    }),
  ]);

  res.json({
    notifications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    unreadCount,
  });
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId !== req.user.id) {
    throw new AppError('Forbidden', 403);
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  res.json({ message: 'Notification marked as read' });
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      read: false,
    },
    data: {
      read: true,
    },
  });

  res.json({ message: 'All notifications marked as read' });
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.userId !== req.user.id) {
    throw new AppError('Forbidden', 403);
  }

  await prisma.notification.delete({
    where: { id },
  });

  res.json({ message: 'Notification deleted' });
};


