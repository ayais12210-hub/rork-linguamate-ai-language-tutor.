import { z } from "zod";
import { publicProcedure, protectedProcedure } from "@/backend/trpc/create-context";

// In-memory storage (replace with database in production)
const users = new Map<string, any>();

export const getUserProcedure = protectedProcedure
  .query(({ ctx }) => {
    const user = users.get(ctx.userId);
    if (!user) {
      return {
        id: ctx.userId,
        name: null,
        email: null,
        nativeLanguage: 'en',
        selectedLanguage: 'es',
        proficiencyLevel: 'beginner' as const,
        isPremium: false,
        onboardingCompleted: false,
        learningGoals: [],
        interests: [],
        preferredTopics: [],
        dailyGoalMinutes: 15,
        stats: {
          totalChats: 0,
          streakDays: 0,
          wordsLearned: 0,
          xpPoints: 0,
          lastActiveDate: new Date().toISOString(),
          messagesUsedToday: 0,
          lastMessageDate: new Date().toISOString(),
          badges: []
        },
        settings: {
          darkMode: false,
          soundEnabled: true,
          notificationsEnabled: true,
          hapticsEnabled: true,
          autoPlayAudio: true,
          reminderTime: '19:00'
        }
      };
    }
    return user;
  });

export const updateUserProcedure = protectedProcedure
  .input(z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    nativeLanguage: z.string().optional(),
    selectedLanguage: z.string().optional(),
    proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    learningGoals: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    preferredTopics: z.array(z.string()).optional(),
    dailyGoalMinutes: z.number().min(5).max(120).optional(),
    settings: z.object({
      darkMode: z.boolean().optional(),
      soundEnabled: z.boolean().optional(),
      notificationsEnabled: z.boolean().optional(),
      hapticsEnabled: z.boolean().optional(),
      autoPlayAudio: z.boolean().optional(),
      reminderTime: z.string().optional(),
    }).optional()
  }))
  .mutation(({ ctx, input }) => {
    const existingUser = users.get(ctx.userId) || {};
    const updatedUser = {
      ...existingUser,
      id: ctx.userId,
      ...input,
      settings: {
        ...existingUser.settings,
        ...input.settings
      }
    };
    users.set(ctx.userId, updatedUser);
    return updatedUser;
  });

export const completeOnboardingProcedure = protectedProcedure
  .input(z.object({
    nativeLanguage: z.string(),
    selectedLanguage: z.string(),
    proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    learningGoals: z.array(z.string()),
    interests: z.array(z.string()),
    preferredTopics: z.array(z.string()),
    dailyGoalMinutes: z.number().min(5).max(120),
    name: z.string().optional(),
  }))
  .mutation(({ ctx, input }) => {
    const user = {
      id: ctx.userId,
      ...input,
      onboardingCompleted: true,
      isPremium: false,
      stats: {
        totalChats: 0,
        streakDays: 0,
        wordsLearned: 0,
        xpPoints: 0,
        lastActiveDate: new Date().toISOString(),
        messagesUsedToday: 0,
        lastMessageDate: new Date().toISOString(),
        badges: []
      },
      settings: {
        darkMode: false,
        soundEnabled: true,
        notificationsEnabled: true,
        hapticsEnabled: true,
        autoPlayAudio: true,
        reminderTime: '19:00'
      }
    };
    users.set(ctx.userId, user);
    return user;
  });

export const updateStatsProcedure = protectedProcedure
  .input(z.object({
    totalChats: z.number().optional(),
    streakDays: z.number().optional(),
    wordsLearned: z.number().optional(),
    xpPoints: z.number().optional(),
    messagesUsedToday: z.number().optional(),
  }))
  .mutation(({ ctx, input }) => {
    const user = users.get(ctx.userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      stats: {
        ...user.stats,
        ...input,
        lastActiveDate: new Date().toISOString()
      }
    };
    users.set(ctx.userId, updatedUser);
    return updatedUser;
  });

export const upgradeToPremiumProcedure = protectedProcedure
  .mutation(({ ctx }) => {
    const user = users.get(ctx.userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = {
      ...user,
      isPremium: true
    };
    users.set(ctx.userId, updatedUser);
    return updatedUser;
  });

export const canSendMessageProcedure = protectedProcedure
  .query(({ ctx }) => {
    const user = users.get(ctx.userId);
    if (!user) return { canSend: true, messagesLeft: 5 };
    
    const today = new Date().toDateString();
    const lastMessageDate = new Date(user.stats.lastMessageDate).toDateString();
    
    if (lastMessageDate !== today) {
      return { canSend: true, messagesLeft: 5 };
    }
    
    if (user.isPremium) {
      return { canSend: true, messagesLeft: -1 }; // Unlimited
    }
    
    const messagesLeft = Math.max(0, 5 - user.stats.messagesUsedToday);
    return { canSend: messagesLeft > 0, messagesLeft };
  });

export const incrementMessageCountProcedure = protectedProcedure
  .mutation(({ ctx }) => {
    const user = users.get(ctx.userId);
    if (!user) throw new Error('User not found');
    
    const today = new Date().toDateString();
    const lastMessageDate = new Date(user.stats.lastMessageDate).toDateString();
    
    let messagesUsedToday = user.stats.messagesUsedToday;
    if (lastMessageDate !== today) {
      messagesUsedToday = 0;
    }
    
    const updatedUser = {
      ...user,
      stats: {
        ...user.stats,
        messagesUsedToday: messagesUsedToday + 1,
        lastMessageDate: new Date().toISOString(),
        totalChats: user.stats.totalChats + 1
      }
    };
    users.set(ctx.userId, updatedUser);
    return updatedUser;
  });