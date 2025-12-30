import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import blockchainService from '../services/blockchain.service';
import { generateGrievanceHash } from '../utils/hash';

export const verifyGrievance = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const grievance = await prisma.grievance.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true },
      },
    },
  });

  if (!grievance) {
    throw new AppError('Grievance not found', 404);
  }

  // If grievance is already verified on chain, return success
  if (grievance.verifiedOnChain && grievance.blockchainTxHash) {
    res.json({
      verified: true,
      hash: grievance.blockchainHash,
      txHash: grievance.blockchainTxHash,
      contractAddress: blockchainService.getContractAddress(),
    });
    return;
  }

  // Check if blockchain service is available
  if (!blockchainService.isAvailable()) {
    res.json({
      verified: false,
      message: 'Blockchain service not available',
      hash: grievance.blockchainHash,
      txHash: null,
      contractAddress: blockchainService.getContractAddress(),
    });
    return;
  }

  // If grievance has a hash, verify it on blockchain
  if (grievance.blockchainHash) {
    const existsOnChain = await blockchainService.verifyGrievance(grievance.blockchainHash);

    if (existsOnChain) {
      // Update database to reflect verified status
      await prisma.grievance.update({
        where: { id },
        data: { verifiedOnChain: true },
      });

      res.json({
        verified: true,
        hash: grievance.blockchainHash,
        txHash: grievance.blockchainTxHash,
        contractAddress: blockchainService.getContractAddress(),
      });
      return;
    }
  }

  // Grievance not on blockchain yet - store it now
  try {
    // Use the backend signer address (contract requires non-zero address)
    const submitterAddress = blockchainService.getSignerAddress() || '0x0000000000000000000000000000000000000001';

    const result = await blockchainService.storeGrievanceHash(
      grievance.id,
      grievance.title,
      grievance.description,
      grievance.userId,
      submitterAddress,
      grievance.createdAt
    );

    if (result) {
      // Update grievance with blockchain data
      await prisma.grievance.update({
        where: { id },
        data: {
          blockchainHash: result.hash,
          blockchainTxHash: result.txHash,
          verifiedOnChain: true,
        },
      });

      res.json({
        verified: true,
        hash: result.hash,
        txHash: result.txHash,
        contractAddress: blockchainService.getContractAddress(),
      });
      return;
    }

    res.json({
      verified: false,
      message: 'Failed to store grievance on blockchain',
      hash: null,
      txHash: null,
      contractAddress: blockchainService.getContractAddress(),
    });
  } catch (error: any) {
    console.error('Blockchain verification error:', error);
    res.json({
      verified: false,
      message: error.message || 'Blockchain transaction failed',
      hash: grievance.blockchainHash,
      txHash: null,
      contractAddress: blockchainService.getContractAddress(),
    });
  }
};

export const getGrievanceHistory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const grievance = await prisma.grievance.findUnique({
    where: { id },
  });

  if (!grievance) {
    throw new AppError('Grievance not found', 404);
  }

  let onChainHistory: any[] = [];
  if (grievance.blockchainHash) {
    onChainHistory = await blockchainService.getGrievanceHistory(grievance.blockchainHash);
  }

  const dbHistory = await prisma.grievanceUpdate.findMany({
    where: { grievanceId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  res.json({
    onChainHistory: onChainHistory.map((item: any) => ({
      status: item.status,
      updater: item.updater,
      timestamp: new Date(Number(item.timestamp) * 1000).toISOString(),
      message: item.message,
    })),
    dbHistory: dbHistory.map((item) => ({
      id: item.id,
      status: item.status,
      message: item.message,
      user: item.user,
      timestamp: item.createdAt,
      txHash: item.blockchainTxHash,
    })),
  });
};

export const getContractAddress = async (req: Request, res: Response): Promise<void> => {
  const address = blockchainService.getContractAddress();

  res.json({
    contractAddress: address,
    network: process.env.BLOCKCHAIN_NETWORK || process.env.SEPOLIA_RPC_URL ? 'sepolia' : 'unknown',
    available: blockchainService.isAvailable(),
  });
};

export const getBlockchainStatus = async (req: Request, res: Response): Promise<void> => {
  res.json({
    available: blockchainService.isAvailable(),
    contractAddress: blockchainService.getContractAddress(),
    signerAddress: blockchainService.getSignerAddress(),
    eventListening: blockchainService.isEventListeningActive(),
    lastProcessedBlock: blockchainService.getLastProcessedBlock(),
    network: process.env.SEPOLIA_RPC_URL ? 'sepolia' : 'unknown',
    websocketEnabled: true,
  });
};

export const getPastEvents = async (req: Request, res: Response): Promise<void> => {
  // Default to last 10 blocks (free tier RPC limit)
  const lastBlock = blockchainService.getLastProcessedBlock();
  const { fromBlock = Math.max(0, lastBlock - 10), toBlock = 'latest', type = 'all' } = req.query;

  const from = parseInt(fromBlock as string, 10);
  const to = toBlock === 'latest' ? 'latest' : parseInt(toBlock as string, 10);

  // Enforce 10-block limit for free tier RPC
  const maxRange = 10;
  const effectiveTo = to === 'latest' ? lastBlock : to;
  const effectiveFrom = Math.max(from, effectiveTo - maxRange);

  let grievanceEvents: any[] = [];
  let statusEvents: any[] = [];

  try {
    if (type === 'all' || type === 'registered') {
      grievanceEvents = await blockchainService.getPastGrievanceRegisteredEvents(effectiveFrom, effectiveTo);
    }

    if (type === 'all' || type === 'status') {
      statusEvents = await blockchainService.getPastStatusUpdatedEvents(effectiveFrom, effectiveTo);
    }
  } catch (error) {
    console.error('Error querying past events:', error);
  }

  res.json({
    fromBlock: effectiveFrom,
    toBlock: effectiveTo,
    note: 'Limited to 10-block range due to RPC free tier. Real-time events use WebSocket.',
    grievanceRegisteredEvents: grievanceEvents,
    statusUpdatedEvents: statusEvents,
    totalEvents: grievanceEvents.length + statusEvents.length,
  });
};

