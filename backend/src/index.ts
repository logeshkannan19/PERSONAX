import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from './auth/auth.routes.js';
import userRoutes from './users/users.routes.js';
import eventRoutes from './events/events.routes.js';
import websiteRoutes from './websites/websites.routes.js';
import profileRoutes from './users/profile.routes.js';
import recommendationRoutes from './recommendations/recommendations.routes.js';
import analyticsRoutes from './analytics/analytics.routes.js';
import segmentRoutes from './segments/segments.routes.js';
import ruleRoutes from './rules/rules.routes.js';
import { errorHandler } from './common/middleware/error.middleware.js';
import { rateLimiter } from './common/middleware/rate-limiter.middleware.js';
import { logger } from './common/utils/logger.js';
import { cacheService } from './common/services/cache.service.js';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Make io available in requests
app.set('io', io);
app.set('prisma', prisma);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/rules', ruleRoutes);

// SDK Endpoint for client-side tracking
app.use('/sdk/v1', eventRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  await cacheService.disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);

httpServer.listen(PORT, () => {
  logger.info(`PERSONAX API running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export { app, prisma, io };