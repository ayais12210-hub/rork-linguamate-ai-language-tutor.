import { z } from 'zod';

// Base schemas
export const LanguageCodeSchema = z.enum([
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
]);

export const DifficultyLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

export const ContentTypeSchema = z.enum(['lesson', 'quiz', 'flashcard', 'exercise', 'conversation']);

// Lesson schemas
export const LessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  language: LanguageCodeSchema,
  targetLanguage: LanguageCodeSchema,
  difficulty: DifficultyLevelSchema,
  contentType: ContentTypeSchema,
  content: z.object({
    text: z.string().min(1),
    audioUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
  }),
  translations: z.array(z.object({
    language: LanguageCodeSchema,
    text: z.string().min(1),
    audioUrl: z.string().url().optional(),
  })),
  vocabulary: z.array(z.object({
    word: z.string().min(1),
    translation: z.string().min(1),
    pronunciation: z.string().optional(),
    audioUrl: z.string().url().optional(),
    difficulty: DifficultyLevelSchema,
  })),
  grammar: z.array(z.object({
    rule: z.string().min(1),
    examples: z.array(z.string()),
    explanation: z.string().optional(),
  })).optional(),
  estimatedDuration: z.number().positive(), // minutes
  prerequisites: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Quiz schemas
export const QuizItemSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  type: z.enum(['multiple-choice', 'fill-blank', 'translation', 'pronunciation', 'listening']),
  question: z.string().min(1),
  options: z.array(z.string()).optional(), // for multiple choice
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  audioUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  difficulty: DifficultyLevelSchema,
  points: z.number().positive(),
  timeLimit: z.number().positive().optional(), // seconds
  hints: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const QuizAttemptSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  quizItemId: z.string().uuid(),
  answer: z.string(),
  isCorrect: z.boolean(),
  timeSpent: z.number().positive(), // seconds
  hintsUsed: z.number().min(0),
  attemptedAt: z.date(),
});

// Flashcard schemas
export const FlashcardSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
  front: z.string().min(1),
  back: z.string().min(1),
  audioUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  difficulty: DifficultyLevelSchema,
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SpacedRepetitionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  flashcardId: z.string().uuid(),
  interval: z.number().positive(), // days
  repetitions: z.number().min(0),
  easeFactor: z.number().min(1.3).max(2.5),
  nextReview: z.date(),
  lastReviewed: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Speech schemas
export const PronunciationScoreSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  text: z.string().min(1),
  audioUrl: z.string().url(),
  language: LanguageCodeSchema,
  scores: z.object({
    overall: z.number().min(0).max(100),
    accuracy: z.number().min(0).max(100),
    fluency: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
  }),
  phonemes: z.array(z.object({
    phoneme: z.string(),
    accuracy: z.number().min(0).max(100),
    timing: z.object({
      start: z.number().positive(),
      end: z.number().positive(),
    }),
  })).optional(),
  feedback: z.array(z.string()).optional(),
  createdAt: z.date(),
});

export const TranscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  audioUrl: z.string().url(),
  language: LanguageCodeSchema,
  text: z.string(),
  confidence: z.number().min(0).max(1),
  segments: z.array(z.object({
    text: z.string(),
    start: z.number().positive(),
    end: z.number().positive(),
    confidence: z.number().min(0).max(1),
  })),
  createdAt: z.date(),
});

// Translation schemas
export const TranslationTaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  sourceText: z.string().min(1),
  sourceLanguage: LanguageCodeSchema,
  targetLanguage: LanguageCodeSchema,
  translation: z.string().min(1),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.string()).optional(),
  context: z.string().optional(),
  createdAt: z.date(),
});

// AI Coach schemas
export const CoachTipSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
  type: z.enum(['grammar', 'pronunciation', 'vocabulary', 'cultural', 'motivation']),
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']),
  isRead: z.boolean().default(false),
  createdAt: z.date(),
});

export const CoachFeedbackSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(['lesson', 'quiz', 'conversation', 'pronunciation']),
  feedback: z.string().min(1),
  suggestions: z.array(z.string()),
  score: z.number().min(0).max(100).optional(),
  strengths: z.array(z.string()).optional(),
  areasForImprovement: z.array(z.string()).optional(),
  createdAt: z.date(),
});

// User Progress schemas
export const UserProgressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  lessonId: z.string().uuid(),
  status: z.enum(['not-started', 'in-progress', 'completed', 'mastered']),
  progress: z.number().min(0).max(100),
  timeSpent: z.number().min(0), // minutes
  lastAccessed: z.date(),
  completedAt: z.date().optional(),
  masteryLevel: z.number().min(0).max(100).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LearningStreakSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  language: LanguageCodeSchema,
  currentStreak: z.number().min(0),
  longestStreak: z.number().min(0),
  lastActivityDate: z.date(),
  totalDaysLearned: z.number().min(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Analytics schemas
export const LearningSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  language: LanguageCodeSchema,
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().positive().optional(), // minutes
  activities: z.array(z.object({
    type: z.enum(['lesson', 'quiz', 'flashcard', 'conversation']),
    id: z.string().uuid(),
    duration: z.number().positive(),
    score: z.number().min(0).max(100).optional(),
  })),
  totalScore: z.number().min(0).max(100).optional(),
  createdAt: z.date(),
});

// Export types
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;
export type ContentType = z.infer<typeof ContentTypeSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type QuizItem = z.infer<typeof QuizItemSchema>;
export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
export type SpacedRepetition = z.infer<typeof SpacedRepetitionSchema>;
export type PronunciationScore = z.infer<typeof PronunciationScoreSchema>;
export type Transcription = z.infer<typeof TranscriptionSchema>;
export type TranslationTask = z.infer<typeof TranslationTaskSchema>;
export type CoachTip = z.infer<typeof CoachTipSchema>;
export type CoachFeedback = z.infer<typeof CoachFeedbackSchema>;
export type UserProgress = z.infer<typeof UserProgressSchema>;
export type LearningStreak = z.infer<typeof LearningStreakSchema>;
export type LearningSession = z.infer<typeof LearningSessionSchema>;