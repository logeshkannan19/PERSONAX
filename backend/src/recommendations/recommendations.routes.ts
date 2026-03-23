import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, authenticate } from '../common/middleware/error.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get recommendations for a profile
router.get('/:profileId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { profileId } = req.params;
  const { organizationId } = (req as any).user;
  
  const profile = await prisma.userProfile.findUnique({
    where: { id: profileId }
  });
  
  if (!profile || profile.organizationId !== organizationId) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }
  
  const recommendations = await prisma.recommendation.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  
  res.json({ recommendations });
}));

// Track recommendation interaction
router.post('/:id/click', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const rec = await prisma.recommendation.update({
    where: { id },
    data: { isClicked: true }
  });
  
  res.json({ success: true });
}));

router.post('/:id/convert', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const rec = await prisma.recommendation.update({
    where: { id },
    data: { isConverted: true }
  });
  
  // Update profile engagement score
  await prisma.userProfile.update({
    where: { id: rec.profileId },
    data: { engagementScore: { increment: 10 } }
  });
  
  res.json({ success: true });
}));

// Get A/B test variants
router.get('/abtest/:testId/variant', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { testId } = req.params;
  const { anonymousId } = req.query;
  
  const test = await prisma.aBTest.findUnique({
    where: { id: testId }
  });
  
  if (!test || test.status !== 'running') {
    res.json({ variant: 'control' });
    return;
  }
  
  // Simple hash-based assignment
  const hash = hashCode(`${testId}-${anonymousId}`);
  const variants = JSON.parse(test.variants as any) || ['control', 'variant-a'];
  const variantIndex = Math.abs(hash) % variants.length;
  
  res.json({ variant: variants[variantIndex] });
}));

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash;
}

export default router;