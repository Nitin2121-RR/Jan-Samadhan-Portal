import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  recalculateAllPriorities,
  recalculateGrievancePriority,
  getPriorityBreakdown,
  getGrievancesByPriority,
} from '../controllers/priority.controller';

const router = Router();

// Get grievances sorted by priority (authority only)
router.get('/grievances', authenticate, getGrievancesByPriority);

// Recalculate all priorities (authority only)
router.post('/recalculate-all', authenticate, recalculateAllPriorities);

// Recalculate single grievance priority (authority only)
router.post('/recalculate/:id', authenticate, recalculateGrievancePriority);

// Get priority breakdown for a grievance (public)
router.get('/:id/breakdown', getPriorityBreakdown);

export default router;
