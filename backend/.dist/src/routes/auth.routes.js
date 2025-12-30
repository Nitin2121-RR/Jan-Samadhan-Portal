"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.post('/signup', (0, asyncHandler_1.asyncHandler)(auth_controller_1.signup));
router.post('/login', (0, asyncHandler_1.asyncHandler)(auth_controller_1.login));
router.post('/forgot-password', (0, asyncHandler_1.asyncHandler)(auth_controller_1.forgotPassword));
router.get('/me', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(auth_controller_1.getMe));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map