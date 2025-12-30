"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_controller_1 = require("../controllers/department.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public route - list all departments (for signup dropdown)
router.get('/', department_controller_1.getAllDepartments);
// Get department by ID with authorities
router.get('/:id', auth_1.authenticate, department_controller_1.getDepartmentById);
// Get authorities in a department (for reassignment)
router.get('/:id/authorities', auth_1.authenticate, department_controller_1.getDepartmentAuthorities);
// Get department by category (internal use for assignment)
router.get('/category/:category', auth_1.authenticate, department_controller_1.getDepartmentByCategory);
exports.default = router;
//# sourceMappingURL=department.routes.js.map