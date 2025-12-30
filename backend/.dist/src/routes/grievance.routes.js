"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const grievance_controller_1 = require("../controllers/grievance.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/community', grievance_controller_1.getCommunityFeed);
router.get('/my', auth_1.authenticate, grievance_controller_1.getMyGrievances);
router.get('/:id', grievance_controller_1.getGrievance);
router.get('/', grievance_controller_1.getGrievances);
router.post('/', auth_1.authenticate, grievance_controller_1.createGrievance);
router.patch('/:id', auth_1.authenticate, grievance_controller_1.updateGrievance);
router.post('/:id/upvote', auth_1.authenticate, grievance_controller_1.upvoteGrievance);
exports.default = router;
//# sourceMappingURL=grievance.routes.js.map