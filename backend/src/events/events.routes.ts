import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../common/middleware/error.middleware.js';
import { authenticate, optionalAuth } from '../auth/auth.routes.js';
import { logger } from '../common/utils/logger.js';
import { analyzeEvent } from '../events/event-analyzer.js';
import { makeRecommendation } from '../recommendations/recommendation-engine.js';

const router = express.Router();
const prisma = new PrismaClient();

// Track event (SDK endpoint)
router.post('/track', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { 
    type, 
    name, 
    data, 
    url, 
    element,
    anonymousId,
    websiteId 
  } = req.body;
  
  const orgId = (req as any).user?.organizationId;
  
  if (!websiteId) {
    res.status(400).json({ error: 'websiteId is required' });
    return;
  }
  
  // Get or create website
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    include: { organization: true }
  });
  
  if (!website) {
    res.status(404).json({ error: 'Website not found' });
    return;
  }
  
  const organizationId = website.organizationId;
  
  // Create or get session
  let sessionId = req.headers['x-session-id'] as string;
  let session;
  
  if (sessionId) {
    session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
  }
  
  if (!session) {
    sessionId = uuidv4();
    session = await prisma.session.create({
      data: {
        id: sessionId,
        websiteId,
        userId: (req as any).user?.userId,
        anonymousId: anonymousId || sessionId,
        deviceInfo: {
          userAgent: req.headers['user-agent'],
          screenWidth: req.body.screenWidth,
          screenHeight: req.body.screenHeight,
          language: req.headers['accept-language']
        },
        location: req.body.location,
        referrer: req.headers['referer']
      }
    });
  }
  
  // Create event
  const event = await prisma.event.create({
    data: {
      sessionId,
      websiteId,
      userId: (req as any).user?.userId,
      anonymousId: anonymousId || sessionId,
      type: type || 'CUSTOM',
      name,
      data: data || {},
      url,
      element,
      timestamp: new Date()
    }
  });
  
  // Update session
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      pageCount: { increment: 1 },
      duration: { increment: parseInt(data?.duration || '0', 10) }
    }
  });
  
  // Get or create user profile
  let profile = await prisma.userProfile.findUnique({
    where: { anonymousId: anonymousId || sessionId }
  });
  
  if (!profile) {
    profile = await prisma.userProfile.create({
      data: {
        websiteId,
        organizationId,
        anonymousId: anonymousId || sessionId,
        userId: (req as any).user?.userId,
        visitCount: 1,
        lastActiveAt: new Date()
      }
    });
  } else {
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        visitCount: { increment: 1 },
        lastActiveAt: new Date(),
        totalDuration: { increment: parseInt(data?.duration || '0', 10) }
      }
    });
  }
  
  // Run event analysis and personalization
  const analysis = await analyzeEvent(event, profile, website);
  
  const recommendations = await makeRecommendation(profile.id, websiteId, analysis);
  
  // Emit real-time update
  const io = req.app.get('io');
  if (io) {
    io.to(`org:${organizationId}`).emit('event:new', {
      type: 'event',
      data: { event, profile: { id: profile.id, score: profile.engagementScore } }
    });
  }
  
  res.json({
    success: true,
    sessionId,
    profileId: profile.id,
    recommendations: recommendations.map(r => ({
      type: r.type,
      itemId: r.itemId,
      data: r.itemData,
      score: r.score
    })),
    personalization: analysis.personalization
  });
}));

// Get events for a session
router.get('/session/:sessionId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { organizationId } = (req as any).user;
  
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      events: {
        orderBy: { timestamp: 'desc' },
        take: 100
      }
    }
  });
  
  if (!session) {
    res.json({ events: [] });
    return;
  }
  
  // Verify ownership
  const website = await prisma.website.findUnique({
    where: { id: session.websiteId }
  });
  
  if (website?.organizationId !== organizationId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  
  res.json({
    session: {
      id: session.id,
      startedAt: session.startedAt,
      pageCount: session.pageCount,
      duration: session.duration,
      deviceInfo: session.deviceInfo,
      location: session.location
    },
    events: session.events
  });
}));

// Batch track events
router.post('/track/batch', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { events } = req.body;
  
  if (!Array.isArray(events) || events.length === 0) {
    res.status(400).json({ error: 'Events array required' });
    return;
  }
  
  const results = [];
  
  for (const eventData of events) {
    try {
      const result = await trackSingleEvent(eventData, req);
      results.push({ success: true, ...result });
    } catch (error: any) {
      results.push({ success: false, error: error.message });
    }
  }
  
  res.json({ results });
}));

async function trackSingleEvent(eventData: any, req: Request) {
  const { type, name, data, url, anonymousId, websiteId } = eventData;
  
  const website = await prisma.website.findUnique({
    where: { id: websiteId }
  });
  
  if (!website) throw new Error('Website not found');
  
  let session = await prisma.session.findFirst({
    where: { 
      websiteId,
      anonymousId: anonymousId || req.headers['x-session-id']
    },
    orderBy: { startedAt: 'desc' }
  });
  
  if (!session) {
    session = await prisma.session.create({
      data: {
        websiteId,
        anonymousId: anonymousId || uuidv4(),
        deviceInfo: { userAgent: req.headers['user-agent'] }
      }
    });
  }
  
  const event = await prisma.event.create({
    data: {
      sessionId: session.id,
      websiteId,
      type: type || 'CUSTOM',
      name,
      data: data || {},
      url,
      timestamp: new Date()
    }
  });
  
  return { eventId: event.id };
}

export default router;