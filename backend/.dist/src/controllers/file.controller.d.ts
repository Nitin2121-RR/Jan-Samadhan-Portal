import { Request, Response } from 'express';
import multer from 'multer';
import { AuthRequest } from '../middleware/auth';
export declare const upload: multer.Multer;
export declare const uploadFile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getFile: (req: Request, res: Response) => Promise<void>;
export declare const deleteFileById: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=file.controller.d.ts.map