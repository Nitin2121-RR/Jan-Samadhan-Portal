import { ethers, EventLog } from 'ethers';
import { EventEmitter } from 'events';

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

// Event types
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

class ReputationService extends EventEmitter {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string | null = null;
  private isListening: boolean = false;

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
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
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contractAddress = contractAddress;

      if (privateKey && privateKey.length > 0) {
        try {
          this.signer = new ethers.Wallet(privateKey, this.provider);
          this.contract = new ethers.Contract(
            contractAddress,
            REPUTATION_REGISTRY_ABI,
            this.signer
          );
          console.log('Reputation service initialized with write access');
        } catch (keyError) {
          console.warn('Invalid private key. Reputation service in read-only mode.');
          this.contract = new ethers.Contract(
            contractAddress,
            REPUTATION_REGISTRY_ABI,
            this.provider
          );
        }
      } else {
        this.contract = new ethers.Contract(
          contractAddress,
          REPUTATION_REGISTRY_ABI,
          this.provider
        );
        console.log('Reputation service initialized (read-only)');
      }
    } catch (error) {
      console.error('Failed to initialize reputation service:', error);
    }
  }

  isAvailable(): boolean {
    return this.contract !== null && this.provider !== null;
  }

  /**
   * Register an authority in the reputation system
   */
  async registerAuthority(authorityAddress: string): Promise<string | null> {
    if (!this.contract || !this.signer) return null;

    try {
      const tx = await this.contract.registerAuthority(authorityAddress);
      const receipt = await tx.wait();
      console.log(`Authority ${authorityAddress} registered on reputation system`);
      return receipt?.hash || tx.hash;
    } catch (error: any) {
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
  async recordAssignment(grievanceHash: string, authorityAddress: string): Promise<string | null> {
    if (!this.contract || !this.signer) return null;

    try {
      const tx = await this.contract.recordAssignment(grievanceHash, authorityAddress);
      const receipt = await tx.wait();
      console.log(`Recorded assignment for grievance ${grievanceHash.slice(0, 10)}...`);
      return receipt?.hash || tx.hash;
    } catch (error: any) {
      console.error('Error recording assignment:', error);
      return null;
    }
  }

  /**
   * Record first response to a grievance
   */
  async recordFirstResponse(grievanceHash: string): Promise<string | null> {
    if (!this.contract || !this.signer) return null;

    try {
      const tx = await this.contract.recordFirstResponse(grievanceHash);
      const receipt = await tx.wait();
      console.log(`Recorded first response for grievance ${grievanceHash.slice(0, 10)}...`);
      return receipt?.hash || tx.hash;
    } catch (error: any) {
      console.error('Error recording first response:', error);
      return null;
    }
  }

  /**
   * Record grievance resolution
   */
  async recordResolution(grievanceHash: string): Promise<string | null> {
    if (!this.contract || !this.signer) return null;

    try {
      const tx = await this.contract.recordResolution(grievanceHash);
      const receipt = await tx.wait();
      console.log(`Recorded resolution for grievance ${grievanceHash.slice(0, 10)}...`);
      return receipt?.hash || tx.hash;
    } catch (error: any) {
      console.error('Error recording resolution:', error);
      return null;
    }
  }

  /**
   * Record grievance escalation
   */
  async recordEscalation(grievanceHash: string, newAuthorityAddress: string): Promise<string | null> {
    if (!this.contract || !this.signer) return null;

    try {
      const tx = await this.contract.recordEscalation(grievanceHash, newAuthorityAddress);
      const receipt = await tx.wait();
      console.log(`Recorded escalation for grievance ${grievanceHash.slice(0, 10)}...`);
      return receipt?.hash || tx.hash;
    } catch (error: any) {
      console.error('Error recording escalation:', error);
      return null;
    }
  }

  /**
   * Submit citizen rating for resolved grievance
   */
  async submitRating(grievanceHash: string, isPositive: boolean): Promise<string | null> {
    if (!this.contract || !this.signer) return null;

    try {
      const tx = await this.contract.submitRating(grievanceHash, isPositive);
      const receipt = await tx.wait();
      console.log(`Submitted ${isPositive ? 'positive' : 'negative'} rating`);
      return receipt?.hash || tx.hash;
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      return null;
    }
  }

  /**
   * Get reputation score for an authority
   */
  async getReputationScore(authorityAddress: string): Promise<number> {
    if (!this.contract) return 500; // Default score

    try {
      const score = await this.contract.calculateReputationScore(authorityAddress);
      return Number(score);
    } catch (error) {
      console.error('Error getting reputation score:', error);
      return 500;
    }
  }

  /**
   * Get full reputation data for an authority
   */
  async getAuthorityReputation(authorityAddress: string): Promise<AuthorityReputation | null> {
    if (!this.contract) return null;

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
    } catch (error) {
      console.error('Error getting authority reputation:', error);
      return null;
    }
  }

  /**
   * Get performance metrics for an authority
   */
  async getAuthorityMetrics(authorityAddress: string): Promise<AuthorityMetrics | null> {
    if (!this.contract) return null;

    try {
      const metrics = await this.contract.getAuthorityMetrics(authorityAddress);
      return {
        score: Number(metrics.score),
        resolutionRate: Number(metrics.resolutionRate),
        avgResponseTime: Number(metrics.avgResponseTime),
        avgResolutionTime: Number(metrics.avgResolutionTime),
        satisfactionRate: Number(metrics.satisfactionRate),
      };
    } catch (error) {
      console.error('Error getting authority metrics:', error);
      return null;
    }
  }

  /**
   * Get grievance timing information
   */
  async getGrievanceTiming(grievanceHash: string): Promise<GrievanceTiming | null> {
    if (!this.contract) return null;

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
    } catch (error) {
      console.error('Error getting grievance timing:', error);
      return null;
    }
  }

  /**
   * Get top authorities by reputation score
   */
  async getTopAuthorities(count: number = 10): Promise<{ addresses: string[]; scores: number[] }> {
    if (!this.contract) return { addresses: [], scores: [] };

    try {
      const [addresses, scores] = await this.contract.getTopAuthorities(count);
      return {
        addresses: addresses,
        scores: scores.map((s: bigint) => Number(s)),
      };
    } catch (error) {
      console.error('Error getting top authorities:', error);
      return { addresses: [], scores: [] };
    }
  }

  /**
   * Get total number of registered authorities
   */
  async getRegisteredAuthorityCount(): Promise<number> {
    if (!this.contract) return 0;

    try {
      const count = await this.contract.getRegisteredAuthorityCount();
      return Number(count);
    } catch (error) {
      console.error('Error getting authority count:', error);
      return 0;
    }
  }

  /**
   * Start listening for reputation events
   */
  async startEventListening(): Promise<void> {
    if (!this.contract || !this.provider || this.isListening) return;

    try {
      this.isListening = true;
      console.log('Starting reputation event listeners...');

      this.contract.on('ReputationUpdated', (authority, newScore, timestamp, event) => {
        const eventData: ReputationUpdatedEvent = {
          authority,
          newScore: Number(newScore),
          timestamp: Number(timestamp),
          transactionHash: (event as EventLog).transactionHash,
          blockNumber: (event as EventLog).blockNumber,
        };
        console.log(`Reputation updated: ${authority} -> ${newScore}`);
        this.emit('reputationUpdated', eventData);
      });

      console.log('Reputation event listeners started');
    } catch (error) {
      console.error('Failed to start reputation event listeners:', error);
      this.isListening = false;
    }
  }

  /**
   * Stop listening for events
   */
  async stopEventListening(): Promise<void> {
    if (!this.contract) return;

    try {
      await this.contract.removeAllListeners();
      this.isListening = false;
      console.log('Reputation event listeners stopped');
    } catch (error) {
      console.error('Error stopping reputation event listeners:', error);
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string | null {
    return this.contractAddress;
  }
}

export default new ReputationService();
