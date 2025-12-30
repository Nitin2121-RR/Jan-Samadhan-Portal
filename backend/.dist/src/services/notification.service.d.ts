export declare const createNotification: (userId: string, type: string, message: string) => Promise<void>;
export declare const notifyGrievanceStatusChange: (grievanceId: string, status: string, message?: string) => Promise<void>;
export declare const notifyGrievanceAssigned: (grievanceId: string, assignedToId: string) => Promise<void>;
//# sourceMappingURL=notification.service.d.ts.map