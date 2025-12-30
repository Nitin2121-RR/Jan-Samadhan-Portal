import { EventEmitter } from 'events';
export interface AuthorityReputation {
    authority: string;
    grievancesAssigned: number;
    grievancesResolved: number;
    grievancesEscalated: number;
    totalResponseTime: number;
    totalResolutionTime: number;
    positiveRatings: number;
    negativeRatings: number;
    lastActivityTimestamp: number;
    isRegistered: boolean;
}
export interface AuthorityMetrics {
    score: number;
    resolutionRate: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    satisfactionRate: number;
}
export interface GrievanceTiming {
    grievanceHash: string;
    assignedAuthority: string;
    assignedAt: number;
    firstResponseAt: number;
    resolvedAt: number;
    isResolved: boolean;
}
export interface ReputationUpdatedEvent {
    authority: string;
    newScore: number;
    timestamp: number;
    transactionHash: string;
    blockNumber: number;
}
declare class ReputationService extends EventEmitter {
    private provider;
    private signer;
    private contract;
    private contractAddress;
    private isListening;
    constructor();
    private initialize;
    isAvailable(): boolean;
    /**
     * Register an authority in the reputation system
     */
    registerAuthority(authorityAddress: string): Promise<string | null>;
    /**
     * Record a grievance assignment
     */
    recordAssignment(grievanceHash: string, authorityAddress: string): Promise<string | null>;
    /**
     * Record first response to a grievance
     */
    recordFirstResponse(grievanceHash: string): Promise<string | null>;
    /**
     * Record grievance resolution
     */
    recordResolution(grievanceHash: string): Promise<string | null>;
    /**
     * Record grievance escalation
     */
    recordEscalation(grievanceHash: string, newAuthorityAddress: string): Promise<string | null>;
    /**
     * Submit citizen rating for resolved grievance
     */
    submitRating(grievanceHash: string, isPositive: boolean): Promise<string | null>;
    /**
     * Get reputation score for an authority
     */
    getReputationScore(authorityAddress: string): Promise<number>;
    /**
     * Get full reputation data for an authority
     */
    getAuthorityReputation(authorityAddress: string): Promise<AuthorityReputation | null>;
    /**
     * Get performance metrics for an authority
     */
    getAuthorityMetrics(authorityAddress: string): Promise<AuthorityMetrics | null>;
    /**
     * Get grievance timing information
     */
    getGrievanceTiming(grievanceHash: string): Promise<GrievanceTiming | null>;
    /**
     * Get top authorities by reputation score
     */
    getTopAuthorities(count?: number): Promise<{
        addresses: string[];
        scores: number[];
    }>;
    /**
     * Get total number of registered authorities
     */
    getRegisteredAuthorityCount(): Promise<number>;
    /**
     * Start listening for reputation events
     */
    startEventListening(): Promise<void>;
    /**
     * Stop listening for events
     */
    stopEventListening(): Promise<void>;
    /**
     * Get contract address
     */
    getContractAddress(): string | null;
}
declare const _default: ReputationService;
export default _default;
//# sourceMappingURL=reputation.service.d.ts.map