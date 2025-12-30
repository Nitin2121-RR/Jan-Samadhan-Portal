"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/profile', (0, asyncHandler_1.asyncHandler)(user_controller_1.getProfile));
router.patch('/profile', (0, asyncHandler_1.asyncHandler)(user_controller_1.updateProfile));
exports.default = router;
//# sourceMappingURL=user.routes.js.map