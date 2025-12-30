import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createGrievance: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getGrievances: (req: Request, res: Response) => Promise<void>;
export declare const getGrievance: (req: Request, res: Response) => Promise<void>;
export declare const updateGrievance: (req: AuthRequest, res: Response) => Promise<void>;
export declare const upvoteGrievance: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getCommunityFeed: (req: Request, res: Response) => Promise<void>;
export declare const getMyGrievances: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=grievance.controller.d.ts.map