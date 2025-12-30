import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/profile', asyncHandler(getProfile));
router.patch('/profile', asyncHandler(updateProfile));

export default router;

