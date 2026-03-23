import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EventAnalysis {
  interests: string[];
  behaviorPatterns: string[];
  engagementLevel: 'low' | 'medium' | 'high';
  personalization: any;
  nextBestAction: string;
}

export async function analyzeEvent(
  event: any,
  profile: any,
  website: any
): Promise<EventAnalysis> {
  const interests: string[] = [...profile.interests];
  const behaviorPatterns: string[] = JSON.parse(profile.behaviorPatterns || '[]');
  
  // Analyze event type and extract interests
  if (event.type === 'PAGE_VIEW') {
    const pageCategory = categorizePage(event.url);
    if (pageCategory && !interests.includes(pageCategory)) {
      interests.push(pageCategory);
    }
    
    if (!behaviorPatterns.includes('browsing')) {
      behaviorPatterns.push('browsing');
    }
  }
  
  if (event.type === 'CLICK') {
    const clickType = categorizeClick(event.element, event.data);
    if (clickType) {
      if (!behaviorPatterns.includes(clickType)) {
        behaviorPatterns.push(clickType);
      }
    }
  }
  
  if (event.type === 'PURCHASE' || event.type === 'FORM_SUBMIT') {
    if (!behaviorPatterns.includes('converting')) {
      behaviorPatterns.push('converting');
    }
  }
  
  // Calculate engagement score
  const engagementScore = calculateEngagementScore(profile, event);
  
  // Determine engagement level
  let engagementLevel: 'low' | 'medium' | 'high' = 'low';
  if (engagementScore > 70) engagementLevel = 'high';
  else if (engagementScore > 40) engagementLevel = 'medium';
  
  // Determine next best action
  const nextBestAction = determineNextBestAction(engagementLevel, behaviorPatterns, profile);
  
  // Generate personalization rules
  const personalization = generatePersonalization(engagementLevel, interests, behaviorPatterns);
  
  // Update profile
  await prisma.userProfile.update({
    where: { id: profile.id },
    data: {
      interests: interests.slice(0, 20),
      behaviorPatterns: JSON.stringify(behaviorPatterns.slice(0, 10)),
      engagementScore
    }
  });
  
  return {
    interests,
    behaviorPatterns,
    engagementLevel,
    personalization,
    nextBestAction
  };
}

function categorizePage(url: string): string | null {
  if (!url) return null;
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('/product') || urlLower.includes('/item')) return 'products';
  if (urlLower.includes('/pricing') || urlLower.includes('/plan')) return 'pricing';
  if (urlLower.includes('/about')) return 'brand';
  if (urlLower.includes('/blog') || urlLower.includes('/post')) return 'content';
  if (urlLower.includes('/cart') || urlLower.includes('/checkout')) return 'purchase_intent';
  if (urlLower.includes('/docs') || urlLower.includes('/help')) return 'support';
  
  return null;
}

function categorizeClick(element: string, data: any): string | null {
  if (!element) return null;
  
  const elLower = element.toLowerCase();
  
  if (elLower.includes('button') || elLower.includes('cta')) return 'cta_engagement';
  if (elLower.includes('nav') || elLower.includes('menu')) return 'navigation';
  if (elLower.includes('video')) return 'video_engagement';
  if (elLower.includes('image') || elLower.includes('img')) return 'visual_content';
  
  return null;
}

function calculateEngagementScore(profile: any, event: any): number {
  let score = profile.engagementScore || 0;
  
  // Event type weight
  const eventWeights: Record<string, number> = {
    PAGE_VIEW: 1,
    CLICK: 2,
    SCROLL: 1.5,
    TIME_ON_PAGE: 0.5,
    FORM_SUBMIT: 5,
    PURCHASE: 10,
    SIGNUP: 8,
    LOGIN: 3
  };
  
  const weight = eventWeights[event.type] || 1;
  score += weight;
  
  // Time spent bonus
  if (event.data?.duration > 300) score += 2;
  
  // Cap at 100
  return Math.min(100, score);
}

function determineNextBestAction(
  engagementLevel: string,
  behaviorPatterns: string[],
  profile: any
): string {
  if (behaviorPatterns.includes('converting')) {
    return 'upsell';
  }
  
  if (engagementLevel === 'low') {
    return 'onboarding';
  }
  
  if (engagementLevel === 'high' && !behaviorPatterns.includes('converting')) {
    return 'convert';
  }
  
  if (behaviorPatterns.includes('browsing') && !behaviorPatterns.includes('cta_engagement')) {
    return 'cta_prompt';
  }
  
  return 'engage';
}

function generatePersonalization(
  engagementLevel: string,
  interests: string[],
  behaviorPatterns: string[]
): any {
  const personalization: any = {};
  
  if (engagementLevel === 'low') {
    personalization.cta = 'Welcome! Check out our top features';
    personalization.highlightSection = 'features';
    personalization.showTour = true;
  } else if (engagementLevel === 'high') {
    if (interests.includes('products') || interests.includes('pricing')) {
      personalization.cta = 'Ready to get started?';
      personalization.showSpecialOffer = true;
      personalization.highlightSection = 'pricing';
    } else {
      personalization.cta = 'Explore our premium content';
      personalization.highlightSection = 'blog';
    }
  }
  
  if (behaviorPatterns.includes('browsing') && !behaviorPatterns.includes('cta_engagement')) {
    personalization.popupAfter = 30;
    personalization.popupContent = 'Have questions? Let\'s talk.';
  }
  
  return personalization;
}