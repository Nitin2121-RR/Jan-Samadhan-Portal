"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPastEvents = exports.getBlockchainStatus = exports.getContractAddress = exports.getGrievanceHistory = exports.verifyGrievance = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const blockchain_service_1 = __importDefault(require("../services/blockchain.service"));
const verifyGrievance = async (req, res) => {
    const { id } = req.params;
    const grievance = await database_1.default.grievance.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true },
            },
        },
    });
    if (!grievance) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    // If grievance is already verified on chain, return success
    if (grievance.verifiedOnChain && grievance.blockchainTxHash) {
        res.json({
            verified: true,
            hash: grievance.blockchainHash,
            txHash: grievance.blockchainTxHash,
            contractAddress: blockchain_service_1.default.getContractAddress(),
        });
        return;
    }
    // Check if blockchain service is available
    if (!blockchain_service_1.default.isAvailable()) {
        res.json({
            verified: false,
            message: 'Blockchain service not available',
            hash: grievance.blockchainHash,
            txHash: null,
            contractAddress: blockchain_service_1.default.getContractAddress(),
        });
        return;
    }
    // If grievance has a hash, verify it on blockchain
    if (grievance.blockchainHash) {
        const existsOnChain = await blockchain_service_1.default.verifyGrievance(grievance.blockchainHash);
        if (existsOnChain) {
            // Update database to reflect verified status
            await database_1.default.grievance.update({
                where: { id },
                data: { verifiedOnChain: true },
            });
            res.json({
                verified: true,
                hash: grievance.blockchainHash,
                txHash: grievance.blockchainTxHash,
                contractAddress: blockchain_service_1.default.getContractAddress(),
            });
            return;
        }
    }
    // Grievance not on blockchain yet - store it now
    try {
        // Use the backend signer address (contract requires non-zero address)
        const submitterAddress = blockchain_service_1.default.getSignerAddress() || '0x0000000000000000000000000000000000000001';
        const result = await blockchain_service_1.default.storeGrievanceHash(grievance.id, grievance.title, grievance.description, grievance.userId, submitterAddress, grievance.createdAt);
        if (result) {
            // Update grievance with blockchain data
            await database_1.default.grievance.update({
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
                contractAddress: blockchain_service_1.default.getContractAddress(),
            });
            return;
        }
        res.json({
            verified: false,
            message: 'Failed to store grievance on blockchain',
            hash: null,
            txHash: null,
            contractAddress: blockchain_service_1.default.getContractAddress(),
        });
    }
    catch (error) {
        console.error('Blockchain verification error:', error);
        res.json({
            verified: false,
            message: error.message || 'Blockchain transaction failed',
            hash: grievance.blockchainHash,
            txHash: null,
            contractAddress: blockchain_service_1.default.getContractAddress(),
        });
    }
};
exports.verifyGrievance = verifyGrievance;
const getGrievanceHistory = async (req, res) => {
    const { id } = req.params;
    const grievance = await database_1.default.grievance.findUnique({
        where: { id },
    });
    if (!grievance) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    let onChainHistory = [];
    if (grievance.blockchainHash) {
        onChainHistory = await blockchain_service_1.default.getGrievanceHistory(grievance.blockchainHash);
    }
    const dbHistory = await database_1.default.grievanceUpdate.findMany({
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
        onChainHistory: onChainHistory.map((item) => ({
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
exports.getGrievanceHistory = getGrievanceHistory;
const getContractAddress = async (req, res) => {
    const address = blockchain_service_1.default.getContractAddress();
    res.json({
        contractAddress: address,
        network: process.env.BLOCKCHAIN_NETWORK || process.env.SEPOLIA_RPC_URL ? 'sepolia' : 'unknown',
        available: blockchain_service_1.default.isAvailable(),
    });
};
exports.getContractAddress = getContractAddress;
const getBlockchainStatus = async (req, res) => {
    res.json({
        available: blockchain_service_1.default.isAvailable(),
        contractAddress: blockchain_service_1.default.getContractAddress(),
        signerAddress: blockchain_service_1.default.getSignerAddress(),
        eventListening: blockchain_service_1.default.isEventListeningActive(),
        lastProcessedBlock: blockchain_service_1.default.getLastProcessedBlock(),
        network: process.env.SEPOLIA_RPC_URL ? 'sepolia' : 'unknown',
        websocketEnabled: true,
    });
};
exports.getBlockchainStatus = getBlockchainStatus;
const getPastEvents = async (req, res) => {
    // Default to last 10 blocks (free tier RPC limit)
    const lastBlock = blockchain_service_1.default.getLastProcessedBlock();
    const { fromBlock = Math.max(0, lastBlock - 10), toBlock = 'latest', type = 'all' } = req.query;
    const from = parseInt(fromBlock, 10);
    const to = toBlock === 'latest' ? 'latest' : parseInt(toBlock, 10);
    // Enforce 10-block limit for free tier RPC
    const maxRange = 10;
    const effectiveTo = to === 'latest' ? lastBlock : to;
    const effectiveFrom = Math.max(from, effectiveTo - maxRange);
    let grievanceEvents = [];
    let statusEvents = [];
    try {
        if (type === 'all' || type === 'registered') {
            grievanceEvents = await blockchain_service_1.default.getPastGrievanceRegisteredEvents(effectiveFrom, effectiveTo);
        }
        if (type === 'all' || type === 'status') {
            statusEvents = await blockchain_service_1.default.getPastStatusUpdatedEvents(effectiveFrom, effectiveTo);
        }
    }
    catch (error) {
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
exports.getPastEvents = getPastEvents;
//# sourceMappingURL=blockchain.controller.js.map