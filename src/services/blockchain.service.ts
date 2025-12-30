// Using direct fetch with environment variable for API URL

export interface BlockchainVerification {
  verified: boolean;
  hash?: string;
  txHash?: string;
  contractAddress?: string;
}

export interface BlockchainHistory {
  onChainHistory: Array<{
    status: string;
    updater: string;
    timestamp: string;
    message: string;
  }>;
  dbHistory: Array<{
    id: string;
    status: string | null;
    message: string | null;
    user: {
      id: string;
      name: string;
    };
    timestamp: Date;
    txHash: string | null;
  }>;
}

class BlockchainService {
  async verifyGrievance(grievanceId: string): Promise<BlockchainVerification> {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://jansam-production.up.railway.app/api';
      const response = await fetch(`${baseURL}/blockchain/verify-grievance/${grievanceId}`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify grievance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying grievance:', error);
      return { verified: false };
    }
  }

  async getGrievanceHistory(grievanceId: string): Promise<BlockchainHistory> {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://jansam-production.up.railway.app/api';
      const response = await fetch(`${baseURL}/blockchain/grievance/${grievanceId}/history`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get grievance history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting grievance history:', error);
      return { onChainHistory: [], dbHistory: [] };
    }
  }

  async getContractAddress(): Promise<{ contractAddress: string | null; network: string; available: boolean }> {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://jansam-production.up.railway.app/api';
      const response = await fetch(`${baseURL}/blockchain/contract-address`);
      return await response.json();
    } catch (error) {
      console.error('Error getting contract address:', error);
      return { contractAddress: null, network: 'sepolia', available: false };
    }
  }

  private getToken(): string | null {
    const auth = localStorage.getItem('jansamadhan_auth');
    if (auth) {
      try {
        const parsed = JSON.parse(auth);
        return parsed.token || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  getExplorerUrl(txHash: string, network: string = 'sepolia'): string {
    const baseUrl =
      network === 'sepolia'
        ? 'https://sepolia.etherscan.io'
        : network === 'mainnet'
        ? 'https://etherscan.io'
        : `https://${network}.etherscan.io`;
    return `${baseUrl}/tx/${txHash}`;
  }

  getContractExplorerUrl(contractAddress: string, network: string = 'sepolia'): string {
    const baseUrl =
      network === 'sepolia'
        ? 'https://sepolia.etherscan.io'
        : network === 'mainnet'
        ? 'https://etherscan.io'
        : `https://${network}.etherscan.io`;
    return `${baseUrl}/address/${contractAddress}`;
  }
}

export const blockchainService = new BlockchainService();

