/**
 * Contract Tests for API Schemas
 * 
 * Validates that Zod schemas correctly parse expected API responses.
 * Failing these tests means the API contract has changed and client code may break.
 */

import { z } from 'zod';

// Sample schemas - import from your actual schema files
// import { UserSchema, LessonSchema } from '@/schemas/...';

// Mock schemas for demonstration
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  createdAt: z.coerce.date(),
  profile: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatar: z.string().url().optional(),
  }).optional(),
});

const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number().positive(),
  content: z.array(z.object({
    type: z.enum(['text', 'image', 'audio', 'video']),
    data: z.unknown(),
  })),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const ErrorResponseSchema = z.object({
  status: z.number(),
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
});

describe('API Contract Tests - User Endpoints', () => {
  describe('GET /api/user/:id', () => {
    it('should parse valid user response', () => {
      const validResponse = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: '2025-01-01T00:00:00Z',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          avatar: 'https://example.com/avatar.jpg',
        },
      };

      const result = UserSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.profile?.firstName).toBe('Test');
      }
    });

    it('should parse user response without optional fields', () => {
      const minimalResponse = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: '2025-01-01T00:00:00Z',
      };

      const result = UserSchema.safeParse(minimalResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.profile).toBeUndefined();
      }
    });

    it('should reject invalid email format', () => {
      const invalidResponse = {
        id: 'user_123',
        email: 'not-an-email',
        username: 'testuser',
        createdAt: '2025-01-01T00:00:00Z',
      };

      const result = UserSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0]?.path).toEqual(['email']);
      }
    });

    it('should reject missing required fields', () => {
      const invalidResponse = {
        id: 'user_123',
        email: 'test@example.com',
        // missing username
        createdAt: '2025-01-01T00:00:00Z',
      };

      const result = UserSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        const missingField = result.error.issues.find(
          issue => issue.path[0] === 'username'
        );
        expect(missingField).toBeDefined();
      }
    });

    it('should coerce date strings to Date objects', () => {
      const response = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: '2025-01-01T00:00:00Z',
      };

      const result = UserSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });
  });
});

describe('API Contract Tests - Lesson Endpoints', () => {
  describe('GET /api/lessons/:id', () => {
    it('should parse valid lesson response', () => {
      const validResponse = {
        id: 'lesson_123',
        title: 'Introduction to Spanish',
        description: 'Learn the basics of Spanish',
        difficulty: 'beginner',
        duration: 30,
        content: [
          { type: 'text', data: 'Welcome to Spanish!' },
          { type: 'audio', data: { url: 'https://example.com/audio.mp3' } },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      const result = LessonSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.difficulty).toBe('beginner');
        expect(result.data.content).toHaveLength(2);
      }
    });

    it('should reject invalid difficulty level', () => {
      const invalidResponse = {
        id: 'lesson_123',
        title: 'Introduction to Spanish',
        description: 'Learn the basics of Spanish',
        difficulty: 'expert', // not in enum
        duration: 30,
        content: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      const result = LessonSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['difficulty']);
      }
    });

    it('should reject negative duration', () => {
      const invalidResponse = {
        id: 'lesson_123',
        title: 'Introduction to Spanish',
        description: 'Learn the basics of Spanish',
        difficulty: 'beginner',
        duration: -10,
        content: [],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      const result = LessonSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['duration']);
      }
    });

    it('should validate content item types', () => {
      const invalidResponse = {
        id: 'lesson_123',
        title: 'Introduction to Spanish',
        description: 'Learn the basics of Spanish',
        difficulty: 'beginner',
        duration: 30,
        content: [
          { type: 'invalid-type', data: 'Some data' }, // invalid type
        ],
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      };

      const result = LessonSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['content', 0, 'type']);
      }
    });
  });
});

describe('API Contract Tests - Error Responses', () => {
  it('should parse standard error response', () => {
    const errorResponse = {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: { field: 'email', reason: 'Invalid format' },
      requestId: 'req_123abc',
    };

    const result = ErrorResponseSchema.safeParse(errorResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('VALIDATION_ERROR');
      expect(result.data.requestId).toBe('req_123abc');
    }
  });

  it('should parse minimal error response', () => {
    const minimalError = {
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    };

    const result = ErrorResponseSchema.safeParse(minimalError);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.details).toBeUndefined();
      expect(result.data.requestId).toBeUndefined();
    }
  });

  it('should reject error response without required fields', () => {
    const invalidError = {
      status: 400,
      // missing code and message
    };

    const result = ErrorResponseSchema.safeParse(invalidError);
    expect(result.success).toBe(false);
  });
});

describe('Schema Evolution Tests', () => {
  it('should be backward compatible with old response format', () => {
    // Test that new schema can still parse old API responses
    const oldFormatResponse = {
      id: 'user_123',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: '2025-01-01T00:00:00Z',
      // Old format didn't have profile field
    };

    const result = UserSchema.safeParse(oldFormatResponse);
    expect(result.success).toBe(true);
  });

  it('should handle extra fields gracefully', () => {
    // By default, Zod strips unknown fields
    const responseWithExtraFields = {
      id: 'user_123',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: '2025-01-01T00:00:00Z',
      newField: 'This is a new field from API',
      anotherNewField: 123,
    };

    const result = UserSchema.safeParse(responseWithExtraFields);
    expect(result.success).toBe(true);
    if (result.success) {
      // Extra fields should be stripped
      expect('newField' in result.data).toBe(false);
      expect('anotherNewField' in result.data).toBe(false);
    }
  });
});

describe('Edge Cases and Boundaries', () => {
  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000);
    const response = {
      id: 'user_123',
      email: 'test@example.com',
      username: longString,
      createdAt: '2025-01-01T00:00:00Z',
    };

    const result = UserSchema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toHaveLength(10000);
    }
  });

  it('should handle empty arrays', () => {
    const response = {
      id: 'lesson_123',
      title: 'Empty Lesson',
      description: 'A lesson with no content',
      difficulty: 'beginner',
      duration: 1,
      content: [], // empty array
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    const result = LessonSchema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toHaveLength(0);
    }
  });

  it('should handle null values appropriately', () => {
    const responseWithNull = {
      id: 'user_123',
      email: 'test@example.com',
      username: 'testuser',
      createdAt: '2025-01-01T00:00:00Z',
      profile: null, // null instead of undefined
    };

    const result = UserSchema.safeParse(responseWithNull);
    // Should fail because profile expects object or undefined, not null
    expect(result.success).toBe(false);
  });
});
