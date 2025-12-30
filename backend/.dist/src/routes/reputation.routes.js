"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reputation_controller_1 = require("../controllers/reputation.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public endpoints
router.get('/status', reputation_controller_1.getReputationStatus);
router.get('/leaderboard', reputation_controller_1.getLeaderboard);
router.get('/leaderboard/onchain', reputation_controller_1.getOnChainLeaderboard);
router.get('/authority/:authorityId', reputation_controller_1.getAuthorityReputation);
// Protected endpoints
router.post('/grievance/:grievanceId/rate', auth_1.authenticate, reputation_controller_1.submitRating);
exports.default = router;
//# sourceMappingURL=reputation.routes.js.map