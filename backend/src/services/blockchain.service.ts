import { ethers, EventLog, Log } from 'ethers';
import { EventEmitter } from 'events';
import config from '../config/env';
import { generateGrievanceHash } from '../utils/hash';

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

// Event types for TypeScript
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

class BlockchainService extends EventEmitter {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string | null = null;
  private isListening: boolean = false;
  private lastProcessedBlock: number = 0;

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
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
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contractAddress = contractAddress;

      // Validate and use private key if provided
      if (privateKey && privateKey.length > 0) {
        try {
          this.signer = new ethers.Wallet(privateKey, this.provider);
          this.contract = new ethers.Contract(
            contractAddress,
            GRIEVANCE_REGISTRY_ABI,
            this.signer
          ) as ethers.Contract;
          console.log('Blockchain service initialized with write access');
        } catch (keyError) {
          console.warn('Invalid private key provided. Using read-only mode.');
          // Fall back to read-only mode
          this.contract = new ethers.Contract(
            contractAddress,
            GRIEVANCE_REGISTRY_ABI,
            this.provider
          ) as ethers.Contract;
          console.log('Blockchain service initialized (read-only)');
        }
      } else {
        // Read-only contract instance
        this.contract = new ethers.Contract(
          contractAddress,
          GRIEVANCE_REGISTRY_ABI,
          this.provider
        ) as ethers.Contract;
        console.log('Blockchain service initialized (read-only)');
      }
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
    }
  }

  /**
   * Check if blockchain service is available
   */
  isAvailable(): boolean {
    return this.contract !== null && this.provider !== null;
  }

  /**
   * Store grievance hash on blockchain
   */
  async storeGrievanceHash(
    grievanceId: string,
    title: string,
    description: string,
    userId: string,
    submitterAddress: string,
    timestamp: Date
  ): Promise<{ txHash: string; hash: string } | null> {
    if (!this.contract || !this.signer) {
      console.warn('Blockchain service not available or signer not configured');
      return null;
    }

    try {
      const hash = generateGrievanceHash(grievanceId, title, description, userId, timestamp);
      const submitterAddr = ethers.getAddress(submitterAddress);

      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.storeGrievanceHash(hash, grievanceId, submitterAddr);
      const receipt = await tx.wait();

      return {
        txHash: receipt?.hash || tx.hash,
        hash,
      };
    } catch (error: any) {
      console.error('Error storing grievance hash on blockchain:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Update grievance status on blockchain
   */
  async updateGrievanceStatus(
    hash: string,
    newStatus: string,
    message: string = ''
  ): Promise<string | null> {
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
    } catch (error: any) {
      console.error('Error updating grievance status on blockchain:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Verify if a grievance exists on blockchain
   */
  async verifyGrievance(hash: string): Promise<boolean> {
    if (!this.contract) {
      return false;
    }

    try {
      return await this.contract.verifyGrievance(hash);
    } catch (error) {
      console.error('Error verifying grievance on blockchain:', error);
      return false;
    }
  }

  /**
   * Get grievance information from blockchain
   */
  async getGrievanceInfo(hash: string): Promise<any> {
    if (!this.contract) {
      return null;
    }

    try {
      return await this.contract.getGrievanceInfo(hash);
    } catch (error) {
      console.error('Error getting grievance info from blockchain:', error);
      return null;
    }
  }

  /**
   * Get status history from blockchain
   */
  async getGrievanceHistory(hash: string): Promise<any[]> {
    if (!this.contract) {
      return [];
    }

    try {
      return await this.contract.getGrievanceHistory(hash);
    } catch (error) {
      console.error('Error getting grievance history from blockchain:', error);
      return [];
    }
  }

  /**
   * Get current status from blockchain
   */
  async getCurrentStatus(hash: string): Promise<string | null> {
    if (!this.contract) {
      return null;
    }

    try {
      return await this.contract.getCurrentStatus(hash);
    } catch (error) {
      console.error('Error getting current status from blockchain:', error);
      return null;
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string | null {
    return this.contractAddress;
  }

  /**
   * Get signer address (for backend-signed transactions)
   */
  getSignerAddress(): string | null {
    return this.signer?.address || null;
  }

  /**
   * Start listening for blockchain events
   */
  async startEventListening(): Promise<void> {
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
        const eventData: BlockchainGrievanceRegisteredEvent = {
          hash: hash,
          grievanceId: grievanceId,
          submitter: submitter,
          timestamp: Number(timestamp),
          transactionHash: (event as EventLog).transactionHash,
          blockNumber: (event as EventLog).blockNumber,
        };
        console.log('📡 GrievanceRegistered event:', eventData.grievanceId);
        this.emit('grievanceRegistered', eventData);
      });

      // Listen for StatusUpdated events
      this.contract.on('StatusUpdated', (hash, oldStatus, newStatus, updater, timestamp, message, event) => {
        const eventData: BlockchainStatusUpdatedEvent = {
          hash: hash,
          oldStatus: oldStatus,
          newStatus: newStatus,
          updater: updater,
          timestamp: Number(timestamp),
          message: message,
          transactionHash: (event as EventLog).transactionHash,
          blockNumber: (event as EventLog).blockNumber,
        };
        console.log('📡 StatusUpdated event:', { hash: hash.slice(0, 10) + '...', oldStatus, newStatus });
        this.emit('statusUpdated', eventData);
      });

      console.log('✅ Blockchain event listeners started');
    } catch (error) {
      console.error('Failed to start event listening:', error);
      this.isListening = false;
    }
  }

  /**
   * Stop listening for blockchain events
   */
  async stopEventListening(): Promise<void> {
    if (!this.contract) return;

    try {
      await this.contract.removeAllListeners();
      this.isListening = false;
      console.log('🛑 Blockchain event listeners stopped');
    } catch (error) {
      console.error('Error stopping event listeners:', error);
    }
  }

  /**
   * Check if event listening is active
   */
  isEventListeningActive(): boolean {
    return this.isListening;
  }

  /**
   * Query past events (for syncing missed events)
   */
  async getPastGrievanceRegisteredEvents(fromBlock: number, toBlock: number | 'latest' = 'latest'): Promise<BlockchainGrievanceRegisteredEvent[]> {
    if (!this.contract) return [];

    try {
      const filter = this.contract.filters.GrievanceRegistered();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

      return events.map((event) => {
        const log = event as EventLog;
        return {
          hash: log.args[0],
          grievanceId: log.args[1],
          submitter: log.args[2],
          timestamp: Number(log.args[3]),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
        };
      });
    } catch (error) {
      console.error('Error querying past GrievanceRegistered events:', error);
      return [];
    }
  }

  /**
   * Query past status update events
   */
  async getPastStatusUpdatedEvents(fromBlock: number, toBlock: number | 'latest' = 'latest'): Promise<BlockchainStatusUpdatedEvent[]> {
    if (!this.contract) return [];

    try {
      const filter = this.contract.filters.StatusUpdated();
      const events = await this.contract.queryFilter(filter, fromBlock, toBlock);

      return events.map((event) => {
        const log = event as EventLog;
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
    } catch (error) {
      console.error('Error querying past StatusUpdated events:', error);
      return [];
    }
  }

  /**
   * Get the last processed block number
   */
  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }
}

export default new BlockchainService();

