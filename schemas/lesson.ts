import { z } from 'zod';

export const LessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().min(1).max(50),
  language: z.string().min(2).max(5),
  estimatedDuration: z.number().int().positive().max(3600), // in seconds
  content: z.object({
    instructions: z.string().min(1),
    exercises: z.array(z.object({
      id: z.string(),
      type: z.enum(['multiple_choice', 'fill_blank', 'translation', 'speaking']),
      question: z.string().min(1),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().min(1),
      explanation: z.string().optional(),
    })),
  }),
  prerequisites: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  isPublished: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const LessonProgressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  lessonId: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
  progress: z.number().min(0).max(100),
  timeSpent: z.number().int().min(0), // in seconds
  score: z.number().min(0).max(100).optional(),
  completedAt: z.string().datetime().optional(),
  lastAccessedAt: z.string().datetime(),
  answers: z.array(z.object({
    exerciseId: z.string(),
    userAnswer: z.string(),
    isCorrect: z.boolean(),
    timeSpent: z.number().int().min(0),
  })).optional(),
});

export const LessonSearchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  language: z.string().min(2).max(5).optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['title', 'difficulty', 'createdAt', 'popularity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const LessonCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string().min(1).max(50),
  language: z.string().min(2).max(5),
  estimatedDuration: z.number().int().positive().max(3600),
  content: z.object({
    instructions: z.string().min(1),
    exercises: z.array(z.object({
      type: z.enum(['multiple_choice', 'fill_blank', 'translation', 'speaking']),
      question: z.string().min(1),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().min(1),
      explanation: z.string().optional(),
    })).min(1),
  }),
  prerequisites: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const LessonUpdateSchema = LessonCreateSchema.partial();

export type Lesson = z.infer<typeof LessonSchema>;
export type LessonProgress = z.infer<typeof LessonProgressSchema>;
export type LessonSearch = z.infer<typeof LessonSearchSchema>;
export type LessonCreate = z.infer<typeof LessonCreateSchema>;
export type LessonUpdate = z.infer<typeof LessonUpdateSchema>;