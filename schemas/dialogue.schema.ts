import { z } from 'zod';

export const TurnRole = z.enum(['system', 'coach', 'user', 'npc']);

export const TurnSchema = z.object({
  id: z.string().uuid(),
  role: TurnRole,
  text: z.string().min(1),
  audioUrl: z.string().url().optional(),
  lang: z.string(),
  timeMs: z.number().int().nonnegative().optional(),
});
export type Turn = z.infer<typeof TurnSchema>;

export const SceneSchema = z.object({
  id: z.string().uuid(),
  topicId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  goal: z.string(),
  starterTurns: z.array(TurnSchema),
  keyPhrases: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});
export type Scene = z.infer<typeof SceneSchema>;

export const TopicSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  sceneCount: z.number().int().nonnegative().default(0),
  completedCount: z.number().int().nonnegative().default(0),
});
export type Topic = z.infer<typeof TopicSchema>;

export const ScoreSchema = z.object({
  turnId: z.string().uuid(),
  accuracy: z.number().min(0).max(1),
  fluency: z.number().min(0).max(1),
  pronunciation: z.number().min(0).max(1).optional(),
  keywordsHit: z.array(z.string()).default([]),
  feedback: z.string().optional(),
});
export type Score = z.infer<typeof ScoreSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  sceneId: z.string().uuid(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  turns: z.array(TurnSchema),
  scores: z.array(ScoreSchema),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  srsDueAt: z.number().optional(),
});
export type Session = z.infer<typeof SessionSchema>;
