import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import reputationService from '../services/reputation.service';

/**
 * Get reputation status and contract info
 */
export const getReputationStatus = async (req: Request, res: Response): Promise<void> => {
  const authorityCount = await reputationService.getRegisteredAuthorityCount();

  res.json({
    available: reputationService.isAvailable(),
    contractAddress: reputationService.getContractAddress(),
    registeredAuthorities: authorityCount,
    network: process.env.SEPOLIA_RPC_URL ? 'sepolia' : 'unknown',
  });
};

/**
 * Get reputation score and metrics for an authority
 */
export const getAuthorityReputation = async (req: Request, res: Response): Promise<void> => {
  const { authorityId } = req.params;

  // Get authority from database
  const authority = await prisma.user.findUnique({
    where: { id: authorityId },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      position: true,
      walletAddress: true,
    },
  });

  if (!authority) {
    throw new AppError('Authority not found', 404);
  }

  // If authority has wallet address, get on-chain reputation
  let onChainReputation = null;
  let onChainMetrics = null;

  if (authority.walletAddress && reputationService.isAvailable()) {
    onChainReputation = await reputationService.getAuthorityReputation(authority.walletAddress);
    onChainMetrics = await reputationService.getAuthorityMetrics(authority.walletAddress);
  }

  // Calculate off-chain metrics from database
  const assignedCount = await prisma.grievance.count({
    where: { assignedToId: authorityId },
  });

  const resolvedCount = await prisma.grievance.count({
    where: {
      assignedToId: authorityId,
      status: 'resolved',
    },
  });

  const escalatedCount = await prisma.grievance.count({
    where: {
      assignedToId: authorityId,
      isEscalated: true,
    },
  });

  // Calculate average response time from updates
  const updates = await prisma.grievanceUpdate.findMany({
    where: {
      userId: authorityId,
    },
    include: {
      grievance: {
        select: { createdAt: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get first response times
  const grievanceFirstResponses = new Map<string, Date>();
  updates.forEach((update) => {
    if (!grievanceFirstResponses.has(update.grievanceId)) {
      grievanceFirstResponses.set(update.grievanceId, update.createdAt);
    }
  });

  let avgResponseTimeHours = 0;
  if (grievanceFirstResponses.size > 0) {
    const responseTimes: number[] = [];
    for (const [grievanceId, responseTime] of grievanceFirstResponses) {
      const grievance = await prisma.grievance.findUnique({
        where: { id: grievanceId },
        select: { createdAt: true },
      });
      if (grievance) {
        const diffMs = responseTime.getTime() - grievance.createdAt.getTime();
        responseTimes.push(diffMs / (1000 * 60 * 60)); // Convert to hours
      }
    }
    if (responseTimes.length > 0) {
      avgResponseTimeHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
  }

  // Calculate resolution rate
  const resolutionRate = assignedCount > 0 ? (resolvedCount / assignedCount) * 100 : 0;

  // Calculate composite score (0-1000)
  const dbScore = calculateDbScore(resolvedCount, assignedCount, escalatedCount, avgResponseTimeHours);

  res.json({
    authority: {
      id: authority.id,
      name: authority.name,
      department: authority.department,
      position: authority.position,
      walletAddress: authority.walletAddress,
    },
    offChainMetrics: {
      grievancesAssigned: assignedCount,
      grievancesResolved: resolvedCount,
      grievancesEscalated: escalatedCount,
      resolutionRate: Math.round(resolutionRate),
      avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
      score: dbScore,
    },
    onChainMetrics: onChainMetrics,
    onChainReputation: onChainReputation,
  });
};

/**
 * Get leaderboard of top authorities
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  const { limit = '10' } = req.query;
  const limitNum = parseInt(limit as string, 10) || 10;

  // Get authorities from database with their stats
  const authorities = await prisma.user.findMany({
    where: {
      role: 'authority',
    },
    select: {
      id: true,
      name: true,
      department: true,
      position: true,
      walletAddress: true,
      _count: {
        select: {
          assignedGrievances: true,
        },
      },
    },
  });

  // Calculate scores for each authority
  const leaderboard = await Promise.all(
    authorities.map(async (authority) => {
      const resolvedCount = await prisma.grievance.count({
        where: {
          assignedToId: authority.id,
          status: 'resolved',
        },
      });

      const escalatedCount = await prisma.grievance.count({
        where: {
          assignedToId: authority.id,
          isEscalated: true,
        },
      });

      const assignedCount = authority._count.assignedGrievances;
      const resolutionRate = assignedCount > 0 ? (resolvedCount / assignedCount) * 100 : 0;

      // Calculate score
      const score = calculateDbScore(resolvedCount, assignedCount, escalatedCount, 12); // Assume 12h avg

      // Get on-chain score if available
      let onChainScore = null;
      if (authority.walletAddress && reputationService.isAvailable()) {
        onChainScore = await reputationService.getReputationScore(authority.walletAddress);
      }

      return {
        id: authority.id,
        name: authority.name,
        department: authority.department,
        position: authority.position,
        grievancesAssigned: assignedCount,
        grievancesResolved: resolvedCount,
        resolutionRate: Math.round(resolutionRate),
        score: score,
        onChainScore: onChainScore,
      };
    })
  );

  // Sort by score descending
  leaderboard.sort((a, b) => (b.onChainScore || b.score) - (a.onChainScore || a.score));

  res.json({
    leaderboard: leaderboard.slice(0, limitNum),
    total: leaderboard.length,
  });
};

/**
 * Submit a rating for a resolved grievance
 */
export const submitRating = async (req: AuthRequest, res: Response): Promise<void> => {
  const { grievanceId } = req.params;
  const { isPositive } = req.body;

  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  // Get grievance
  const grievance = await prisma.grievance.findUnique({
    where: { id: grievanceId },
    include: {
      assignedTo: {
        select: { walletAddress: true },
      },
    },
  });

  if (!grievance) {
    throw new AppError('Grievance not found', 404);
  }

  if (grievance.userId !== req.user.id) {
    throw new AppError('Only the grievance submitter can rate', 403);
  }

  if (grievance.status !== 'resolved') {
    throw new AppError('Can only rate resolved grievances', 400);
  }

  // Submit on-chain rating if available
  let txHash = null;
  if (grievance.blockchainHash && grievance.assignedTo?.walletAddress && reputationService.isAvailable()) {
    txHash = await reputationService.submitRating(grievance.blockchainHash, isPositive);
  }

  // Store rating in database
  // Note: You might want to create a Rating model for this
  // For now, we'll create a grievance update
  await prisma.grievanceUpdate.create({
    data: {
      grievanceId,
      userId: req.user.id,
      status: 'resolved',
      message: isPositive ? 'Citizen rated: Satisfied' : 'Citizen rated: Unsatisfied',
      blockchainTxHash: txHash,
    },
  });

  res.json({
    success: true,
    message: `Rating submitted: ${isPositive ? 'Positive' : 'Negative'}`,
    txHash,
  });
};

/**
 * Get on-chain top authorities
 */
export const getOnChainLeaderboard = async (req: Request, res: Response): Promise<void> => {
  const { limit = '10' } = req.query;
  const limitNum = parseInt(limit as string, 10) || 10;

  if (!reputationService.isAvailable()) {
    res.json({
      available: false,
      leaderboard: [],
      message: 'Reputation contract not available',
    });
    return;
  }

  const { addresses, scores } = await reputationService.getTopAuthorities(limitNum);

  // Map wallet addresses to user names
  const leaderboard = await Promise.all(
    addresses.map(async (address, index) => {
      const user = await prisma.user.findFirst({
        where: { walletAddress: address },
        select: {
          id: true,
          name: true,
          department: true,
          position: true,
        },
      });

      return {
        rank: index + 1,
        walletAddress: address,
        score: scores[index],
        user: user,
      };
    })
  );

  res.json({
    available: true,
    leaderboard,
    contractAddress: reputationService.getContractAddress(),
  });
};

/**
 * Helper function to calculate score from database metrics
 */
function calculateDbScore(
  resolved: number,
  assigned: number,
  escalated: number,
  avgResponseHours: number
): number {
  if (assigned === 0) return 500; // Default score

  // Resolution rate (0-400 points)
  const resolutionRate = (resolved * 400) / assigned;

  // Non-escalation rate (0-200 points)
  const nonEscalated = assigned - escalated;
  const nonEscalationRate = (nonEscalated * 200) / assigned;

  // Response time score (0-200 points)
  // Target: 24 hours
  let responseScore = 200;
  if (avgResponseHours > 24) {
    const penalty = ((avgResponseHours - 24) * 200) / 24;
    responseScore = Math.max(0, 200 - penalty);
  }

  // Default satisfaction (100 points - neutral)
  const satisfactionScore = 100;

  const total = resolutionRate + nonEscalationRate + responseScore + satisfactionScore;
  return Math.min(1000, Math.round(total));
}
