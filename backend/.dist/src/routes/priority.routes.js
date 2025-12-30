"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const priority_controller_1 = require("../controllers/priority.controller");
const router = (0, express_1.Router)();
// Get grievances sorted by priority (authority only)
router.get('/grievances', auth_1.authenticate, priority_controller_1.getGrievancesByPriority);
// Recalculate all priorities (authority only)
router.post('/recalculate-all', auth_1.authenticate, priority_controller_1.recalculateAllPriorities);
// Recalculate single grievance priority (authority only)
router.post('/recalculate/:id', auth_1.authenticate, priority_controller_1.recalculateGrievancePriority);
// Get priority breakdown for a grievance (public)
router.get('/:id/breakdown', priority_controller_1.getPriorityBreakdown);
exports.default = router;
//# sourceMappingURL=priority.routes.js.map