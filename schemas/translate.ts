import { z } from 'zod';

export const TranslationRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLanguage: z.string().min(2).max(5),
  targetLanguage: z.string().min(2).max(5),
  context: z.string().max(500).optional(),
  preserveFormatting: z.boolean().default(true),
  includeAlternatives: z.boolean().default(false),
});

export const TranslationResponseSchema = z.object({
  id: z.string().uuid(),
  originalText: z.string(),
  translatedText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.object({
    text: z.string(),
    confidence: z.number().min(0).max(1),
  })).optional(),
  context: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const TranslationHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  originalText: z.string(),
  translatedText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string().max(30)).max(10).optional(),
  createdAt: z.string().datetime(),
  lastAccessedAt: z.string().datetime(),
});

export const TranslationBatchSchema = z.object({
  translations: z.array(TranslationRequestSchema).min(1).max(10),
  batchId: z.string().uuid().optional(),
});

export const TranslationSearchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  sourceLanguage: z.string().min(2).max(5).optional(),
  targetLanguage: z.string().min(2).max(5).optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'lastAccessedAt', 'originalText']).default('lastAccessedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const TranslationFeedbackSchema = z.object({
  translationId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(500).optional(),
  isAccurate: z.boolean(),
  suggestedImprovement: z.string().max(1000).optional(),
});

export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;
export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;
export type TranslationHistory = z.infer<typeof TranslationHistorySchema>;
export type TranslationBatch = z.infer<typeof TranslationBatchSchema>;
export type TranslationSearch = z.infer<typeof TranslationSearchSchema>;
export type TranslationFeedback = z.infer<typeof TranslationFeedbackSchema>;