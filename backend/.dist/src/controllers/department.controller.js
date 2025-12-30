"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepartmentByCategory = exports.getDepartmentAuthorities = exports.getDepartmentById = exports.getAllDepartments = void 0;
const database_1 = __importDefault(require("../config/database"));
// Get all departments
const getAllDepartments = async (_req, res) => {
    const departments = await database_1.default.department.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            code: true,
            name: true,
            category: true,
            description: true,
        },
    });
    res.json({ departments });
};
exports.getAllDepartments = getAllDepartments;
// Get department by ID with authorities
const getDepartmentById = async (req, res) => {
    const { id } = req.params;
    const department = await database_1.default.department.findUnique({
        where: { id },
        include: {
            authorities: {
                where: { role: 'authority' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    authorityLevel: true,
                    position: true,
                },
                orderBy: { authorityLevel: 'asc' },
            },
            _count: {
                select: { grievances: true },
            },
        },
    });
    if (!department) {
        res.status(404).json({ error: 'Department not found' });
        return;
    }
    res.json({ department });
};
exports.getDepartmentById = getDepartmentById;
// Get authorities in a department (for reassignment dropdown)
const getDepartmentAuthorities = async (req, res) => {
    const { id } = req.params;
    const authorities = await database_1.default.user.findMany({
        where: {
            departmentId: id,
            role: 'authority',
        },
        select: {
            id: true,
            name: true,
            email: true,
            authorityLevel: true,
            position: true,
        },
        orderBy: { authorityLevel: 'asc' },
    });
    res.json({ authorities });
};
exports.getDepartmentAuthorities = getDepartmentAuthorities;
// Get department by category (for AI assignment)
const getDepartmentByCategory = async (req, res) => {
    const { category } = req.params;
    const department = await database_1.default.department.findFirst({
        where: { category },
        include: {
            authorities: {
                where: {
                    role: 'authority',
                    authorityLevel: 'gro', // Prefer GROs for initial assignment
                },
                select: {
                    id: true,
                    name: true,
                },
                take: 1,
            },
        },
    });
    res.json({ department });
};
exports.getDepartmentByCategory = getDepartmentByCategory;
//# sourceMappingURL=department.controller.js.map