import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import config from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import grievanceRoutes from './routes/grievance.routes';
import authorityRoutes from './routes/authority.routes';
import fileRoutes from './routes/file.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import blockchainRoutes from './routes/blockchain.routes';
import priorityRoutes from './routes/priority.routes';
import departmentRoutes from './routes/department.routes';
import reputationRoutes from './routes/reputation.routes';

const app: Express = express();

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
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/files', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/authority', authorityRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/priority', priorityRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reputation', reputationRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;

