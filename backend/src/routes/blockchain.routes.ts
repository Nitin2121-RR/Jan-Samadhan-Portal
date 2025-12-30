import { Router } from 'express';
import {
  verifyGrievance,
  getGrievanceHistory,
  getContractAddress,
  getBlockchainStatus,
  getPastEvents,
} from '../controllers/blockchain.controller';

const router = Router();

// Public endpoints
router.get('/contract-address', getContractAddress);
router.get('/status', getBlockchainStatus);
router.get('/events', getPastEvents);
router.get('/grievance/:id/history', getGrievanceHistory);
router.post('/verify-grievance/:id', verifyGrievance);

export default router;
