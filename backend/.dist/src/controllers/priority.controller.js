"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGrievancesByPriority = exports.getPriorityBreakdown = exports.recalculateGrievancePriority = exports.recalculateAllPriorities = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const priority_service_1 = __importDefault(require("../services/priority.service"));
/**
 * Recalculate priority for all unresolved grievances
 * POST /api/priority/recalculate-all
 */
const recalculateAllPriorities = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const result = await priority_service_1.default.recalculateAllPriorities();
    res.json({
        message: 'Priority recalculation complete',
        ...result,
    });
};
exports.recalculateAllPriorities = recalculateAllPriorities;
/**
 * Recalculate priority for a specific grievance
 * POST /api/priority/recalculate/:id
 */
const recalculateGrievancePriority = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const { id } = req.params;
    const newScore = await priority_service_1.default.recalculateGrievancePriority(id);
    res.json({
        grievanceId: id,
        newPriorityScore: newScore,
    });
};
exports.recalculateGrievancePriority = recalculateGrievancePriority;
/**
 * Get priority breakdown for a grievance
 * GET /api/priority/:id/breakdown
 */
const getPriorityBreakdown = async (req, res) => {
    const { id } = req.params;
    const breakdown = await priority_service_1.default.getPriorityBreakdown(id);
    if (!breakdown) {
        throw new errorHandler_1.AppError('Grievance not found', 404);
    }
    res.json(breakdown);
};
exports.getPriorityBreakdown = getPriorityBreakdown;
/**
 * Get grievances sorted by priority for authority dashboard
 * GET /api/priority/grievances
 */
const getGrievancesByPriority = async (req, res) => {
    if (!req.user || req.user.role !== 'authority') {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    const { department, status, limit, offset } = req.query;
    const grievances = await priority_service_1.default.getGrievancesByPriority({
        assignedToId: req.user.id,
        department: department,
        status: status,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
    });
    res.json({ grievances });
};
exports.getGrievancesByPriority = getGrievancesByPriority;
//# sourceMappingURL=priority.controller.js.map