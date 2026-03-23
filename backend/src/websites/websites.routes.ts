import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, authenticate } from '../common/middleware/error.middleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const prisma = new PrismaClient();

// Get all websites
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  
  const websites = await prisma.website.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { events: true, profiles: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json({ websites });
}));

// Create website
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  const { name, domain } = req.body;
  
  const website = await prisma.website.create({
    data: {
      organizationId,
      name,
      domain
    }
  });
  
  res.status(201).json({ website });
}));

// Get single website
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  
  const website = await prisma.website.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: { events: true, profiles: true }
      }
    }
  });
  
  if (!website) {
    res.status(404).json({ error: 'Website not found' });
    return;
  }
  
  res.json({ website });
}));

// Update website
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  const { name, domain, isEnabled, settings } = req.body;
  
  const website = await prisma.website.update({
    where: { id, organizationId },
    data: { name, domain, isEnabled, settings }
  });
  
  res.json({ website });
}));

// Delete website
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  
  await prisma.website.delete({
    where: { id: id, organizationId }
  });
  
  res.json({ success: true });
}));

// Get website stats
router.get('/:id/stats', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const [totalEvents, totalProfiles, recentEvents] = await Promise.all([
    prisma.event.count({ where: { websiteId: id } }),
    prisma.userProfile.count({ where: { websiteId: id } }),
    prisma.event.count({
      where: {
        websiteId: id,
        timestamp: { gte: sevenDaysAgo }
      }
    })
  ]);
  
  res.json({
    totalEvents,
    totalProfiles,
    recentEvents
  });
}));

export default router;