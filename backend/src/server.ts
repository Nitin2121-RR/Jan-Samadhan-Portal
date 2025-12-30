import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import config from './config/env';
import prisma from './config/database';
import blockchainService from './services/blockchain.service';
import type { BlockchainGrievanceRegisteredEvent, BlockchainStatusUpdatedEvent } from './services/blockchain.service';

const PORT = config.port;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigin || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket.io',
});

// Track connected clients
let connectedClients = 0;

// Socket.IO connection handling
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`🔌 Client connected: ${socket.id} (Total: ${connectedClients})`);

  // Allow clients to subscribe to specific grievance updates
  socket.on('subscribe:grievance', (grievanceId: string) => {
    socket.join(`grievance:${grievanceId}`);
    console.log(`📋 Client ${socket.id} subscribed to grievance:${grievanceId}`);
  });

  socket.on('unsubscribe:grievance', (grievanceId: string) => {
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
blockchainService.on('grievanceRegistered', (event: BlockchainGrievanceRegisteredEvent) => {
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

blockchainService.on('statusUpdated', (event: BlockchainStatusUpdatedEvent) => {
  // Broadcast to all clients subscribed to blockchain events
  io.to('blockchain:events').emit('blockchain:statusUpdated', event);

  // Find grievance ID from hash and broadcast to specific room
  // (In production, you might want to maintain a hash->grievanceId mapping)
  console.log(`📢 Emitted statusUpdated event: ${event.oldStatus} -> ${event.newStatus}`);
});

// Export io for use in controllers
export { io };

const server = httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔌 WebSocket server initialized`);

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Start blockchain event listeners
  if (blockchainService.isAvailable()) {
    try {
      await blockchainService.startEventListening();
    } catch (error) {
      console.error('⚠️ Failed to start blockchain event listeners:', error);
    }
  } else {
    console.log('⚠️ Blockchain service not available, event listening disabled');
  }
});

// Handle server errors (e.g., port already in use)
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Please either:`);
    console.error(`   1. Stop the process using port ${PORT}`);
    console.error(`   2. Change the PORT in your environment variables`);
    console.error(`\n   To find the process using port ${PORT}, run:`);
    console.error(`   lsof -ti:${PORT} | xargs kill -9`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully`);

  // Stop blockchain event listeners
  await blockchainService.stopEventListening();

  // Close Socket.IO connections
  io.close();

  // Disconnect from database
  await prisma.$disconnect();

  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

