import { z } from 'zod';

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  meta: z.object({
    timestamp: z.date(),
    requestId: z.string().uuid(),
    version: z.string(),
  }).optional(),
});

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: PaginationSchema,
});

// Filter schemas
export const LessonFilterSchema = z.object({
  language: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  contentType: z.enum(['lesson', 'quiz', 'flashcard', 'exercise', 'conversation']).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
});

export const UserFilterSchema = z.object({
  language: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

// Search schemas
export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  language: z.string().optional(),
  type: z.enum(['lesson', 'quiz', 'flashcard', 'all']).default('all'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export const SearchResultSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['lesson', 'quiz', 'flashcard']),
  title: z.string(),
  description: z.string().optional(),
  language: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  score: z.number().min(0).max(1),
  highlights: z.array(z.string()).optional(),
});

// Configuration schemas
export const AppConfigSchema = z.object({
  version: z.string(),
  environment: z.enum(['development', 'staging', 'production']),
  features: z.record(z.boolean()),
  limits: z.object({
    maxLessonsPerDay: z.number().positive(),
    maxQuizAttempts: z.number().positive(),
    maxAudioDuration: z.number().positive(), // seconds
    maxFileSize: z.number().positive(), // bytes
  }),
  integrations: z.object({
    openai: z.object({
      enabled: z.boolean(),
      model: z.string(),
      maxTokens: z.number().positive(),
    }),
    elevenlabs: z.object({
      enabled: z.boolean(),
      voice: z.string(),
      quality: z.enum(['low', 'medium', 'high']),
    }),
    whisper: z.object({
      enabled: z.boolean(),
      model: z.string(),
    }),
  }),
});

// Error schemas
export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    validationErrors: z.array(ValidationErrorSchema).optional(),
  }),
  meta: z.object({
    timestamp: z.date(),
    requestId: z.string().uuid(),
  }),
});

// Health check schemas
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.date(),
  services: z.record(z.object({
    status: z.enum(['up', 'down', 'degraded']),
    responseTime: z.number().positive().optional(),
    lastCheck: z.date(),
    error: z.string().optional(),
  })),
  version: z.string(),
  uptime: z.number().positive(),
});

// Export types
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data?: T };
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedResponse<T = any> = z.infer<typeof PaginatedResponseSchema> & { data: T[] };
export type LessonFilter = z.infer<typeof LessonFilterSchema>;
export type UserFilter = z.infer<typeof UserFilterSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;