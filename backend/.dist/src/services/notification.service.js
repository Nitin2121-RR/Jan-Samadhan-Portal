"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyGrievanceAssigned = exports.notifyGrievanceStatusChange = exports.createNotification = void 0;
const database_1 = __importDefault(require("../config/database"));
const createNotification = async (userId, type, message) => {
    await database_1.default.notification.create({
        data: {
            userId,
            type,
            message,
        },
    });
};
exports.createNotification = createNotification;
const notifyGrievanceStatusChange = async (grievanceId, status, message) => {
    const grievance = await database_1.default.grievance.findUnique({
        where: { id: grievanceId },
        include: {
            user: true,
        },
    });
    if (!grievance)
        return;
    const notificationMessage = message || `Your grievance "${grievance.title}" status changed to ${status}`;
    await (0, exports.createNotification)(grievance.userId, 'grievance_status', notificationMessage);
};
exports.notifyGrievanceStatusChange = notifyGrievanceStatusChange;
const notifyGrievanceAssigned = async (grievanceId, assignedToId) => {
    const grievance = await database_1.default.grievance.findUnique({
        where: { id: grievanceId },
    });
    if (!grievance)
        return;
    await (0, exports.createNotification)(assignedToId, 'grievance_assigned', `New grievance "${grievance.title}" assigned to you`);
};
exports.notifyGrievanceAssigned = notifyGrievanceAssigned;
//# sourceMappingURL=notification.service.js.map