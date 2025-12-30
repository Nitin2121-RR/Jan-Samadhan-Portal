import { Router } from 'express';
import { signup, login, getMe, forgotPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/signup', asyncHandler(signup));
router.post('/login', asyncHandler(login));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;

