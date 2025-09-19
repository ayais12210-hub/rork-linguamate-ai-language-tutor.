import { z } from "zod";
import { publicProcedure, protectedProcedure } from "@/backend/trpc/create-context";

// In-memory storage for lessons (replace with database in production)
const lessons = new Map<string, any>();
const userProgress = new Map<string, any>();

// Initialize sample lessons
const sampleLessons = [
  {
    id: 'alphabet-basics',
    type: 'alphabet',
    title: 'Alphabet Basics',
    description: 'Learn the fundamental letters and sounds',
    icon: '🔤',
    difficulty: 'beginner',
    estimatedTime: 15,
    xpReward: 50,
    isLocked: false,
    language: 'es',
    subModules: [
      {
        id: 'vowels-intro',
        title: 'Vowels Introduction',
        type: 'lesson',
        content: {
          instructions: 'Learn the 5 Spanish vowels',
          items: [
            { id: 'a', type: 'character', value: 'A', pronunciation: 'ah', translation: 'A as in father' },
            { id: 'e', type: 'character', value: 'E', pronunciation: 'eh', translation: 'E as in bet' },
            { id: 'i', type: 'character', value: 'I', pronunciation: 'ee', translation: 'I as in machine' },
            { id: 'o', type: 'character', value: 'O', pronunciation: 'oh', translation: 'O as in more' },
            { id: 'u', type: 'character', value: 'U', pronunciation: 'oo', translation: 'U as in moon' }
          ]
        },
        isCompleted: false
      }
    ]
  },
  {
    id: 'numbers-1-10',
    type: 'numbers',
    title: 'Numbers 1-10',
    description: 'Count from one to ten',
    icon: '🔢',
    difficulty: 'beginner',
    estimatedTime: 10,
    xpReward: 30,
    isLocked: false,
    language: 'es',
    subModules: [
      {
        id: 'basic-numbers',
        title: 'Basic Numbers',
        type: 'lesson',
        content: {
          instructions: 'Learn numbers 1 through 10 in Spanish',
          items: [
            { id: '1', type: 'word', value: 'uno', pronunciation: 'OO-noh', translation: 'one' },
            { id: '2', type: 'word', value: 'dos', pronunciation: 'dohs', translation: 'two' },
            { id: '3', type: 'word', value: 'tres', pronunciation: 'trehs', translation: 'three' },
            { id: '4', type: 'word', value: 'cuatro', pronunciation: 'KWAH-troh', translation: 'four' },
            { id: '5', type: 'word', value: 'cinco', pronunciation: 'SEEN-koh', translation: 'five' }
          ]
        },
        isCompleted: false
      }
    ]
  },
  {
    id: 'basic-greetings',
    type: 'dialogue',
    title: 'Basic Greetings',
    description: 'Common ways to say hello and goodbye',
    icon: '👋',
    difficulty: 'beginner',
    estimatedTime: 20,
    xpReward: 75,
    isLocked: false,
    language: 'es',
    subModules: [
      {
        id: 'hello-goodbye',
        title: 'Hello & Goodbye',
        type: 'lesson',
        content: {
          instructions: 'Learn basic greetings in Spanish',
          items: [
            { id: 'hola', type: 'word', value: 'Hola', pronunciation: 'OH-lah', translation: 'Hello' },
            { id: 'adios', type: 'word', value: 'Adiós', pronunciation: 'ah-DYOHS', translation: 'Goodbye' },
            { id: 'buenos-dias', type: 'sentence', value: 'Buenos días', pronunciation: 'BWAY-nohs DEE-ahs', translation: 'Good morning' }
          ]
        },
        isCompleted: false
      }
    ]
  }
];

// Initialize lessons
sampleLessons.forEach(lesson => {
  lessons.set(lesson.id, lesson);
});

export const getLessonsProcedure = publicProcedure
  .input(z.object({
    language: z.string().optional(),
    type: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional()
  }))
  .query(({ input }) => {
    let filteredLessons = Array.from(lessons.values());
    
    if (input.language) {
      filteredLessons = filteredLessons.filter(lesson => lesson.language === input.language);
    }
    
    if (input.type) {
      filteredLessons = filteredLessons.filter(lesson => lesson.type === input.type);
    }
    
    if (input.difficulty) {
      filteredLessons = filteredLessons.filter(lesson => lesson.difficulty === input.difficulty);
    }
    
    return filteredLessons;
  });

export const getLessonProcedure = publicProcedure
  .input(z.object({
    id: z.string()
  }))
  .query(({ input }) => {
    const lesson = lessons.get(input.id);
    if (!lesson) {
      throw new Error('Lesson not found');
    }
    return lesson;
  });

export const getUserProgressProcedure = protectedProcedure
  .input(z.object({
    language: z.string().optional()
  }))
  .query(({ ctx, input }) => {
    const key = `${ctx.userId}-${input.language || 'all'}`;
    const progress = userProgress.get(key) || {
      userId: ctx.userId,
      language: input.language || 'all',
      modules: [],
      overallProgress: 0,
      dailyGoal: 15,
      dailyProgress: 0,
      streakDays: 0,
      totalXP: 0,
      achievements: [],
      weakAreas: [],
      strongAreas: []
    };
    return progress;
  });

export const updateLessonProgressProcedure = protectedProcedure
  .input(z.object({
    lessonId: z.string(),
    subModuleId: z.string(),
    completed: z.boolean(),
    score: z.number().min(0).max(100).optional(),
    timeSpent: z.number().min(0).optional(),
    xpEarned: z.number().min(0).optional()
  }))
  .mutation(({ ctx, input }) => {
    const lesson = lessons.get(input.lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }
    
    const key = `${ctx.userId}-${lesson.language}`;
    const progress = userProgress.get(key) || {
      userId: ctx.userId,
      language: lesson.language,
      modules: [],
      overallProgress: 0,
      dailyGoal: 15,
      dailyProgress: 0,
      streakDays: 0,
      totalXP: 0,
      achievements: [],
      weakAreas: [],
      strongAreas: []
    };
    
    // Update module progress
    let moduleProgress = progress.modules.find((m: any) => m.moduleId === input.lessonId);
    if (!moduleProgress) {
      moduleProgress = {
        moduleId: input.lessonId,
        progress: 0,
        lastPracticed: new Date(),
        totalTime: 0,
        accuracy: 0,
        completedSubModules: [],
        masteryLevel: 'learning'
      };
      progress.modules.push(moduleProgress);
    }
    
    if (input.completed && !moduleProgress.completedSubModules.includes(input.subModuleId)) {
      moduleProgress.completedSubModules.push(input.subModuleId);
    }
    
    moduleProgress.lastPracticed = new Date();
    if (input.timeSpent) {
      moduleProgress.totalTime += input.timeSpent;
      progress.dailyProgress += input.timeSpent;
    }
    
    if (input.score !== undefined) {
      const totalAttempts = moduleProgress.completedSubModules.length;
      moduleProgress.accuracy = ((moduleProgress.accuracy * (totalAttempts - 1)) + input.score) / totalAttempts;
    }
    
    if (input.xpEarned) {
      progress.totalXP += input.xpEarned;
    }
    
    // Calculate overall progress
    const totalSubModules = lesson.subModules?.length || 1;
    moduleProgress.progress = (moduleProgress.completedSubModules.length / totalSubModules) * 100;
    
    // Update mastery level
    if (moduleProgress.progress === 100 && moduleProgress.accuracy >= 90) {
      moduleProgress.masteryLevel = 'mastered';
    } else if (moduleProgress.progress >= 50) {
      moduleProgress.masteryLevel = 'practicing';
    }
    
    userProgress.set(key, progress);
    return progress;
  });

export const getRecommendedLessonsProcedure = protectedProcedure
  .input(z.object({
    language: z.string(),
    limit: z.number().min(1).max(10).default(5)
  }))
  .query(({ ctx, input }) => {
    const key = `${ctx.userId}-${input.language}`;
    const progress = userProgress.get(key);
    
    let availableLessons = Array.from(lessons.values())
      .filter(lesson => lesson.language === input.language);
    
    if (progress) {
      const completedModules = progress.modules
        .filter((m: any) => m.progress === 100)
        .map((m: any) => m.moduleId);
      
      availableLessons = availableLessons.filter(lesson => 
        !completedModules.includes(lesson.id)
      );
    }
    
    // Sort by difficulty and return limited results
    return availableLessons
      .sort((a, b) => {
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - 
               difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
      })
      .slice(0, input.limit);
  });

export const getDailyChallengeProcedure = protectedProcedure
  .input(z.object({
    date: z.string().optional()
  }))
  .query(({ ctx, input }) => {
    const date = input.date || new Date().toISOString().split('T')[0];
    
    return {
      id: `challenge-${date}`,
      date,
      challenges: [
        {
          id: 'daily-practice',
          type: 'practice',
          description: 'Complete 3 lessons today',
          target: 3,
          current: 0,
          xpReward: 100,
          completed: false
        },
        {
          id: 'accuracy-challenge',
          type: 'accuracy',
          description: 'Achieve 90% accuracy in any lesson',
          target: 90,
          current: 0,
          xpReward: 50,
          completed: false
        }
      ],
      totalXPReward: 150,
      completed: false
    };
  });