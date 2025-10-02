import { z } from 'zod';
import { UUID, BCP47, BoundedInt, AudioFileRef } from './common';

export const LessonRequestSchema = z.object({
  lang: BCP47,
  unitId: UUID,
  level: BoundedInt(1, 10, 'LEVEL_OUT_OF_RANGE'),
});

export const ReviewSubmitSchema = z.object({
  cardId: UUID,
  quality: BoundedInt(0, 5, 'QUALITY_OUT_OF_RANGE'),
  timeTakenMs: BoundedInt(0, 300_000, 'TIME_TAKEN_INVALID'),
});

export const SpeechUploadMetaSchema = z.object({
  lessonId: UUID,
  durationMs: BoundedInt(250, 120_000, 'AUDIO_DURATION_INVALID'),
  mime: z.enum(['audio/webm', 'audio/m4a'], { message: 'MIME_NOT_ALLOWED' }),
  sizeBytes: z.number().max(8_000_000, 'FILE_TOO_LARGE'),
});

export const LessonProgressSchema = z.object({
  lessonId: UUID,
  completed: z.boolean(),
  score: BoundedInt(0, 100, 'SCORE_OUT_OF_RANGE').optional(),
  timeSpentMs: z.number().nonnegative('TIME_SPENT_INVALID'),
  mistakes: z.number().nonnegative('MISTAKES_INVALID').optional(),
});

export const QuizSubmitSchema = z.object({
  quizId: UUID,
  answers: z.array(
    z.object({
      questionId: UUID,
      answer: z.string().max(1000, 'ANSWER_TOO_LONG'),
      timeTakenMs: z.number().nonnegative('TIME_TAKEN_INVALID'),
    })
  ).min(1, 'NO_ANSWERS_PROVIDED'),
});

export const VocabularyAddSchema = z.object({
  word: z.string().min(1, 'WORD_REQUIRED').max(100, 'WORD_TOO_LONG'),
  translation: z.string().min(1, 'TRANSLATION_REQUIRED').max(200, 'TRANSLATION_TOO_LONG'),
  language: BCP47,
  notes: z.string().max(500, 'NOTES_TOO_LONG').optional(),
  audio: AudioFileRef.optional(),
});

export const GetLessonsSchema = z.object({
  language: BCP47.optional(),
  level: BoundedInt(1, 10, 'LEVEL_OUT_OF_RANGE').optional(),
  completed: z.boolean().optional(),
  page: z.number().positive('PAGE_INVALID').default(1),
  limit: BoundedInt(1, 100, 'LIMIT_OUT_OF_RANGE').default(20),
});

export type LessonRequestInput = z.infer<typeof LessonRequestSchema>;
export type ReviewSubmitInput = z.infer<typeof ReviewSubmitSchema>;
export type SpeechUploadMetaInput = z.infer<typeof SpeechUploadMetaSchema>;
export type LessonProgressInput = z.infer<typeof LessonProgressSchema>;
export type QuizSubmitInput = z.infer<typeof QuizSubmitSchema>;
export type VocabularyAddInput = z.infer<typeof VocabularyAddSchema>;
export type GetLessonsInput = z.infer<typeof GetLessonsSchema>;
