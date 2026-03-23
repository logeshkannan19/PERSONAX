import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, authenticate } from '../common/middleware/error.middleware.js';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      lastLoginAt: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json({ users });
}));

// Create user (admin only)
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId, role } = (req as any).user;
  
  if (role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  
  const { email, password, name } = req.body;
  
  const user = await prisma.user.create({
    data: {
      organizationId,
      email,
      password: await bcrypt.hash(password, 12),
      name,
      role: 'USER'
    }
  });
  
  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}));

// Update user
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId, role, userId } = (req as any).user;
  
  // Only admin can update, or users can update themselves
  if (role !== 'ADMIN' && userId !== id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  
  const { name, email, password } = req.body;
  
  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (password) updateData.password = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.update({
    where: { id, organizationId },
    data: updateData
  });
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}));

// Delete user
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId, role } = (req as any).user;
  
  if (role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin only' });
    return;
  }
  
  await prisma.user.delete({
    where: { id, organizationId }
  });
  
  res.json({ success: true });
}));

export default router;