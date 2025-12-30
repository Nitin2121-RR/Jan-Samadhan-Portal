"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const database_1 = __importDefault(require("./config/database"));
const blockchain_service_1 = __importDefault(require("./services/blockchain.service"));
const PORT = env_1.default.port;
// Create HTTP server
const httpServer = (0, http_1.createServer)(app_1.default);
// Initialize Socket.IO with CORS
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: env_1.default.frontendUrl || '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    path: '/socket.io',
});
exports.io = io;
// Track connected clients
let connectedClients = 0;
// Socket.IO connection handling
io.on('connection', (socket) => {
    connectedClients++;
    console.log(`🔌 Client connected: ${socket.id} (Total: ${connectedClients})`);
    // Allow clients to subscribe to specific grievance updates
    socket.on('subscribe:grievance', (grievanceId) => {
        socket.join(`grievance:${grievanceId}`);
        console.log(`📋 Client ${socket.id} subscribed to grievance:${grievanceId}`);
    });
    socket.on('unsubscribe:grievance', (grievanceId) => {
        socket.leave(`grievance:${grievanceId}`);
        console.log(`📋 Client ${socket.id} unsubscribed from grievance:${grievanceId}`);
    });
    // Allow clients to subscribe to all blockchain events
    socket.on('subscribe:blockchain', () => {
        socket.join('blockchain:events');
        console.log(`🔗 Client ${socket.id} subscribed to blockchain events`);
    });
    socket.on('unsubscribe:blockchain', () => {
        socket.leave('blockchain:events');
        console.log(`🔗 Client ${socket.id} unsubscribed from blockchain events`);
    });
    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`🔌 Client disconnected: ${socket.id} (Total: ${connectedClients})`);
    });
});
// Connect blockchain events to Socket.IO
blockchain_service_1.default.on('grievanceRegistered', (event) => {
    // Broadcast to all clients subscribed to blockchain events
    io.to('blockchain:events').emit('blockchain:grievanceRegistered', event);
    // Broadcast to clients subscribed to this specific grievance
    io.to(`grievance:${event.grievanceId}`).emit('grievance:confirmed', {
        grievanceId: event.grievanceId,
        blockchainHash: event.hash,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: event.timestamp,
    });
    console.log(`📢 Emitted grievanceRegistered event for ${event.grievanceId}`);
});
blockchain_service_1.default.on('statusUpdated', (event) => {
    // Broadcast to all clients subscribed to blockchain events
    io.to('blockchain:events').emit('blockchain:statusUpdated', event);
    // Find grievance ID from hash and broadcast to specific room
    // (In production, you might want to maintain a hash->grievanceId mapping)
    console.log(`📢 Emitted statusUpdated event: ${event.oldStatus} -> ${event.newStatus}`);
});
const server = httpServer.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${env_1.default.nodeEnv}`);
    console.log(`🔌 WebSocket server initialized`);
    console.log(`🌐 Frontend URL: ${env_1.default.frontendUrl}`);
    // Test database connection
    try {
        await database_1.default.$connect();
        console.log('✅ Database connected successfully');
        // Test a simple query
        const userCount = await database_1.default.user.count();
        console.log(`📊 Database health check: ${userCount} users in database`);
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        console.error('Database URL (masked):', env_1.default.databaseUrl.replace(/:[^:@]*@/, ':***@'));
        process.exit(1);
    }
    // Start blockchain event listeners
    if (blockchain_service_1.default.isAvailable()) {
        try {
            await blockchain_service_1.default.startEventListening();
            console.log('✅ Blockchain event listeners started');
        }
        catch (error) {
            console.error('⚠️ Failed to start blockchain event listeners:', error);
        }
    }
    else {
        console.log('⚠️ Blockchain service not available, event listening disabled');
    }
    console.log('🎉 Server startup completed successfully');
});
// Handle server errors (e.g., port already in use)
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`   Please either:`);
        console.error(`   1. Stop the process using port ${PORT}`);
        console.error(`   2. Change the PORT in your environment variables`);
        console.error(`\n   To find the process using port ${PORT}, run:`);
        console.error(`   lsof -ti:${PORT} | xargs kill -9`);
    }
    else {
        console.error('❌ Server error:', error);
    }
    process.exit(1);
});
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    // Stop blockchain event listeners
    await blockchain_service_1.default.stopEventListening();
    // Close Socket.IO connections
    io.close();
    // Disconnect from database
    await database_1.default.$disconnect();
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
//# sourceMappingURL=server.js.map