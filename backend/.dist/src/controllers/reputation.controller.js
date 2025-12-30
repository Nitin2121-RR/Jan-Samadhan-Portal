"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnChainLeaderboard = exports.submitRating = exports.getLeaderboard = exports.getAuthorityReputation = exports.getReputationStatus = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const reputation_service_1 = __importDefault(require("../services/reputation.service"));
/**
 * Get reputation status and contract info
 */
const getReputationStatus = async (req, res) => {
    const authorityCount = await reputation_service_1.default.getRegisteredAuthorityCount();
    res.json({
        available: reputation_service_1.default.isAvailable(),
        contractAddress: reputation_service_1.default.getContractAddress(),
        registeredAuthorities: authorityCount,
        network: process.env.SEPOLIA_RPC_URL ? 'sepolia' : 'unknown',
    });
};
exports.getReputationStatus = getReputationStatus;
/**
 * Get reputation score and metrics for an authority
 */
const getAuthorityReputation = async (req, res) => {
    const { authorityId } = req.params;
    // Get authority from database
    const authority = await database_1.default.user.findUnique({
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
        throw new errorHandler_1.AppError('Authority not found', 404);
    }
    // If authority has wallet address, get on-chain reputation
    let onChainReputation = null;
    let onChainMetrics = null;
    if (authority.walletAddress && reputation_service_1.default.isAvailable()) {
        onChainReputation = await reputation_service_1.default.getAuthorityReputation(authority.walletAddress);
        onChainMetrics = await reputation_service_1.default.getAuthorityMetrics(authority.walletAddress);
    }
    // Calculate off-chain metrics from database
    const assignedCount = await database_1.default.grievance.count({
        where: { assignedToId: authorityId },
    });
    const resolvedCount = await database_1.default.grievance.count({
        where: {
            assignedToId: authorityId,
            status: 'resolved',
        },
    });
    const escalatedCount = await database_1.default.grievance.count({
        where: {
            assignedToId: authorityId,
            isEscalated: true,
        },
    });
    // Calculate average response time from updates
    const updates = await database_1.default.grievanceUpdate.findMany({
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
    const grievanceFirstResponses = new Map();
    updates.forEach((update) => {
        if (!grievanceFirstResponses.has(update.grievanceId)) {
            grievanceFirstResponses.set(update.grievanceId, update.createdAt);
        }
    });
    let avgResponseTimeHours = 0;
    if (grievanceFirstResponses.size > 0) {
        const responseTimes = [];
        for (const [grievanceId, responseTime] of grievanceFirstResponses) {
            const grievance = await database_1.default.grievance.findUnique({
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
exports.getAuthorityReputation = getAuthorityReputation;
/**
 * Get leaderboard of top authorities
 */
const getLeaderboard = async (req, res) => {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit, 10) || 10;
    // Get authorities from database with their stats
    const authorities = await database_1.default.user.findMany({
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
    const leaderboard = await Promise.all(authorities.map(async (authority) => {
        const resolvedCount = await database_1.default.grievance.count({
            where: {
                assignedToId: authority.id,
                status: 'resolved',
            },
        });
        const escalatedCount = await database_1.default.grievance.count({
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
        if (authority.walletAddress && reputation_service_1.default.isAvailable()) {
            onChainScore = await reputation_service_1.default.getReputationScore(authority.walletAddress);
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
    }));
    // Sort by score descending
    leaderboard.sort((a, b) => (b.onChainScore || b.score) - (a.onChainScore || a.score));
    res.json({
        leaderboard: leaderboard.slice(0, limitNum),
        total: leaderboard.length,
    });
};
exports.getLeaderboard = getLeaderboard;
/**
 * Submit a rating for a resolved grievance
 */
const submitRating = async (req, res) => {
    const { grievanceId } = req.params;
    const { isPositive } = req.body;
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    // Get grievance
    const grievance = await database_1.default.grievance.findUnique({
        where: { id: grievanceId },
        include: {
            assignedTo: {
                select: { walletAddress: true },
            },
        },
    });
    if (!grievance) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    if (grievance.userId !== req.user.id) {
        throw new errorHandler_1.AppError('Only the grievance submitter can rate', 403);
    }
    if (grievance.status !== 'resolved') {
        throw new errorHandler_1.AppError('Can only rate resolved grievances', 400);
    }
    // Submit on-chain rating if available
    let txHash = null;
    if (grievance.blockchainHash && grievance.assignedTo?.walletAddress && reputation_service_1.default.isAvailable()) {
        txHash = await reputation_service_1.default.submitRating(grievance.blockchainHash, isPositive);
    }
    // Store rating in database
    // Note: You might want to create a Rating model for this
    // For now, we'll create a grievance update
    await database_1.default.grievanceUpdate.create({
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
exports.submitRating = submitRating;
/**
 * Get on-chain top authorities
 */
const getOnChainLeaderboard = async (req, res) => {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit, 10) || 10;
    if (!reputation_service_1.default.isAvailable()) {
        res.json({
            available: false,
            leaderboard: [],
            message: 'Reputation contract not available',
        });
        return;
    }
    const { addresses, scores } = await reputation_service_1.default.getTopAuthorities(limitNum);
    // Map wallet addresses to user names
    const leaderboard = await Promise.all(addresses.map(async (address, index) => {
        const user = await database_1.default.user.findFirst({
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
    }));
    res.json({
        available: true,
        leaderboard,
        contractAddress: reputation_service_1.default.getContractAddress(),
    });
};
exports.getOnChainLeaderboard = getOnChainLeaderboard;
/**
 * Helper function to calculate score from database metrics
 */
function calculateDbScore(resolved, assigned, escalated, avgResponseHours) {
    if (assigned === 0)
        return 500; // Default score
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
//# sourceMappingURL=reputation.controller.js.map