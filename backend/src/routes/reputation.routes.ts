import { Router } from 'express';
import {
  getReputationStatus,
  getAuthorityReputation,
  getLeaderboard,
  submitRating,
  getOnChainLeaderboard,
} from '../controllers/reputation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public endpoints
router.get('/status', getReputationStatus);
router.get('/leaderboard', getLeaderboard);
router.get('/leaderboard/onchain', getOnChainLeaderboard);
router.get('/authority/:authorityId', getAuthorityReputation);

// Protected endpoints
router.post('/grievance/:grievanceId/rate', authenticate, submitRating);

export default router;
