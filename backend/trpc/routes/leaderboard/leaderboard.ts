import { z } from 'zod';
import { protectedProcedure, publicProcedure, createTRPCRouter } from '@/backend/trpc/create-context';

export const getLeaderboardProcedure = publicProcedure
  .input(z.object({
    filter: z.enum(['all', 'weekly', 'monthly', 'friends']).default('all'),
    sortBy: z.enum(['xp', 'streak', 'lessons', 'languages']).default('xp'),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  }))
  .query(async ({ input }) => {
    // Mock data - in real app this would query database
    const mockUsers = [
      {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        totalXP: 15420,
        streak: 47,
        languagesLearned: ['Spanish', 'French', 'Italian'],
        badges: [],
        level: 12,
        rank: 1,
        weeklyXP: 2340,
        monthlyXP: 8920,
        completedLessons: 156,
        achievements: ['Speed Learner', 'Polyglot', 'Streak Master'],
        joinedAt: '2024-01-15',
        lastActive: '2024-12-21',
      },
      {
        id: '2',
        name: 'Miguel Rodriguez',
        email: 'miguel@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        totalXP: 14890,
        streak: 32,
        languagesLearned: ['English', 'Portuguese'],
        badges: [],
        level: 11,
        rank: 2,
        weeklyXP: 1980,
        monthlyXP: 7650,
        completedLessons: 142,
        achievements: ['Consistent Learner', 'Grammar Master'],
        joinedAt: '2024-02-03',
        lastActive: '2024-12-21',
      },
      {
        id: '3',
        name: 'Emma Johnson',
        email: 'emma@example.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        totalXP: 13560,
        streak: 28,
        languagesLearned: ['Japanese', 'Korean'],
        badges: [],
        level: 10,
        rank: 3,
        weeklyXP: 1750,
        monthlyXP: 6890,
        completedLessons: 128,
        achievements: ['Cultural Explorer', 'Pronunciation Pro'],
        joinedAt: '2024-01-28',
        lastActive: '2024-12-20',
      },
    ];

    // Sort based on criteria
    const sortedUsers = mockUsers.sort((a, b) => {
      switch (input.sortBy) {
        case 'xp':
          return input.filter === 'weekly' ? b.weeklyXP - a.weeklyXP :
                 input.filter === 'monthly' ? b.monthlyXP - a.monthlyXP :
                 b.totalXP - a.totalXP;
        case 'streak':
          return b.streak - a.streak;
        case 'lessons':
          return b.completedLessons - a.completedLessons;
        case 'languages':
          return b.languagesLearned.length - a.languagesLearned.length;
        default:
          return b.totalXP - a.totalXP;
      }
    });

    return {
      users: sortedUsers.slice(input.offset, input.offset + input.limit),
      total: sortedUsers.length,
      hasMore: input.offset + input.limit < sortedUsers.length,
    };
  });

export const searchUsersProcedure = publicProcedure
  .input(z.object({
    query: z.string().min(1).max(100),
    limit: z.number().min(1).max(50).default(20),
  }))
  .query(async ({ input }) => {
    // Mock search - in real app this would search database
    const mockUsers = [
      {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        totalXP: 15420,
        streak: 47,
        level: 12,
        languagesLearned: ['Spanish', 'French', 'Italian'],
      },
      {
        id: '2',
        name: 'Miguel Rodriguez',
        email: 'miguel@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        totalXP: 14890,
        streak: 32,
        level: 11,
        languagesLearned: ['English', 'Portuguese'],
      },
    ];

    const filtered = mockUsers.filter(user =>
      user.name.toLowerCase().includes(input.query.toLowerCase()) ||
      user.email.toLowerCase().includes(input.query.toLowerCase())
    );

    return filtered.slice(0, input.limit);
  });

export const getUserStatsProcedure = protectedProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    // Mock user stats - in real app this would query database
    return {
      id: input.userId,
      name: 'Current User',
      totalXP: 5420,
      streak: 12,
      level: 6,
      rank: 4,
      weeklyXP: 890,
      monthlyXP: 3420,
      completedLessons: 45,
      languagesLearned: ['Spanish'],
      badges: [],
      achievements: ['First Steps', 'Week Warrior'],
      joinedAt: '2024-03-01',
      lastActive: '2024-12-21',
      trophies: [
        {
          id: 'first_lesson',
          name: 'First Steps',
          description: 'Complete your first lesson',
          icon: '🎯',
          rarity: 'bronze' as const,
          unlockedAt: '2024-03-02',
        },
        {
          id: 'week_streak',
          name: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          rarity: 'silver' as const,
          unlockedAt: '2024-03-08',
        },
      ],
    };
  });

export const compareUsersProcedure = publicProcedure
  .input(z.object({
    userId1: z.string(),
    userId2: z.string(),
  }))
  .query(async ({ input }) => {
    // Mock comparison - in real app this would query database
    return {
      user1: {
        id: input.userId1,
        name: 'You',
        totalXP: 5420,
        streak: 12,
        level: 6,
        completedLessons: 45,
        languagesLearned: ['Spanish'],
        badges: 2,
      },
      user2: {
        id: input.userId2,
        name: 'Sarah Chen',
        totalXP: 15420,
        streak: 47,
        level: 12,
        completedLessons: 156,
        languagesLearned: ['Spanish', 'French', 'Italian'],
        badges: 8,
      },
      comparison: {
        xpDifference: 10000,
        streakDifference: 35,
        levelDifference: 6,
        lessonsDifference: 111,
        languagesDifference: 2,
        badgesDifference: 6,
      },
    };
  });

export const getGlobalStatsProcedure = publicProcedure
  .query(async () => {
    // Mock global stats - in real app this would query database
    return {
      totalUsers: 125000,
      totalXPEarned: 45000000,
      totalLessonsCompleted: 890000,
      averageStreak: 8.5,
      topLanguages: [
        { language: 'Spanish', learners: 45000 },
        { language: 'French', learners: 32000 },
        { language: 'German', learners: 28000 },
        { language: 'Italian', learners: 20000 },
      ],
      weeklyActiveUsers: 85000,
      monthlyActiveUsers: 110000,
    };
  });
