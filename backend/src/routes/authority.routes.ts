import { Router } from 'express';
import {
  getDashboard,
  acknowledgeGrievance,
  assignGrievance,
  reassignGrievance,
  updateStatus,
  getAnalytics,
} from '../controllers/authority.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication and authority role
router.use(authenticate);
router.use(authorize('authority'));

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.post('/grievances/:id/acknowledge', acknowledgeGrievance);
router.post('/grievances/:id/assign', assignGrievance);
router.post('/grievances/:id/reassign', reassignGrievance);
router.patch('/grievances/:id/status', updateStatus);

export default router;


