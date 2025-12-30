import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Recalculate priority for all unresolved grievances
 * POST /api/priority/recalculate-all
 */
export declare const recalculateAllPriorities: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Recalculate priority for a specific grievance
 * POST /api/priority/recalculate/:id
 */
export declare const recalculateGrievancePriority: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get priority breakdown for a grievance
 * GET /api/priority/:id/breakdown
 */
export declare const getPriorityBreakdown: (req: Request, res: Response) => Promise<void>;
/**
 * Get grievances sorted by priority for authority dashboard
 * GET /api/priority/grievances
 */
export declare const getGrievancesByPriority: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=priority.controller.d.ts.map