"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reassignGrievance = exports.getAnalytics = exports.updateStatus = exports.assignGrievance = exports.acknowledgeGrievance = exports.getDashboard = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const notification_service_1 = require("../services/notification.service");
const blockchain_service_1 = __importDefault(require("../services/blockchain.service"));
const priority_service_1 = __importDefault(require("../services/priority.service"));
const reputation_service_1 = __importDefault(require("../services/reputation.service"));
const getDashboard = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const { ward, departmentId: filterDeptId } = req.query;
    // Get authority's department to filter grievances
    const authority = await database_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { departmentId: true, authorityLevel: true },
    });
    const where = {};
    if (ward)
        where.ward = ward;
    // Filter by specific department if provided, otherwise use authority's department
    const deptIdToUse = filterDeptId || authority?.departmentId;
    // Filter by department or assigned to this authority
    if (deptIdToUse) {
        where.OR = [
            { departmentId: deptIdToUse },
            { assignedToId: req.user.id },
        ];
    }
    else {
        // If no department, show only assigned grievances
        where.assignedToId = req.user.id;
    }
    const [pendingCount, inProgressCount, escalatedCount, totalCount, grievances, categoryStats,] = await Promise.all([
        database_1.default.grievance.count({ where: { ...where, status: 'pending' } }),
        database_1.default.grievance.count({ where: { ...where, status: 'in_progress' } }),
        database_1.default.grievance.count({ where: { ...where, isEscalated: true } }),
        database_1.default.grievance.count({ where }),
        database_1.default.grievance.findMany({
            where,
            orderBy: {
                priorityScore: 'desc',
            },
            take: 50,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                files: {
                    take: 1,
                },
                _count: {
                    select: {
                        upvotes: true,
                    },
                },
            },
        }),
        database_1.default.grievance.groupBy({
            by: ['category'],
            where,
            _count: {
                id: true,
            },
        }),
    ]);
    // Calculate priority breakdown for each grievance
    const grievancesWithPriority = grievances.map((g) => {
        const hoursOld = (Date.now() - g.createdAt.getTime()) / (1000 * 60 * 60);
        const priorityBreakdown = priority_service_1.default.calculatePriority({
            severity: g.severity,
            upvotes: g._count.upvotes,
            hoursOld,
            category: g.category,
            status: g.status,
            isEscalated: g.isEscalated,
        });
        return {
            ...g,
            upvotes: g._count.upvotes,
            image: g.files[0]?.filepath || null,
            priorityBreakdown,
        };
    });
    // Sort by calculated priority score (highest first)
    grievancesWithPriority.sort((a, b) => b.priorityBreakdown.totalScore - a.priorityBreakdown.totalScore);
    // Count by urgency level
    const urgencyStats = {
        critical: grievancesWithPriority.filter(g => g.priorityBreakdown.urgencyLevel === 'critical').length,
        high: grievancesWithPriority.filter(g => g.priorityBreakdown.urgencyLevel === 'high').length,
        medium: grievancesWithPriority.filter(g => g.priorityBreakdown.urgencyLevel === 'medium').length,
        low: grievancesWithPriority.filter(g => g.priorityBreakdown.urgencyLevel === 'low').length,
    };
    res.json({
        stats: {
            pending: pendingCount,
            inProgress: inProgressCount,
            escalated: escalatedCount,
            total: totalCount,
            urgency: urgencyStats,
        },
        grievances: grievancesWithPriority,
        categoryStats: categoryStats.map((stat) => ({
            category: stat.category,
            count: stat._count.id,
            percentage: totalCount > 0 ? (stat._count.id / totalCount) * 100 : 0,
        })),
    });
};
exports.getDashboard = getDashboard;
const acknowledgeGrievance = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const { id } = req.params;
    const existingGrievance = await database_1.default.grievance.findUnique({
        where: { id },
    });
    if (!existingGrievance) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    const grievance = await database_1.default.grievance.update({
        where: { id },
        data: {
            status: 'acknowledged',
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    upvotes: true,
                },
            },
        },
    });
    // Create update record
    const update = await database_1.default.grievanceUpdate.create({
        data: {
            grievanceId: id,
            userId: req.user.id,
            status: 'acknowledged',
            message: 'Grievance acknowledged by authority',
        },
    });
    // Record on blockchain (async)
    if (existingGrievance.blockchainHash && blockchain_service_1.default.isAvailable()) {
        blockchain_service_1.default
            .updateGrievanceStatus(existingGrievance.blockchainHash, 'acknowledged', 'Grievance acknowledged by authority')
            .then(async (txHash) => {
            if (txHash) {
                await database_1.default.grievanceUpdate.update({
                    where: { id: update.id },
                    data: { blockchainTxHash: txHash },
                });
            }
        })
            .catch((error) => {
            console.error('Failed to update status on blockchain:', error);
        });
    }
    // Send notification
    await (0, notification_service_1.notifyGrievanceStatusChange)(id, 'acknowledged', 'Your grievance has been acknowledged');
    // Record first response on reputation system (async)
    if (existingGrievance.blockchainHash && reputation_service_1.default.isAvailable()) {
        reputation_service_1.default
            .recordFirstResponse(existingGrievance.blockchainHash)
            .catch((error) => {
            console.error('Failed to record first response on reputation system:', error);
        });
    }
    res.json({
        grievance: {
            ...grievance,
            upvotes: grievance._count.upvotes,
            verifiedOnChain: grievance.verifiedOnChain,
            blockchainTxHash: grievance.blockchainTxHash,
            blockchainHash: grievance.blockchainHash,
        },
    });
};
exports.acknowledgeGrievance = acknowledgeGrievance;
const assignGrievance = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const { id } = req.params;
    const { assignedToId } = req.body;
    if (!assignedToId) {
        throw new errorHandler_1.AppError('assignedToId is required', 400);
    }
    const existingGrievance = await database_1.default.grievance.findUnique({
        where: { id },
    });
    if (!existingGrievance) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    const grievance = await database_1.default.grievance.update({
        where: { id },
        data: {
            assignedToId,
            status: 'in_progress',
        },
        include: {
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    upvotes: true,
                },
            },
        },
    });
    // Create update record
    const update = await database_1.default.grievanceUpdate.create({
        data: {
            grievanceId: id,
            userId: req.user.id,
            status: 'in_progress',
            message: `Assigned to ${grievance.assignedTo?.name || 'authority'}`,
        },
    });
    // Record on blockchain (async)
    if (existingGrievance.blockchainHash && blockchain_service_1.default.isAvailable()) {
        blockchain_service_1.default
            .updateGrievanceStatus(existingGrievance.blockchainHash, 'in_progress', `Assigned to ${grievance.assignedTo?.name || 'authority'}`)
            .then(async (txHash) => {
            if (txHash) {
                await database_1.default.grievanceUpdate.update({
                    where: { id: update.id },
                    data: { blockchainTxHash: txHash },
                });
            }
        })
            .catch((error) => {
            console.error('Failed to update status on blockchain:', error);
        });
    }
    // Send notifications
    await (0, notification_service_1.notifyGrievanceStatusChange)(id, 'in_progress', 'Your grievance is now in progress');
    if (assignedToId) {
        await (0, notification_service_1.notifyGrievanceAssigned)(id, assignedToId);
    }
    // Record assignment on reputation system (async)
    if (existingGrievance.blockchainHash && reputation_service_1.default.isAvailable()) {
        const assignee = await database_1.default.user.findUnique({
            where: { id: assignedToId },
            select: { walletAddress: true },
        });
        if (assignee?.walletAddress) {
            reputation_service_1.default
                .recordAssignment(existingGrievance.blockchainHash, assignee.walletAddress)
                .catch((error) => {
                console.error('Failed to record assignment on reputation system:', error);
            });
        }
    }
    res.json({
        grievance: {
            ...grievance,
            upvotes: grievance._count.upvotes,
            verifiedOnChain: grievance.verifiedOnChain,
            blockchainTxHash: grievance.blockchainTxHash,
            blockchainHash: grievance.blockchainHash,
        },
    });
};
exports.assignGrievance = assignGrievance;
const updateStatus = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const { id } = req.params;
    const { status, message } = req.body;
    if (!status) {
        throw new errorHandler_1.AppError('status is required', 400);
    }
    const existingGrievance = await database_1.default.grievance.findUnique({
        where: { id },
    });
    if (!existingGrievance) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    const updateData = { status };
    if (status === 'resolved') {
        updateData.resolvedAt = new Date();
    }
    const grievance = await database_1.default.grievance.update({
        where: { id },
        data: updateData,
        include: {
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    upvotes: true,
                },
            },
        },
    });
    // Create update record
    const update = await database_1.default.grievanceUpdate.create({
        data: {
            grievanceId: id,
            userId: req.user.id,
            status,
            message: message || `Status updated to ${status}`,
        },
    });
    // Record on blockchain (async)
    if (existingGrievance.blockchainHash && blockchain_service_1.default.isAvailable()) {
        blockchain_service_1.default
            .updateGrievanceStatus(existingGrievance.blockchainHash, status, message || `Status updated to ${status}`)
            .then(async (txHash) => {
            if (txHash) {
                await database_1.default.grievanceUpdate.update({
                    where: { id: update.id },
                    data: { blockchainTxHash: txHash },
                });
            }
        })
            .catch((error) => {
            console.error('Failed to update status on blockchain:', error);
        });
    }
    // Send notification
    await (0, notification_service_1.notifyGrievanceStatusChange)(id, status, message);
    // Record resolution on reputation system (async)
    if (status === 'resolved' && existingGrievance.blockchainHash && reputation_service_1.default.isAvailable()) {
        reputation_service_1.default
            .recordResolution(existingGrievance.blockchainHash)
            .catch((error) => {
            console.error('Failed to record resolution on reputation system:', error);
        });
    }
    res.json({
        grievance: {
            ...grievance,
            upvotes: grievance._count.upvotes,
            verifiedOnChain: grievance.verifiedOnChain,
            blockchainTxHash: grievance.blockchainTxHash,
            blockchainHash: grievance.blockchainHash,
        },
    });
};
exports.updateStatus = updateStatus;
const getAnalytics = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const { ward, startDate, endDate } = req.query;
    const where = {};
    if (ward)
        where.ward = ward;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate)
            where.createdAt.gte = new Date(startDate);
        if (endDate)
            where.createdAt.lte = new Date(endDate);
    }
    const [totalGrievances, resolvedGrievances, avgResolutionTime, categoryBreakdown, statusBreakdown,] = await Promise.all([
        database_1.default.grievance.count({ where }),
        database_1.default.grievance.count({
            where: { ...where, status: 'resolved' },
        }),
        database_1.default.grievance.aggregate({
            where: { ...where, status: 'resolved', resolvedAt: { not: null } },
            _avg: {
            // This would need a computed field for resolution time
            // For now, return mock data
            },
        }),
        database_1.default.grievance.groupBy({
            by: ['category'],
            where,
            _count: {
                id: true,
            },
        }),
        database_1.default.grievance.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true,
            },
        }),
    ]);
    res.json({
        totalGrievances,
        resolvedGrievances,
        resolutionRate: totalGrievances > 0 ? (resolvedGrievances / totalGrievances) * 100 : 0,
        categoryBreakdown: categoryBreakdown.map((item) => ({
            category: item.category,
            count: item._count.id,
        })),
        statusBreakdown: statusBreakdown.map((item) => ({
            status: item.status,
            count: item._count.id,
        })),
    });
};
exports.getAnalytics = getAnalytics;
const reassignGrievance = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const { id } = req.params;
    const { assignedToId, reason } = req.body;
    if (!assignedToId) {
        throw new errorHandler_1.AppError('assignedToId is required', 400);
    }
    // Get current authority's info
    const currentAuthority = await database_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { departmentId: true, authorityLevel: true, name: true },
    });
    // Get grievance with current assignee
    const existingGrievance = await database_1.default.grievance.findUnique({
        where: { id },
        include: {
            assignedTo: {
                select: { id: true, name: true, departmentId: true },
            },
        },
    });
    if (!existingGrievance) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    // Check if new assignee exists and is an authority
    const newAssignee = await database_1.default.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, name: true, departmentId: true, role: true, authorityLevel: true, walletAddress: true },
    });
    if (!newAssignee || newAssignee.role !== 'authority') {
        throw new errorHandler_1.AppError('Invalid assignee - must be an authority', 400);
    }
    // Permission check: only allow reassignment within same department
    // unless the current user is a nodal_officer or director
    const canReassignAcrossDepts = ['nodal_officer', 'director'].includes(currentAuthority?.authorityLevel || '');
    if (!canReassignAcrossDepts) {
        // Check if reassigning within same department
        if (existingGrievance.departmentId && newAssignee.departmentId !== existingGrievance.departmentId) {
            throw new errorHandler_1.AppError('Can only reassign to authorities within the same department', 403);
        }
    }
    const previousAssigneeName = existingGrievance.assignedTo?.name || 'Unassigned';
    // Update the grievance
    const grievance = await database_1.default.grievance.update({
        where: { id },
        data: {
            assignedToId,
        },
        include: {
            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    authorityLevel: true,
                },
            },
            department_rel: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            _count: {
                select: {
                    upvotes: true,
                },
            },
        },
    });
    // Create update record with reassignment details
    const message = reason
        ? `Reassigned from ${previousAssigneeName} to ${newAssignee.name}: ${reason}`
        : `Reassigned from ${previousAssigneeName} to ${newAssignee.name}`;
    const update = await database_1.default.grievanceUpdate.create({
        data: {
            grievanceId: id,
            userId: req.user.id,
            status: existingGrievance.status,
            message,
        },
    });
    // Record on blockchain (async)
    if (existingGrievance.blockchainHash && blockchain_service_1.default.isAvailable()) {
        blockchain_service_1.default
            .updateGrievanceStatus(existingGrievance.blockchainHash, existingGrievance.status, message)
            .then(async (txHash) => {
            if (txHash) {
                await database_1.default.grievanceUpdate.update({
                    where: { id: update.id },
                    data: { blockchainTxHash: txHash },
                });
            }
        })
            .catch((error) => {
            console.error('Failed to record reassignment on blockchain:', error);
        });
    }
    // Notify new assignee
    await (0, notification_service_1.notifyGrievanceAssigned)(id, assignedToId);
    // Record escalation on reputation system (async)
    if (existingGrievance.blockchainHash && reputation_service_1.default.isAvailable() && newAssignee.walletAddress) {
        reputation_service_1.default
            .recordEscalation(existingGrievance.blockchainHash, newAssignee.walletAddress)
            .catch((error) => {
            console.error('Failed to record escalation on reputation system:', error);
        });
    }
    res.json({
        grievance: {
            ...grievance,
            upvotes: grievance._count.upvotes,
            verifiedOnChain: grievance.verifiedOnChain,
            blockchainTxHash: grievance.blockchainTxHash,
            blockchainHash: grievance.blockchainHash,
        },
        reassignment: {
            from: previousAssigneeName,
            to: newAssignee.name,
            by: currentAuthority?.name,
            reason: reason || null,
        },
    });
};
exports.reassignGrievance = reassignGrievance;
//# sourceMappingURL=authority.controller.js.map