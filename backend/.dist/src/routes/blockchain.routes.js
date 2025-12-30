"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blockchain_controller_1 = require("../controllers/blockchain.controller");
const router = (0, express_1.Router)();
// Public endpoints
router.get('/contract-address', blockchain_controller_1.getContractAddress);
router.get('/status', blockchain_controller_1.getBlockchainStatus);
router.get('/events', blockchain_controller_1.getPastEvents);
router.get('/grievance/:id/history', blockchain_controller_1.getGrievanceHistory);
router.post('/verify-grievance/:id', blockchain_controller_1.verifyGrievance);
exports.default = router;
//# sourceMappingURL=blockchain.routes.js.map