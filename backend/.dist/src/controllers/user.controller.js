"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const zod_1 = require("zod");
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const password_1 = require("../utils/password");
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    phone: zod_1.z.string().nullable().optional(),
    address: zod_1.z.string().nullable().optional(),
    department: zod_1.z.string().nullable().optional(),
    position: zod_1.z.string().nullable().optional(),
    password: zod_1.z.string().min(6).optional(),
});
const getProfile = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const user = await database_1.default.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            address: true,
            department: true,
            position: true,
            createdAt: true,
            _count: {
                select: {
                    grievances: true,
                },
            },
        },
    });
    if (!user) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    // Calculate stats for citizens
    let stats = {
        reported: 0,
        resolved: 0,
        upvotes: 0,
    };
    if (user.role === 'citizen') {
        const [reportedCount, resolvedCount, upvotesCount] = await Promise.all([
            database_1.default.grievance.count({
                where: { userId: user.id },
            }),
            database_1.default.grievance.count({
                where: { userId: user.id, status: 'resolved' },
            }),
            database_1.default.upvote.count({
                where: {
                    grievance: {
                        userId: user.id,
                    },
                },
            }),
        ]);
        stats = {
            reported: reportedCount,
            resolved: resolvedCount,
            upvotes: upvotesCount,
        };
    }
    res.json({ user, stats });
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const data = updateProfileSchema.parse(req.body);
    const updateData = {};
    if (data.name !== undefined)
        updateData.name = data.name;
    if (data.phone !== undefined)
        updateData.phone = data.phone;
    if (data.address !== undefined)
        updateData.address = data.address;
    if (data.department !== undefined)
        updateData.department = data.department;
    if (data.position !== undefined)
        updateData.position = data.position;
    if (data.password) {
        updateData.password = await (0, password_1.hashPassword)(data.password);
    }
    const user = await database_1.default.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            address: true,
            department: true,
            position: true,
            createdAt: true,
        },
    });
    res.json({ user });
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=user.controller.js.map