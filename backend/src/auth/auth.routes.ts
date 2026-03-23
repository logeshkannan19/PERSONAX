import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, AppError } from '../common/middleware/error.middleware.js';
import { logger } from '../common/utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
}

// Auth middleware
export function authenticate(req: Request, res: Response, next: Function): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'No token provided');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
    (req as any).user = decoded;
    next();
  } catch {
    throw new AppError(401, 'Invalid token');
  }
}

// Optional auth (for SDK)
export function optionalAuth(req: Request, res: Response, next: Function): void {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
      (req as any).user = decoded;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true }
  });
  
  if (!user || !user.password) {
    throw new AppError(401, 'Invalid credentials');
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    throw new AppError(401, 'Invalid credentials');
  }
  
  const token = jwt.sign(
    { 
      userId: user.id, 
      organizationId: user.organizationId, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization.name
    }
  });
}));

// Register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, organizationName } = req.body;
  
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new AppError(400, 'Email already registered');
  }
  
  // Create organization and user
  const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const apiKey = `pk_${generateApiKey()}`;
  
  const organization = await prisma.organization.create({
    data: {
      name: organizationName,
      slug,
      apiKey,
      users: {
        create: {
          email,
          password: await bcrypt.hash(password, 12),
          name,
          role: 'ADMIN'
        }
      }
    },
    include: {
      users: true
    }
  });
  
  const user = organization.users[0];
  
  const token = jwt.sign(
    { 
      userId: user.id, 
      organizationId: user.organizationId, 
      role: user.role 
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: organization.name
    },
    apiKey: organization.apiKey
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { userId, organizationId } = (req as any).user;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true }
  });
  
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization.name
  });
}));

// Generate API key
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;