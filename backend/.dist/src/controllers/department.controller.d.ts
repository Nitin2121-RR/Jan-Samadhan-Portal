import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getAllDepartments: (_req: AuthRequest, res: Response) => Promise<void>;
export declare const getDepartmentById: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDepartmentAuthorities: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDepartmentByCategory: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=department.controller.d.ts.map