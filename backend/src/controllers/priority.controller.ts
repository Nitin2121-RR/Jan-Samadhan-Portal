import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import priorityService from '../services/priority.service';

/**
 * Recalculate priority for all unresolved grievances
 * POST /api/priority/recalculate-all
 */
export const recalculateAllPriorities = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'authority') {
    throw new AppError('Forbidden', 403);
  }

  const result = await priorityService.recalculateAllPriorities();

  res.json({
    message: 'Priority recalculation complete',
    ...result,
  });
};

/**
 * Recalculate priority for a specific grievance
 * POST /api/priority/recalculate/:id
 */
export const recalculateGrievancePriority = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'authority') {
    throw new AppError('Forbidden', 403);
  }

  const { id } = req.params;
  const newScore = await priorityService.recalculateGrievancePriority(id);

  res.json({
    grievanceId: id,
    newPriorityScore: newScore,
  });
};

/**
 * Get priority breakdown for a grievance
 * GET /api/priority/:id/breakdown
 */
export const getPriorityBreakdown = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const breakdown = await priorityService.getPriorityBreakdown(id);

  if (!breakdown) {
    throw new AppError('Grievance not found', 404);
  }

  res.json(breakdown);
};

/**
 * Get grievances sorted by priority for authority dashboard
 * GET /api/priority/grievances
 */
export const getGrievancesByPriority = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== 'authority') {
    throw new AppError('Forbidden', 403);
  }

  const { department, status, limit, offset } = req.query;

  const grievances = await priorityService.getGrievancesByPriority({
    assignedToId: req.user.id,
    department: department as string,
    status: status as string,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  });

  res.json({ grievances });
};
