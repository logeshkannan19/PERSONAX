import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, authenticate } from '../common/middleware/error.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all profiles
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  const { page = 1, limit = 50, segment, search } = req.query;
  
  const where: any = { organizationId };
  
  if (segment === 'new') {
    where.visitCount = { lte: 2 };
  } else if (segment === 'high-value') {
    where.engagementScore = { gte: 60 };
  } else if (segment === 'at-risk') {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    where.lastActiveAt = { lt: twoWeeksAgo };
  }
  
  const profiles = await prisma.userProfile.findMany({
    where,
    include: {
      website: { select: { name: true, domain: true } }
    },
    orderBy: { lastActiveAt: 'desc' },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string)
  });
  
  const total = await prisma.userProfile.count({ where });
  
  res.json({
    profiles,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Get single profile
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  
  const profile = await prisma.userProfile.findFirst({
    where: { id, organizationId },
    include: {
      website: true,
      events: {
        orderBy: { timestamp: 'desc' },
        take: 100
      },
      recommendations: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });
  
  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  
  res.json({ profile });
}));

// Update profile manually
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  const { interests, engagementScore } = req.body;
  
  const profile = await prisma.userProfile.update({
    where: { id: id, organizationId },
    data: {
      interests,
      engagementScore
    }
  });
  
  res.json({ profile });
}));

// Delete profile
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  
  await prisma.userProfile.delete({
    where: { id, organizationId }
  });
  
  res.json({ success: true });
}));

export default router;