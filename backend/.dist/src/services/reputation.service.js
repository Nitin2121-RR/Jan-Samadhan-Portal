"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const events_1 = require("events");
// ReputationRegistry Contract ABI
const REPUTATION_REGISTRY_ABI = [
    // Functions
    'function registerAuthority(address _authority) external',
    'function recordAssignment(bytes32 _grievanceHash, address _authority) external',
    'function recordFirstResponse(bytes32 _grievanceHash) external',
    'function recordResolution(bytes32 _grievanceHash) external',
    'function recordEscalation(bytes32 _grievanceHash, address _newAuthority) external',
    'function submitRating(bytes32 _grievanceHash, bool _isPositive) external',
    'function calculateReputationScore(address _authority) external view returns (uint256)',
    'function getAuthorityReputation(address _authority) external view returns (tuple(address authority, uint256 grievancesAssigned, uint256 grievancesResolved, uint256 grievancesEscalated, uint256 totalResponseTime, uint256 totalResolutionTime, uint256 positiveRatings, uint256 negativeRatings, uint256 lastActivityTimestamp, bool isRegistered))',
    'function getAuthorityMetrics(address _authority) external view returns (uint256 score, uint256 resolutionRate, uint256 avgResponseTime, uint256 avgResolutionTime, uint256 satisfactionRate)',
    'function getGrievanceTiming(bytes32 _grievanceHash) external view returns (tuple(bytes32 grievanceHash, address assignedAuthority, uint256 assignedAt, uint256 firstResponseAt, uint256 resolvedAt, bool isResolved))',
    'function getRegisteredAuthorityCount() external view returns (uint256)',
    'function getTopAuthorities(uint256 _count) external view returns (address[], uint256[])',
    'function registeredAuthorities(uint256 index) external view returns (address)',
    // Events
    'event AuthorityRegistered(address indexed authority, uint256 timestamp)',
    'event GrievanceAssigned(bytes32 indexed grievanceHash, address indexed authority, uint256 timestamp)',
    'event FirstResponse(bytes32 indexed grievanceHash, address indexed authority, uint256 responseTime, uint256 timestamp)',
    'event GrievanceResolved(bytes32 indexed grievanceHash, address indexed authority, uint256 resolutionTime, uint256 timestamp)',
    'event GrievanceEscalated(bytes32 indexed grievanceHash, address indexed fromAuthority, address indexed toAuthority, uint256 timestamp)',
    'event RatingSubmitted(bytes32 indexed grievanceHash, address indexed authority, bool isPositive, uint256 timestamp)',
    'event ReputationUpdated(address indexed authority, uint256 newScore, uint256 timestamp)',
];
class ReputationService extends events_1.EventEmitter {
    constructor() {
        super();
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = null;
        this.isListening = false;
        this.initialize();
    }
    initialize() {
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || process.env.SEPOLIA_RPC_URL;
        const privateKey = process.env.PRIVATE_KEY?.trim();
        const contractAddress = process.env.REPUTATION_CONTRACT_ADDRESS;
        if (!rpcUrl) {
            console.warn('Blockchain RPC URL not configured. Reputation service disabled.');
            return;
        }
        if (!contractAddress) {
            console.warn('Reputation contract address not configured. Reputation service disabled.');
            return;
        }
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.contractAddress = contractAddress;
            if (privateKey && privateKey.length > 0) {
                try {
                    this.signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
                    this.contract = new ethers_1.ethers.Contract(contractAddress, REPUTATION_REGISTRY_ABI, this.signer);
                    console.log('Reputation service initialized with write access');
                }
                catch (keyError) {
                    console.warn('Invalid private key. Reputation service in read-only mode.');
                    this.contract = new ethers_1.ethers.Contract(contractAddress, REPUTATION_REGISTRY_ABI, this.provider);
                }
            }
            else {
                this.contract = new ethers_1.ethers.Contract(contractAddress, REPUTATION_REGISTRY_ABI, this.provider);
                console.log('Reputation service initialized (read-only)');
            }
        }
        catch (error) {
            console.error('Failed to initialize reputation service:', error);
        }
    }
    isAvailable() {
        return this.contract !== null && this.provider !== null;
    }
    /**
     * Register an authority in the reputation system
     */
    async registerAuthority(authorityAddress) {
        if (!this.contract || !this.signer)
            return null;
        try {
            const tx = await this.contract.registerAuthority(authorityAddress);
            const receipt = await tx.wait();
            console.log(`Authority ${authorityAddress} registered on reputation system`);
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            // If already registered, ignore error
            if (error.message?.includes('Authority already registered')) {
                console.log(`Authority ${authorityAddress} already registered`);
                return null;
            }
            console.error('Error registering authority:', error);
            throw error;
        }
    }
    /**
     * Record a grievance assignment
     */
    async recordAssignment(grievanceHash, authorityAddress) {
        if (!this.contract || !this.signer)
            return null;
        try {
            const tx = await this.contract.recordAssignment(grievanceHash, authorityAddress);
            const receipt = await tx.wait();
            console.log(`Recorded assignment for grievance ${grievanceHash.slice(0, 10)}...`);
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            console.error('Error recording assignment:', error);
            return null;
        }
    }
    /**
     * Record first response to a grievance
     */
    async recordFirstResponse(grievanceHash) {
        if (!this.contract || !this.signer)
            return null;
        try {
            const tx = await this.contract.recordFirstResponse(grievanceHash);
            const receipt = await tx.wait();
            console.log(`Recorded first response for grievance ${grievanceHash.slice(0, 10)}...`);
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            console.error('Error recording first response:', error);
            return null;
        }
    }
    /**
     * Record grievance resolution
     */
    async recordResolution(grievanceHash) {
        if (!this.contract || !this.signer)
            return null;
        try {
            const tx = await this.contract.recordResolution(grievanceHash);
            const receipt = await tx.wait();
            console.log(`Recorded resolution for grievance ${grievanceHash.slice(0, 10)}...`);
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            console.error('Error recording resolution:', error);
            return null;
        }
    }
    /**
     * Record grievance escalation
     */
    async recordEscalation(grievanceHash, newAuthorityAddress) {
        if (!this.contract || !this.signer)
            return null;
        try {
            const tx = await this.contract.recordEscalation(grievanceHash, newAuthorityAddress);
            const receipt = await tx.wait();
            console.log(`Recorded escalation for grievance ${grievanceHash.slice(0, 10)}...`);
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            console.error('Error recording escalation:', error);
            return null;
        }
    }
    /**
     * Submit citizen rating for resolved grievance
     */
    async submitRating(grievanceHash, isPositive) {
        if (!this.contract || !this.signer)
            return null;
        try {
            const tx = await this.contract.submitRating(grievanceHash, isPositive);
            const receipt = await tx.wait();
            console.log(`Submitted ${isPositive ? 'positive' : 'negative'} rating`);
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            console.error('Error submitting rating:', error);
            return null;
        }
    }
    /**
     * Get reputation score for an authority
     */
    async getReputationScore(authorityAddress) {
        if (!this.contract)
            return 500; // Default score
        try {
            const score = await this.contract.calculateReputationScore(authorityAddress);
            return Number(score);
        }
        catch (error) {
            console.error('Error getting reputation score:', error);
            return 500;
        }
    }
    /**
     * Get full reputation data for an authority
     */
    async getAuthorityReputation(authorityAddress) {
        if (!this.contract)
            return null;
        try {
            const rep = await this.contract.getAuthorityReputation(authorityAddress);
            return {
                authority: rep.authority,
                grievancesAssigned: Number(rep.grievancesAssigned),
                grievancesResolved: Number(rep.grievancesResolved),
                grievancesEscalated: Number(rep.grievancesEscalated),
                totalResponseTime: Number(rep.totalResponseTime),
                totalResolutionTime: Number(rep.totalResolutionTime),
                positiveRatings: Number(rep.positiveRatings),
                negativeRatings: Number(rep.negativeRatings),
                lastActivityTimestamp: Number(rep.lastActivityTimestamp),
                isRegistered: rep.isRegistered,
            };
        }
        catch (error) {
            console.error('Error getting authority reputation:', error);
            return null;
        }
    }
    /**
     * Get performance metrics for an authority
     */
    async getAuthorityMetrics(authorityAddress) {
        if (!this.contract)
            return null;
        try {
            const metrics = await this.contract.getAuthorityMetrics(authorityAddress);
            return {
                score: Number(metrics.score),
                resolutionRate: Number(metrics.resolutionRate),
                avgResponseTime: Number(metrics.avgResponseTime),
                avgResolutionTime: Number(metrics.avgResolutionTime),
                satisfactionRate: Number(metrics.satisfactionRate),
            };
        }
        catch (error) {
            console.error('Error getting authority metrics:', error);
            return null;
        }
    }
    /**
     * Get grievance timing information
     */
    async getGrievanceTiming(grievanceHash) {
        if (!this.contract)
            return null;
        try {
            const timing = await this.contract.getGrievanceTiming(grievanceHash);
            return {
                grievanceHash: timing.grievanceHash,
                assignedAuthority: timing.assignedAuthority,
                assignedAt: Number(timing.assignedAt),
                firstResponseAt: Number(timing.firstResponseAt),
                resolvedAt: Number(timing.resolvedAt),
                isResolved: timing.isResolved,
            };
        }
        catch (error) {
            console.error('Error getting grievance timing:', error);
            return null;
        }
    }
    /**
     * Get top authorities by reputation score
     */
    async getTopAuthorities(count = 10) {
        if (!this.contract)
            return { addresses: [], scores: [] };
        try {
            const [addresses, scores] = await this.contract.getTopAuthorities(count);
            return {
                addresses: addresses,
                scores: scores.map((s) => Number(s)),
            };
        }
        catch (error) {
            console.error('Error getting top authorities:', error);
            return { addresses: [], scores: [] };
        }
    }
    /**
     * Get total number of registered authorities
     */
    async getRegisteredAuthorityCount() {
        if (!this.contract)
            return 0;
        try {
            const count = await this.contract.getRegisteredAuthorityCount();
            return Number(count);
        }
        catch (error) {
            console.error('Error getting authority count:', error);
            return 0;
        }
    }
    /**
     * Start listening for reputation events
     */
    async startEventListening() {
        if (!this.contract || !this.provider || this.isListening)
            return;
        try {
            this.isListening = true;
            console.log('Starting reputation event listeners...');
            this.contract.on('ReputationUpdated', (authority, newScore, timestamp, event) => {
                const eventData = {
                    authority,
                    newScore: Number(newScore),
                    timestamp: Number(timestamp),
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                };
                console.log(`Reputation updated: ${authority} -> ${newScore}`);
                this.emit('reputationUpdated', eventData);
            });
            console.log('Reputation event listeners started');
        }
        catch (error) {
            console.error('Failed to start reputation event listeners:', error);
            this.isListening = false;
        }
    }
    /**
     * Stop listening for events
     */
    async stopEventListening() {
        if (!this.contract)
            return;
        try {
            await this.contract.removeAllListeners();
            this.isListening = false;
            console.log('Reputation event listeners stopped');
        }
        catch (error) {
            console.error('Error stopping reputation event listeners:', error);
        }
    }
    /**
     * Get contract address
     */
    getContractAddress() {
        return this.contractAddress;
    }
}
exports.default = new ReputationService();
//# sourceMappingURL=reputation.service.js.map