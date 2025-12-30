import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getDashboard: (req: AuthRequest, res: Response) => Promise<void>;
export declare const acknowledgeGrievance: (req: AuthRequest, res: Response) => Promise<void>;
export declare const assignGrievance: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAnalytics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const reassignGrievance: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=authority.controller.d.ts.map