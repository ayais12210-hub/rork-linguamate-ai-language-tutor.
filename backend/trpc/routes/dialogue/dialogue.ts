import { z } from 'zod';
import { randomUUID } from 'crypto';
import { publicProcedure, createTRPCRouter } from '../../create-context';
import { TurnSchema, ScoreSchema } from '@/schemas/dialogue.schema';
import {
  getTopics,
  getScenesByTopic,
  getSceneById,
  createSession,
  getSession,
  updateSession,
} from './data';
import { checkSafety } from './safety';
import { scoreSemanticServer } from './scorer';

export const dialogueRouter = createTRPCRouter({
  getTopics: publicProcedure.query(() => {
    return getTopics();
  }),

  getScenes: publicProcedure
    .input(z.object({ topicId: z.string().uuid() }))
    .query(({ input }) => {
      return getScenesByTopic(input.topicId);
    }),

  startSession: publicProcedure
    .input(
      z.object({
        sceneId: z.string().uuid(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
      })
    )
    .mutation(({ input }) => {
      const scene = getSceneById(input.sceneId);
      if (!scene) {
        throw new Error('Scene not found');
      }

      const session = createSession(input.sceneId, input.difficulty);
      console.log('[Dialogue] Session started:', session.id);
      return session;
    }),

  submitTurn: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        text: z.string().min(1),
        meta: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(({ input }) => {
      const session = getSession(input.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const safetyCheck = checkSafety(input.text);
      const scene = getSceneById(session.sceneId);
      if (!safetyCheck.safe) {
        return {
          score: {
            turnId: randomUUID(),
            accuracy: 0,
            fluency: 0,
            keywordsHit: [],
            feedback: 'Let\'s keep our conversation appropriate and respectful.',
          } as Omit<z.infer<typeof ScoreSchema>, 'turnId'> & { turnId: string },
          coachFeedback: 'Please use appropriate language.',
        };
      }

      const turn: z.infer<typeof TurnSchema> = {
        id: randomUUID(),
        role: 'user',
        text: safetyCheck.sanitized,
        lang: session.difficulty === 'beginner' ? 'en' : 'en',
        timeMs: Date.now(),
      };

      const score: Omit<z.infer<typeof ScoreSchema>, 'turnId'> & { turnId: string } = {
        turnId: turn.id,
        accuracy: 0.8,
        fluency: 0.75,
        keywordsHit: [],
        feedback: 'Good job! Keep practicing.',
      };

      updateSession(input.sessionId, {
        turns: [...session.turns, turn],
        scores: [...session.scores, score],
      });

      console.log('[Dialogue] Turn submitted:', turn.id);

      return {
        score,
        coachFeedback: score.feedback ?? 'Keep going!',
      };
    }),

  endSession: publicProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(({ input }) => {
      const session = getSession(input.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const updated = updateSession(input.sessionId, {
        endedAt: Date.now(),
      });

      console.log('[Dialogue] Session ended:', input.sessionId);
      return updated;
    }),

  getTranscript: publicProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(({ input }) => {
      const session = getSession(input.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      return session;
    }),

  scoreSemantic: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        goal: z.string(),
        lang: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await scoreSemanticServer(input.text, input.goal, input.lang);
      return result;
    }),
});

export default dialogueRouter;
