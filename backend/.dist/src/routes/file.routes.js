"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const file_controller_1 = require("../controllers/file.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/upload', auth_1.authenticate, file_controller_1.upload.single('file'), file_controller_1.uploadFile);
router.get('/:id', file_controller_1.getFile);
router.delete('/:id', auth_1.authenticate, file_controller_1.deleteFileById);
exports.default = router;
//# sourceMappingURL=file.routes.js.map