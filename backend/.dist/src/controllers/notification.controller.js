"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const getNotifications = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const { read, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const where = {
        userId: req.user.id,
    };
    if (read !== undefined) {
        where.read = read === 'true';
    }
    const [notifications, total, unreadCount] = await Promise.all([
        database_1.default.notification.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: {
                createdAt: 'desc',
            },
        }),
        database_1.default.notification.count({ where }),
        database_1.default.notification.count({
            where: {
                userId: req.user.id,
                read: false,
            },
        }),
    ]);
    res.json({
        notifications,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
        },
        unreadCount,
    });
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const { id } = req.params;
    const notification = await database_1.default.notification.findUnique({
        where: { id },
    });
    if (!notification) {
        throw new errorHandler_1.AppError('Notification not found', 404);
    }
    if (notification.userId !== req.user.id) {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    await database_1.default.notification.update({
        where: { id },
        data: { read: true },
    });
    res.json({ message: 'Notification marked as read' });
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    await database_1.default.notification.updateMany({
        where: {
            userId: req.user.id,
            read: false,
        },
        data: {
            read: true,
        },
    });
    res.json({ message: 'All notifications marked as read' });
};
exports.markAllAsRead = markAllAsRead;
const deleteNotification = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const { id } = req.params;
    const notification = await database_1.default.notification.findUnique({
        where: { id },
    });
    if (!notification) {
        throw new errorHandler_1.AppError('Notification not found', 404);
    }
    if (notification.userId !== req.user.id) {
        throw new errorHandler_1.AppError('Forbidden', 403);
    }
    await database_1.default.notification.delete({
        where: { id },
    });
    res.json({ message: 'Notification deleted' });
};
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notification.controller.js.map