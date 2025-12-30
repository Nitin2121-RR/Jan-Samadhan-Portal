import { EventEmitter } from 'events';
export interface BlockchainGrievanceRegisteredEvent {
    hash: string;
    grievanceId: string;
    submitter: string;
    timestamp: number;
    transactionHash: string;
    blockNumber: number;
}
export interface BlockchainStatusUpdatedEvent {
    hash: string;
    oldStatus: string;
    newStatus: string;
    updater: string;
    timestamp: number;
    message: string;
    transactionHash: string;
    blockNumber: number;
}
declare class BlockchainService extends EventEmitter {
    private provider;
    private signer;
    private contract;
    private contractAddress;
    private isListening;
    private lastProcessedBlock;
    constructor();
    private initialize;
    /**
     * Check if blockchain service is available
     */
    isAvailable(): boolean;
    /**
     * Store grievance hash on blockchain
     */
    storeGrievanceHash(grievanceId: string, title: string, description: string, userId: string, submitterAddress: string, timestamp: Date): Promise<{
        txHash: string;
        hash: string;
    } | null>;
    /**
     * Update grievance status on blockchain
     */
    updateGrievanceStatus(hash: string, newStatus: string, message?: string): Promise<string | null>;
    /**
     * Verify if a grievance exists on blockchain
     */
    verifyGrievance(hash: string): Promise<boolean>;
    /**
     * Get grievance information from blockchain
     */
    getGrievanceInfo(hash: string): Promise<any>;
    /**
     * Get status history from blockchain
     */
    getGrievanceHistory(hash: string): Promise<any[]>;
    /**
     * Get current status from blockchain
     */
    getCurrentStatus(hash: string): Promise<string | null>;
    /**
     * Get contract address
     */
    getContractAddress(): string | null;
    /**
     * Get signer address (for backend-signed transactions)
     */
    getSignerAddress(): string | null;
    /**
     * Start listening for blockchain events
     */
    startEventListening(): Promise<void>;
    /**
     * Stop listening for blockchain events
     */
    stopEventListening(): Promise<void>;
    /**
     * Check if event listening is active
     */
    isEventListeningActive(): boolean;
    /**
     * Query past events (for syncing missed events)
     */
    getPastGrievanceRegisteredEvents(fromBlock: number, toBlock?: number | 'latest'): Promise<BlockchainGrievanceRegisteredEvent[]>;
    /**
     * Query past status update events
     */
    getPastStatusUpdatedEvents(fromBlock: number, toBlock?: number | 'latest'): Promise<BlockchainStatusUpdatedEvent[]>;
    /**
     * Get the last processed block number
     */
    getLastProcessedBlock(): number;
}
declare const _default: BlockchainService;
export default _default;
//# sourceMappingURL=blockchain.service.d.ts.map