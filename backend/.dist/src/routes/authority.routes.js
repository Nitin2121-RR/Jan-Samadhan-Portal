"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authority_controller_1 = require("../controllers/authority.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication and authority role
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('authority'));
router.get('/dashboard', authority_controller_1.getDashboard);
router.get('/analytics', authority_controller_1.getAnalytics);
router.post('/grievances/:id/acknowledge', authority_controller_1.acknowledgeGrievance);
router.post('/grievances/:id/assign', authority_controller_1.assignGrievance);
router.post('/grievances/:id/reassign', authority_controller_1.reassignGrievance);
router.patch('/grievances/:id/status', authority_controller_1.updateStatus);
exports.default = router;
//# sourceMappingURL=authority.routes.js.map