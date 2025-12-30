interface PriorityFactors {
    severity: number;
    upvotes: number;
    hoursOld: number;
    category: string;
    status: string;
    isEscalated: boolean;
}
interface PriorityBreakdown {
    totalScore: number;
    severityScore: number;
    upvoteScore: number;
    timeScore: number;
    categoryScore: number;
    urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
}
declare class PriorityService {
    /**
     * Calculate priority score for a grievance
     * Returns a score from 0-100
     */
    calculatePriority(factors: PriorityFactors): PriorityBreakdown;
    /**
     * Recalculate priority for a single grievance
     */
    recalculateGrievancePriority(grievanceId: string): Promise<number>;
    /**
     * Recalculate priority for all unresolved grievances
     */
    recalculateAllPriorities(): Promise<{
        updated: number;
        errors: number;
    }>;
    /**
     * Get priority breakdown for a grievance
     */
    getPriorityBreakdown(grievanceId: string): Promise<PriorityBreakdown | null>;
    /**
     * Get grievances sorted by calculated priority
     */
    getGrievancesByPriority(options: {
        department?: string;
        assignedToId?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
}
declare const _default: PriorityService;
export default _default;
//# sourceMappingURL=priority.service.d.ts.map