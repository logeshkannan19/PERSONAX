import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, authenticate } from '../common/middleware/error.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get analytics overview
router.get('/overview', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string, 10));
  
  // Get daily analytics
  const dailyAnalytics = await prisma.dailyAnalytics.findMany({
    where: {
      organizationId,
      date: { gte: startDate }
    },
    orderBy: { date: 'asc' }
  });
  
  // Get totals
  const totals = dailyAnalytics.reduce((acc, day) => ({
    visitors: acc.visitors + day.visitors,
    pageViews: acc.pageViews + day.pageViews,
    avgDuration: acc.avgDuration + day.avgDuration,
    bounceRate: acc.bounceRate + day.bounceRate
  }), { visitors: 0, pageViews: 0, avgDuration: 0, bounceRate: 0 });
  
  totals.avgDuration = totals.avgDuration / (dailyAnalytics.length || 1);
  totals.bounceRate = totals.bounceRate / (dailyAnalytics.length || 1);
  
  // Get segment distribution
  const profiles = await prisma.userProfile.groupBy({
    by: ['engagementScore'],
    where: { organizationId },
    _count: true
  });
  
  const segments = {
    new: profiles.filter(p => p.engagementScore < 20).reduce((a, b) => a + b._count, 0),
    active: profiles.filter(p => p.engagementScore >= 20 && p.engagementScore < 60).reduce((a, b) => a + b._count, 0),
    highValue: profiles.filter(p => p.engagementScore >= 60).reduce((a, b) => a + b._count, 0)
  };
  
  res.json({
    period: days,
    totals,
    daily: dailyAnalytics,
    segments
  });
}));

// Get real-time visitors
router.get('/realtime', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  
  // Active sessions in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const activeSessions = await prisma.session.findMany({
    where: {
      website: { organizationId },
      startedAt: { gte: fiveMinutesAgo }
    },
    include: {
      website: true,
      events: {
        orderBy: { timestamp: 'desc' },
        take: 1
      }
    },
    take: 50
  });
  
  const recentEvents = await prisma.event.findMany({
    where: {
      website: { organizationId },
      timestamp: { gte: fiveMinutesAgo }
    },
    orderBy: { timestamp: 'desc' },
    take: 20,
    include: {
      session: true
    }
  });
  
  res.json({
    activeSessions: activeSessions.length,
    sessions: activeSessions.map(s => ({
      id: s.id,
      pageCount: s.pageCount,
      duration: s.duration,
      currentPage: s.events[0]?.url,
      device: s.deviceInfo
    })),
    recentEvents: recentEvents.map(e => ({
      type: e.type,
      name: e.name,
      url: e.url,
      timestamp: e.timestamp
    }))
  });
}));

// Get user segments
router.get('/segments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  
  const profiles = await prisma.userProfile.findMany({
    where: { organizationId },
    select: {
      id: true,
      interests: true,
      engagementScore: true,
      visitCount: true,
      totalDuration: true,
      lastActiveAt: true,
      createdAt: true
    }
  });
  
  // Calculate segments
  const now = new Date();
  const segments = {
    new: 0,
    active: 0,
    highValue: 0,
    atRisk: 0,
    dormant: 0
  };
  
  for (const profile of profiles) {
    const daysSinceActive = Math.floor((now.getTime() - new Date(profile.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (profile.visitCount <= 2) {
      segments.new++;
    } else if (daysSinceActive > 14) {
      segments.dormant++;
    } else if (daysSinceActive > 7) {
      segments.atRisk++;
    } else if (profile.engagementScore >= 60) {
      segments.highValue++;
    } else {
      segments.active++;
    }
  }
  
  res.json({ segments, total: profiles.length });
}));

// Get top content/pages
router.get('/content', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  const { days = 7 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string, 10));
  
  const events = await prisma.event.findMany({
    where: {
      website: { organizationId },
      type: 'PAGE_VIEW',
      timestamp: { gte: startDate }
    },
    select: { url: true },
    orderBy: { timestamp: 'desc' }
  });
  
  // Count page views
  const pageCounts: Record<string, number> = {};
  for (const event of events) {
    const url = event.url || 'unknown';
    pageCounts[url] = (pageCounts[url] || 0) + 1;
  }
  
  const topPages = Object.entries(pageCounts)
    .map(([url, views]) => ({ url, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  
  res.json({ topPages });
}));

export default router;