import { PrismaClient } from '@prisma/client';
import { logger } from '../common/utils/logger.js';

const prisma = new PrismaClient();

interface Recommendation {
  id: string;
  profileId: string;
  type: string;
  itemId: string;
  itemData: any;
  score: number;
  reason: string;
}

export async function makeRecommendation(
  profileId: string,
  websiteId: string,
  analysis: any
): Promise<Recommendation[]> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: profileId }
  });
  
  if (!profile) return [];
  
  const recommendations: Recommendation[] = [];
  
  // Content-based filtering based on interests
  if (profile.interests.length > 0) {
    const contentRecs = await getContentBasedRecommendations(
      profile.interests,
      websiteId,
      profile.id
    );
    recommendations.push(...contentRecs);
  }
  
  // Collaborative filtering - similar users liked
  const collabRecs = await getCollaborativeRecommendations(
    profile.id,
    profile.interests,
    websiteId
  );
  recommendations.push(...collabRecs);
  
  // AI-powered recommendations using OpenAI
  if (process.env.OPENAI_API_KEY) {
    const aiRecs = await getAIRecommendations(profile, analysis);
    recommendations.push(...aiRecs);
  }
  
  // Rule-based recommendations
  const ruleRecs = await getRuleBasedRecommendations(profile, analysis);
  recommendations.push(...ruleRecs);
  
  // Sort by score and limit
  recommendations.sort((a, b) => b.score - a.score);
  const finalRecs = recommendations.slice(0, 5);
  
  // Save to database
  for (const rec of finalRecs) {
    await prisma.recommendation.create({
      data: {
        profileId,
        type: rec.type as any,
        itemId: rec.itemId,
        itemData: rec.itemData,
        score: rec.score,
        reason: rec.reason
      }
    });
  }
  
  return finalRecs;
}

async function getContentBasedRecommendations(
  interests: string[],
  websiteId: string,
  profileId: string
): Promise<Recommendation[]> {
  // Get past clicked recommendations
  const pastRecs = await prisma.recommendation.findMany({
    where: { profileId, isClicked: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  // Simple content matching based on interests
  const recommendations: Recommendation[] = [];
  
  for (const interest of interests.slice(0, 3)) {
    recommendations.push({
      id: `content-${interest}`,
      profileId,
      type: 'CONTENT',
      itemId: interest,
      itemData: {
        title: `Explore more about ${interest}`,
        category: interest,
        link: `/${interest}`
      },
      score: 0.7,
      reason: `Based on your interest in ${interest}`
    });
  }
  
  return recommendations;
}

async function getCollaborativeRecommendations(
  profileId: string,
  interests: string[],
  websiteId: string
): Promise<Recommendation[]> {
  // Find similar profiles based on interests
  const similarProfiles = await prisma.userProfile.findMany({
    where: {
      websiteId,
      id: { not: profileId },
      interests: { hasSome: interests }
    },
    take: 5
  });
  
  if (similarProfiles.length === 0) return [];
  
  // Get what similar users engaged with
  const recommendations: Recommendation[] = [];
  
  recommendations.push({
    id: `collab-${Date.now()}`,
    profileId,
    type: 'CONTENT',
    itemId: 'popular-in-segment',
    itemData: {
      title: 'Popular among similar users',
      description: 'Based on what users like you are viewing'
    },
    score: 0.6,
    reason: 'Popular among similar users'
  });
  
  return recommendations;
}

async function getAIRecommendations(
  profile: any,
  analysis: any
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  
  try {
    // Using OpenAI for smart recommendations
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `Based on user profile with interests: ${profile.interests.join(', ')} 
    and behavior patterns: ${profile.behaviorPatterns}
    and engagement level: ${analysis.engagementLevel},
    suggest 2 personalized content or product recommendations.
    Return as JSON array with fields: title, description, category, score (0-1)`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });
    
    const content = completion.choices[0]?.message?.content;
    if (content) {
      try {
        const recs = JSON.parse(content);
        for (const rec of recs) {
          recommendations.push({
            id: `ai-${Date.now()}-${Math.random()}`,
            profileId: profile.id,
            type: 'CONTENT',
            itemId: rec.category || 'ai-recommended',
            itemData: {
              title: rec.title,
              description: rec.description,
              category: rec.category
            },
            score: rec.score || 0.5,
            reason: 'AI-powered recommendation'
          });
        }
      } catch (parseError) {
        logger.warn('Failed to parse AI recommendations');
      }
    }
  } catch (error) {
    logger.warn('AI recommendations failed', { error });
  }
  
  return recommendations;
}

async function getRuleBasedRecommendations(
  profile: any,
  analysis: any
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];
  
  // New user - show onboarding
  if (profile.visitCount < 3) {
    recommendations.push({
      id: 'rule-new-user',
      profileId: profile.id,
      type: 'UI_CHANGE',
      itemId: 'onboarding-tour',
      itemData: {
        action: 'show_tour',
        tourId: 'welcome-tour'
      },
      score: 0.9,
      reason: 'New user - show welcome tour'
    });
  }
  
  // High engagement - suggest signup/login
  if (analysis.engagementLevel === 'high' && !profile.userId) {
    recommendations.push({
      id: 'rule-high-engagement',
      profileId: profile.id,
      type: 'CTA',
      itemId: 'signup-prompt',
      itemData: {
        cta: 'Create free account',
        message: 'Save your preferences and get personalized experience'
      },
      score: 0.8,
      reason: 'High engagement, prompt account creation'
    });
  }
  
  // At-risk user - show retention offer
  const daysSinceLastActive = Math.floor(
    (Date.now() - new Date(profile.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastActive > 14) {
    recommendations.push({
      id: 'rule-churn',
      profileId: profile.id,
      type: 'CTA',
      itemId: 'return-offer',
      itemData: {
        cta: 'We miss you!',
        message: 'Special offer for returning users'
      },
      score: 0.85,
      reason: 'At-risk of churning'
    });
  }
  
  return recommendations;
}