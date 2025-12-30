import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const signup: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response) => Promise<void>;
export declare const forgotPassword: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map