import { Router } from 'express';
import {
  createGrievance,
  getGrievances,
  getGrievance,
  updateGrievance,
  upvoteGrievance,
  getCommunityFeed,
  getMyGrievances,
} from '../controllers/grievance.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/community', getCommunityFeed);
router.get('/my', authenticate, getMyGrievances);
router.get('/:id', getGrievance);
router.get('/', getGrievances);
router.post('/', authenticate, createGrievance);
router.patch('/:id', authenticate, updateGrievance);
router.post('/:id/upvote', authenticate, upvoteGrievance);

export default router;


