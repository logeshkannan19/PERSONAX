import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, authenticate } from '../common/middleware/error.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all rules
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  const { websiteId, isActive } = req.query;
  
  const where: any = { organizationId };
  if (websiteId) where.websiteId = websiteId;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  
  const rules = await prisma.personalizationRule.findMany({
    where,
    include: { website: { select: { name: true, domain: true } } },
    orderBy: { priority: 'desc' }
  });
  
  res.json({ rules });
}));

// Create rule
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  const { name, description, websiteId, triggerEvent, conditions, action, actionData, priority } = req.body;
  
  const rule = await prisma.personalizationRule.create({
    data: {
      organizationId,
      websiteId,
      name,
      description,
      triggerEvent,
      conditions,
      action,
      actionData,
      priority: priority || 0
    }
  });
  
  res.status(201).json({ rule });
}));

// Update rule
router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  const { name, description, isActive, priority, conditions, action, actionData } = req.body;
  
  const rule = await prisma.personalizationRule.update({
    where: { id, organizationId },
    data: { name, description, isActive, priority, conditions, action, actionData }
  });
  
  res.json({ rule });
}));

// Toggle rule active state
router.patch('/:id/toggle', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  
  const rule = await prisma.personalizationRule.findUnique({
    where: { id }
  });
  
  if (!rule || rule.organizationId !== organizationId) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  
  const updated = await prisma.personalizationRule.update({
    where: { id },
    data: { isActive: !rule.isActive }
  });
  
  res.json({ rule: updated });
}));

// Delete rule
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  
  await prisma.personalizationRule.delete({
    where: { id, organizationId }
  });
  
  res.json({ success: true });
}));

// Get rule stats
router.get('/:id/stats', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { organizationId } = (req as any).user;
  
  const rule = await prisma.personalizationRule.findUnique({
    where: { id }
  });
  
  if (!rule || rule.organizationId !== organizationId) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  
  res.json({
    impressions: rule.impressions,
    conversions: rule.conversions,
    conversionRate: rule.impressions > 0 
      ? ((rule.conversions / rule.impressions) * 100).toFixed(2) + '%' 
      : '0%'
  });
}));

export default router;