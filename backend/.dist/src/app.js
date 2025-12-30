"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("./config/env"));
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const grievance_routes_1 = __importDefault(require("./routes/grievance.routes"));
const authority_routes_1 = __importDefault(require("./routes/authority.routes"));
const file_routes_1 = __importDefault(require("./routes/file.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const blockchain_routes_1 = __importDefault(require("./routes/blockchain.routes"));
const priority_routes_1 = __importDefault(require("./routes/priority.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const reputation_routes_1 = __importDefault(require("./routes/reputation.routes"));
const app = (0, express_1.default)();
// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});
// CORS configuration
app.use((0, cors_1.default)({
    origin: env_1.default.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve uploaded files
app.use('/files', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'jan-samadhan-backend',
        environment: process.env.NODE_ENV || 'development'
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/grievances', grievance_routes_1.default);
app.use('/api/authority', authority_routes_1.default);
app.use('/api/files', file_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.use('/api/blockchain', blockchain_routes_1.default);
app.use('/api/priority', priority_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/reputation', reputation_routes_1.default);
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map