import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../../create-context";

// In-memory storage for analytics (replace with database in production)
const analyticsData = new Map<string, any>();

export const trackEventProcedure = protectedProcedure
  .input(z.object({
    event: z.string(),
    properties: z.record(z.string(), z.any()).optional(),
    timestamp: z.string().optional()
  }))
  .mutation(({ ctx, input }) => {
    const userAnalytics = analyticsData.get(ctx.userId) || [];
    
    const event = {
      id: `event-${Date.now()}`,
      userId: ctx.userId,
      event: input.event,
      properties: input.properties || {},
      timestamp: input.timestamp || new Date().toISOString()
    };
    
    userAnalytics.push(event);
    analyticsData.set(ctx.userId, userAnalytics);
    
    return { success: true, eventId: event.id };
  });

export const getLearningAnalyticsProcedure = protectedProcedure
  .input(z.object({
    timeframe: z.enum(['week', 'month', 'year']).default('week'),
    language: z.string().optional()
  }))
  .query(({ ctx, input }) => {
    const userEvents = analyticsData.get(ctx.userId) || [];
    
    const now = new Date();
    const timeframeMs = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    
    const cutoffDate = new Date(now.getTime() - timeframeMs[input.timeframe]);
    
    const filteredEvents = userEvents.filter((event: any) => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= cutoffDate;
    });
    
    // Calculate analytics
    const lessonCompletions = filteredEvents.filter((e: any) => e.event === 'lesson_completed');
    const practiceTime = filteredEvents
      .filter((e: any) => e.event === 'practice_session')
      .reduce((total: number, e: any) => total + (e.properties?.duration || 0), 0);
    
    const streakDays = calculateStreak(filteredEvents);
    const accuracy = calculateAverageAccuracy(filteredEvents);
    
    return {
      timeframe: input.timeframe,
      totalLessons: lessonCompletions.length,
      totalPracticeTime: practiceTime,
      streakDays,
      averageAccuracy: accuracy,
      dailyActivity: generateDailyActivity(filteredEvents, input.timeframe),
      topicProgress: generateTopicProgress(filteredEvents),
      achievements: generateAchievements(filteredEvents)
    };
  });

export const getLeaderboardProcedure = publicProcedure
  .input(z.object({
    type: z.enum(['xp', 'streak', 'lessons']).default('xp'),
    timeframe: z.enum(['week', 'month', 'all']).default('week'),
    limit: z.number().min(1).max(100).default(10)
  }))
  .query(({ input }) => {
    // Simulate leaderboard data (replace with actual user data)
    const mockUsers = Array.from({ length: 20 }, (_, i) => ({
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
      score: Math.floor(Math.random() * 10000) + 1000,
      rank: i + 1
    }));
    
    return mockUsers
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit)
      .map((user, index) => ({ ...user, rank: index + 1 }));
  });

export const getPersonalizedRecommendationsProcedure = protectedProcedure
  .input(z.object({
    language: z.string(),
    limit: z.number().min(1).max(10).default(5)
  }))
  .query(({ ctx, input }) => {
    const userEvents = analyticsData.get(ctx.userId) || [];
    
    // Analyze user behavior to generate recommendations
    const weakAreas = analyzeWeakAreas(userEvents);
    const preferredTimes = analyzePreferredTimes(userEvents);
    const difficulty = analyzeDifficultyPreference(userEvents);
    
    return {
      recommendations: [
        {
          type: 'lesson',
          title: 'Focus on Grammar',
          description: 'Based on your recent performance, grammar practice would help',
          priority: 'high',
          estimatedTime: 15,
          xpReward: 50
        },
        {
          type: 'practice',
          title: 'Pronunciation Practice',
          description: 'Improve your speaking skills with targeted exercises',
          priority: 'medium',
          estimatedTime: 10,
          xpReward: 30
        }
      ],
      insights: {
        weakAreas,
        preferredTimes,
        suggestedDifficulty: difficulty,
        nextMilestone: 'Complete 5 more lessons to unlock Advanced level'
      }
    };
  });

export const generateProgressReportProcedure = protectedProcedure
  .input(z.object({
    language: z.string(),
    timeframe: z.enum(['week', 'month']).default('week')
  }))
  .mutation(({ ctx, input }) => {
    // const userEvents = analyticsData.get(ctx.userId) || [];
    
    const report = {
      id: `report-${Date.now()}`,
      userId: ctx.userId,
      language: input.language,
      timeframe: input.timeframe,
      generatedAt: new Date().toISOString(),
      summary: {
        lessonsCompleted: 12,
        timeSpent: 180, // minutes
        accuracyImprovement: 15, // percentage points
        streakDays: 5,
        xpEarned: 450
      },
      strengths: [
        'Excellent progress in vocabulary',
        'Consistent daily practice',
        'Strong pronunciation skills'
      ],
      areasForImprovement: [
        'Grammar exercises need more attention',
        'Try speaking practice more often'
      ],
      recommendations: [
        'Focus on verb conjugations this week',
        'Join conversation practice sessions',
        'Review previous lessons for better retention'
      ],
      nextGoals: [
        'Complete 15 lessons this week',
        'Achieve 90% accuracy in grammar exercises',
        'Maintain 7-day streak'
      ]
    };
    
    return report;
  });

// Helper functions
function calculateStreak(events: any[]) {
  const practiceDays = new Set(
    events
      .filter(e => e.event === 'lesson_completed' || e.event === 'practice_session')
      .map(e => new Date(e.timestamp).toDateString())
  );
  
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    if (practiceDays.has(checkDate.toDateString())) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateAverageAccuracy(events: any[]) {
  const accuracyEvents = events.filter(e => e.properties?.accuracy !== undefined);
  if (accuracyEvents.length === 0) return 0;
  
  const totalAccuracy = accuracyEvents.reduce((sum, e) => sum + e.properties.accuracy, 0);
  return Math.round(totalAccuracy / accuracyEvents.length);
}

function generateDailyActivity(events: any[], timeframe: string) {
  const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
  const activity = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayEvents = events.filter(e => 
      e.timestamp.startsWith(dateStr)
    );
    
    activity.push({
      date: dateStr,
      lessons: dayEvents.filter(e => e.event === 'lesson_completed').length,
      practiceTime: dayEvents
        .filter(e => e.event === 'practice_session')
        .reduce((total, e) => total + (e.properties?.duration || 0), 0),
      xpEarned: dayEvents.reduce((total, e) => total + (e.properties?.xp || 0), 0)
    });
  }
  
  return activity;
}

function generateTopicProgress(events: any[]) {
  const topics = ['grammar', 'vocabulary', 'pronunciation', 'listening', 'speaking'];
  
  return topics.map(topic => {
    const topicEvents = events.filter(e => e.properties?.topic === topic);
    const completed = topicEvents.filter(e => e.event === 'lesson_completed').length;
    const accuracy = calculateAverageAccuracy(topicEvents);
    
    return {
      topic,
      lessonsCompleted: completed,
      averageAccuracy: accuracy,
      progress: Math.min(100, completed * 10) // Simplified calculation
    };
  });
}

function generateAchievements(events: any[]) {
  const achievements = [];
  
  const lessonCount = events.filter(e => e.event === 'lesson_completed').length;
  if (lessonCount >= 10) {
    achievements.push({
      id: 'lessons_10',
      title: 'Dedicated Learner',
      description: 'Completed 10 lessons',
      unlockedAt: new Date().toISOString()
    });
  }
  
  const streak = calculateStreak(events);
  if (streak >= 7) {
    achievements.push({
      id: 'streak_7',
      title: 'Week Warrior',
      description: '7-day learning streak',
      unlockedAt: new Date().toISOString()
    });
  }
  
  return achievements;
}

function analyzeWeakAreas(events: any[]) {
  const topicAccuracy = events
    .filter(e => e.properties?.topic && e.properties?.accuracy !== undefined)
    .reduce((acc: any, e) => {
      const topic = e.properties.topic;
      if (!acc[topic]) acc[topic] = [];
      acc[topic].push(e.properties.accuracy);
      return acc;
    }, {});
  
  return Object.entries(topicAccuracy)
    .map(([topic, accuracies]: [string, any]) => ({
      topic,
      averageAccuracy: accuracies.reduce((sum: number, acc: number) => sum + acc, 0) / accuracies.length
    }))
    .filter(item => item.averageAccuracy < 70)
    .map(item => item.topic);
}

function analyzePreferredTimes(events: any[]) {
  const hourCounts = events.reduce((acc: any, e) => {
    const hour = new Date(e.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  
  const sortedHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));
  
  return sortedHours;
}

function analyzeDifficultyPreference(events: any[]) {
  const difficultyEvents = events.filter(e => e.properties?.difficulty);
  if (difficultyEvents.length === 0) return 'beginner';
  
  const avgAccuracy = calculateAverageAccuracy(difficultyEvents);
  
  if (avgAccuracy >= 85) return 'intermediate';
  if (avgAccuracy >= 70) return 'beginner';
  return 'beginner';
}