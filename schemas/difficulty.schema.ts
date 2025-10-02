import { z } from 'zod';

export const Difficulty = z.enum(['beginner', 'intermediate', 'advanced']);
export type Difficulty = z.infer<typeof Difficulty>;

export const DifficultyParams = z.object({
  key: Difficulty,
  label: z.string(),
  targetAccuracy: z.number().min(0.5).max(0.99),
  maxRetries: z.number().int().min(0),
  showHints: z.boolean(),
  showTranslations: z.boolean(),
  speechRate: z.number().min(0.5).max(1.5),
  itemsPerSession: z.number().int().min(3).max(30),
  exerciseMix: z.array(
    z.tuple([
      z.enum(['mcq', 'typing', 'gap', 'pairs', 'order', 'listen', 'speak']),
      z.number().min(0).max(1),
    ])
  ).min(1),
  srsIntervals: z.array(z.number()).min(3),
  xpPerCorrect: z.number().int().min(1),
  penaltyPerWrong: z.number().int().min(0),
});
export type DifficultyParams = z.infer<typeof DifficultyParams>;

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyParams> = {
  beginner: {
    key: 'beginner',
    label: 'Beginner',
    targetAccuracy: 0.75,
    maxRetries: 2,
    showHints: true,
    showTranslations: true,
    speechRate: 0.85,
    itemsPerSession: 6,
    exerciseMix: [
      ['mcq', 0.4],
      ['pairs', 0.2],
      ['gap', 0.2],
      ['listen', 0.2],
    ],
    srsIntervals: [15, 60, 360, 1440],
    xpPerCorrect: 8,
    penaltyPerWrong: 0,
  },
  intermediate: {
    key: 'intermediate',
    label: 'Intermediate',
    targetAccuracy: 0.82,
    maxRetries: 1,
    showHints: true,
    showTranslations: false,
    speechRate: 1.0,
    itemsPerSession: 10,
    exerciseMix: [
      ['gap', 0.25],
      ['typing', 0.25],
      ['listen', 0.25],
      ['speak', 0.25],
    ],
    srsIntervals: [10, 120, 720, 2880],
    xpPerCorrect: 10,
    penaltyPerWrong: 2,
  },
  advanced: {
    key: 'advanced',
    label: 'Advanced',
    targetAccuracy: 0.9,
    maxRetries: 0,
    showHints: false,
    showTranslations: false,
    speechRate: 1.15,
    itemsPerSession: 14,
    exerciseMix: [
      ['typing', 0.35],
      ['order', 0.2],
      ['listen', 0.25],
      ['speak', 0.2],
    ],
    srsIntervals: [5, 240, 1440, 4320],
    xpPerCorrect: 12,
    penaltyPerWrong: 4,
  },
};
