"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = exports.getMe = exports.login = exports.signup = void 0;
const zod_1 = require("zod");
const database_1 = __importDefault(require("../config/database"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    password: zod_1.z.string().min(6).max(100),
    name: zod_1.z.string().min(1).max(255),
    phone: zod_1.z.string().max(20).optional(),
    role: zod_1.z.enum(['citizen', 'authority']),
    address: zod_1.z.string().max(500).optional(),
    department: zod_1.z.string().max(255).optional(), // Legacy field
    position: zod_1.z.string().max(255).optional(),
    departmentId: zod_1.z.string().uuid().optional(), // New department relation
    authorityLevel: zod_1.z.enum(['director', 'nodal_officer', 'gro', 'field_officer']).optional(),
}).refine((data) => {
    if (data.role === 'citizen' && !data.address) {
        return false;
    }
    if (data.role === 'authority' && !data.departmentId) {
        return false;
    }
    return true;
}, {
    message: 'Citizen must provide address. Authority must provide departmentId.',
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
    password: zod_1.z.string().min(1).max(100),
});
const signup = async (req, res) => {
    const data = signupSchema.parse(req.body);
    // Check if user exists
    const existingUser = await database_1.default.user.findUnique({
        where: { email: data.email },
    });
    if (existingUser) {
        throw new errorHandler_1.AppError('User with this email already exists', 409);
    }
    // Hash password
    const hashedPassword = await (0, password_1.hashPassword)(data.password);
    // For authorities, get department name for legacy field
    let departmentName = null;
    if (data.role === 'authority' && data.departmentId) {
        const dept = await database_1.default.department.findUnique({
            where: { id: data.departmentId },
            select: { name: true },
        });
        departmentName = dept?.name || data.department || null;
    }
    // Create user
    const user = await database_1.default.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            name: data.name,
            phone: data.phone,
            role: data.role,
            address: data.role === 'citizen' ? data.address : null,
            department: data.role === 'authority' ? departmentName : null,
            position: data.role === 'authority' ? data.position : null,
            departmentId: data.role === 'authority' ? data.departmentId : null,
            authorityLevel: data.role === 'authority' ? data.authorityLevel || 'gro' : null,
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            address: true,
            department: true,
            position: true,
            departmentId: true,
            authorityLevel: true,
        },
    });
    // Generate token
    const token = (0, jwt_1.generateToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    res.status(201).json({
        user,
        token,
    });
};
exports.signup = signup;
const login = async (req, res) => {
    const data = loginSchema.parse(req.body);
    // Find user
    const user = await database_1.default.user.findUnique({
        where: { email: data.email },
    });
    if (!user) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    // Verify password
    const isValid = await (0, password_1.comparePassword)(data.password, user.password);
    if (!isValid) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    // Generate token
    const token = (0, jwt_1.generateToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    res.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            address: user.address,
            department: user.department,
            position: user.position,
            departmentId: user.departmentId,
            authorityLevel: user.authorityLevel,
        },
        token,
    });
};
exports.login = login;
const getMe = async (req, res) => {
    if (!req.user) {
        throw new errorHandler_1.AppError('Unauthorized', 401);
    }
    const user = await database_1.default.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            address: true,
            department: true,
            position: true,
            departmentId: true,
            authorityLevel: true,
            department_rel: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    category: true,
                },
            },
            createdAt: true,
        },
    });
    if (!user) {
        throw new errorHandler_1.AppError('User not found', 404);
    }
    res.json({ user });
};
exports.getMe = getMe;
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email().max(255),
});
const forgotPassword = async (req, res) => {
    const data = forgotPasswordSchema.parse(req.body);
    // Find user by email
    const user = await database_1.default.user.findUnique({
        where: { email: data.email },
    });
    // Always return success to prevent email enumeration attacks
    // In a real app, you would send an email with a reset link
    if (user) {
        // Generate a reset token (in production, store this and send via email)
        const resetToken = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
        // In production:
        // 1. Store resetToken hash in database with expiry
        // 2. Send email with reset link containing the token
        console.log(`Password reset requested for ${data.email}. Token: ${resetToken}`);
    }
    res.json({
        message: 'If an account exists with this email, you will receive password reset instructions.',
    });
};
exports.forgotPassword = forgotPassword;
//# sourceMappingURL=auth.controller.js.map