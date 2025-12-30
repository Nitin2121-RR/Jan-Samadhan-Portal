"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const events_1 = require("events");
const hash_1 = require("../utils/hash");
// Contract ABI (simplified - in production, import from artifacts)
const GRIEVANCE_REGISTRY_ABI = [
    'function storeGrievanceHash(bytes32 hash, string memory grievanceId, address submitter) external',
    'function updateGrievanceStatus(bytes32 hash, string memory newStatus, string memory message) external',
    'function verifyGrievance(bytes32 hash) external view returns (bool)',
    'function getGrievanceInfo(bytes32 hash) external view returns (tuple(bytes32 hash, string grievanceId, address submitter, uint256 createdAt, bool exists))',
    'function getGrievanceHistory(bytes32 hash) external view returns (tuple(bytes32 grievanceHash, string status, address updater, uint256 timestamp, string message)[])',
    'function getCurrentStatus(bytes32 hash) external view returns (string memory)',
    'event GrievanceRegistered(bytes32 indexed hash, string indexed grievanceId, address indexed submitter, uint256 timestamp)',
    'event StatusUpdated(bytes32 indexed hash, string oldStatus, string newStatus, address indexed updater, uint256 timestamp, string message)',
];
class BlockchainService extends events_1.EventEmitter {
    constructor() {
        super();
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = null;
        this.isListening = false;
        this.lastProcessedBlock = 0;
        this.initialize();
    }
    initialize() {
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || process.env.SEPOLIA_RPC_URL;
        const privateKey = process.env.PRIVATE_KEY?.trim();
        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!rpcUrl) {
            console.warn('Blockchain RPC URL not configured. Blockchain features will be disabled.');
            return;
        }
        if (!contractAddress) {
            console.warn('Contract address not configured. Blockchain features will be disabled.');
            return;
        }
        try {
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            this.contractAddress = contractAddress;
            // Validate and use private key if provided
            if (privateKey && privateKey.length > 0) {
                try {
                    this.signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
                    this.contract = new ethers_1.ethers.Contract(contractAddress, GRIEVANCE_REGISTRY_ABI, this.signer);
                    console.log('Blockchain service initialized with write access');
                }
                catch (keyError) {
                    console.warn('Invalid private key provided. Using read-only mode.');
                    // Fall back to read-only mode
                    this.contract = new ethers_1.ethers.Contract(contractAddress, GRIEVANCE_REGISTRY_ABI, this.provider);
                    console.log('Blockchain service initialized (read-only)');
                }
            }
            else {
                // Read-only contract instance
                this.contract = new ethers_1.ethers.Contract(contractAddress, GRIEVANCE_REGISTRY_ABI, this.provider);
                console.log('Blockchain service initialized (read-only)');
            }
        }
        catch (error) {
            console.error('Failed to initialize blockchain service:', error);
        }
    }
    /**
     * Check if blockchain service is available
     */
    isAvailable() {
        return this.contract !== null && this.provider !== null;
    }
    /**
     * Store grievance hash on blockchain
     */
    async storeGrievanceHash(grievanceId, title, description, userId, submitterAddress, timestamp) {
        if (!this.contract || !this.signer) {
            console.warn('Blockchain service not available or signer not configured');
            return null;
        }
        try {
            const hash = (0, hash_1.generateGrievanceHash)(grievanceId, title, description, userId, timestamp);
            const submitterAddr = ethers_1.ethers.getAddress(submitterAddress);
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            const tx = await this.contract.storeGrievanceHash(hash, grievanceId, submitterAddr);
            const receipt = await tx.wait();
            return {
                txHash: receipt?.hash || tx.hash,
                hash,
            };
        }
        catch (error) {
            console.error('Error storing grievance hash on blockchain:', error);
            throw new Error(`Blockchain transaction failed: ${error.message}`);
        }
    }
    /**
     * Update grievance status on blockchain
     */
    async updateGrievanceStatus(hash, newStatus, message = '') {
        if (!this.contract || !this.signer) {
            console.warn('Blockchain service not available or signer not configured');
            return null;
        }
        try {
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }
            const tx = await this.contract.updateGrievanceStatus(hash, newStatus, message);
            const receipt = await tx.wait();
            return receipt?.hash || tx.hash;
        }
        catch (error) {
            console.error('Error updating grievance status on blockchain:', error);
            throw new Error(`Blockchain transaction failed: ${error.message}`);
        }
    }
    /**
     * Verify if a grievance exists on blockchain
     */
    async verifyGrievance(hash) {
        if (!this.contract) {
            return false;
        }
        try {
            return await this.contract.verifyGrievance(hash);
        }
        catch (error) {
            console.error('Error verifying grievance on blockchain:', error);
            return false;
        }
    }
    /**
     * Get grievance information from blockchain
     */
    async getGrievanceInfo(hash) {
        if (!this.contract) {
            return null;
        }
        try {
            return await this.contract.getGrievanceInfo(hash);
        }
        catch (error) {
            console.error('Error getting grievance info from blockchain:', error);
            return null;
        }
    }
    /**
     * Get status history from blockchain
     */
    async getGrievanceHistory(hash) {
        if (!this.contract) {
            return [];
        }
        try {
            return await this.contract.getGrievanceHistory(hash);
        }
        catch (error) {
            console.error('Error getting grievance history from blockchain:', error);
            return [];
        }
    }
    /**
     * Get current status from blockchain
     */
    async getCurrentStatus(hash) {
        if (!this.contract) {
            return null;
        }
        try {
            return await this.contract.getCurrentStatus(hash);
        }
        catch (error) {
            console.error('Error getting current status from blockchain:', error);
            return null;
        }
    }
    /**
     * Get contract address
     */
    getContractAddress() {
        return this.contractAddress;
    }
    /**
     * Get signer address (for backend-signed transactions)
     */
    getSignerAddress() {
        return this.signer?.address || null;
    }
    /**
     * Start listening for blockchain events
     */
    async startEventListening() {
        if (!this.contract || !this.provider) {
            console.warn('Cannot start event listening: contract or provider not available');
            return;
        }
        if (this.isListening) {
            console.log('Event listening already active');
            return;
        }
        try {
            // Get the current block number to start listening from
            this.lastProcessedBlock = await this.provider.getBlockNumber();
            this.isListening = true;
            console.log(`🔗 Starting blockchain event listener from block ${this.lastProcessedBlock}`);
            // Listen for GrievanceRegistered events
            this.contract.on('GrievanceRegistered', (hash, grievanceId, submitter, timestamp, event) => {
                const eventData = {
                    hash: hash,
                    grievanceId: grievanceId,
                    submitter: submitter,
                    timestamp: Number(timestamp),
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                };
                console.log('📡 GrievanceRegistered event:', eventData.grievanceId);
                this.emit('grievanceRegistered', eventData);
            });
            // Listen for StatusUpdated events
            this.contract.on('StatusUpdated', (hash, oldStatus, newStatus, updater, timestamp, message, event) => {
                const eventData = {
                    hash: hash,
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                    updater: updater,
                    timestamp: Number(timestamp),
                    message: message,
                    transactionHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                };
                console.log('📡 StatusUpdated event:', { hash: hash.slice(0, 10) + '...', oldStatus, newStatus });
                this.emit('statusUpdated', eventData);
            });
            console.log('✅ Blockchain event listeners started');
        }
        catch (error) {
            console.error('Failed to start event listening:', error);
            this.isListening = false;
        }
    }
    /**
     * Stop listening for blockchain events
     */
    async stopEventListening() {
        if (!this.contract)
            return;
        try {
            await this.contract.removeAllListeners();
            this.isListening = false;
            console.log('🛑 Blockchain event listeners stopped');
        }
        catch (error) {
            console.error('Error stopping event listeners:', error);
        }
    }
    /**
     * Check if event listening is active
     */
    isEventListeningActive() {
        return this.isListening;
    }
    /**
     * Query past events (for syncing missed events)
     */
    async getPastGrievanceRegisteredEvents(fromBlock, toBlock = 'latest') {
        if (!this.contract)
            return [];
        try {
            const filter = this.contract.filters.GrievanceRegistered();
            const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
            return events.map((event) => {
                const log = event;
                return {
                    hash: log.args[0],
                    grievanceId: log.args[1],
                    submitter: log.args[2],
                    timestamp: Number(log.args[3]),
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                };
            });
        }
        catch (error) {
            console.error('Error querying past GrievanceRegistered events:', error);
            return [];
        }
    }
    /**
     * Query past status update events
     */
    async getPastStatusUpdatedEvents(fromBlock, toBlock = 'latest') {
        if (!this.contract)
            return [];
        try {
            const filter = this.contract.filters.StatusUpdated();
            const events = await this.contract.queryFilter(filter, fromBlock, toBlock);
            return events.map((event) => {
                const log = event;
                return {
                    hash: log.args[0],
                    oldStatus: log.args[1],
                    newStatus: log.args[2],
                    updater: log.args[3],
                    timestamp: Number(log.args[4]),
                    message: log.args[5],
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                };
            });
        }
        catch (error) {
            console.error('Error querying past StatusUpdated events:', error);
            return [];
        }
    }
    /**
     * Get the last processed block number
     */
    getLastProcessedBlock() {
        return this.lastProcessedBlock;
    }
}
exports.default = new BlockchainService();
//# sourceMappingURL=blockchain.service.js.map