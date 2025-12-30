import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Get reputation status and contract info
 */
export declare const getReputationStatus: (req: Request, res: Response) => Promise<void>;
/**
 * Get reputation score and metrics for an authority
 */
export declare const getAuthorityReputation: (req: Request, res: Response) => Promise<void>;
/**
 * Get leaderboard of top authorities
 */
export declare const getLeaderboard: (req: Request, res: Response) => Promise<void>;
/**
 * Submit a rating for a resolved grievance
 */
export declare const submitRating: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get on-chain top authorities
 */
export declare const getOnChainLeaderboard: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=reputation.controller.d.ts.map