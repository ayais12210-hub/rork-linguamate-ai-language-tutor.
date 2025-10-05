// Contract tests for API request/response schemas
import { z } from 'zod';
import { httpClient } from '@/lib/http';
import { server } from '../jest.setup';
import { createMockHandler, createErrorHandler } from '../mocks/handlers';

// Define API schemas for contract testing
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  preferences: z.object({
    language: z.string(),
    theme: z.string(),
  }),
});

const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  content: z.string(),
});

const LessonsResponseSchema = z.object({
  lessons: z.array(LessonSchema),
  total: z.number(),
});

const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    timestamp: z.number(),
  }),
});

describe('API Contract Tests', () => {
  describe('User API', () => {
    it('should return valid user profile schema', async () => {
      // Test successful response
      const response = await httpClient.get('/api/user/profile', {
        headers: { Authorization: 'Bearer mock-token' },
        validateResponse: UserSchema,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe('user-123');
      expect(response.email).toBe('test@example.com');
      expect(response.preferences).toBeDefined();
    });

    it('should handle auth error with valid error schema', async () => {
      await expect(
        httpClient.get('/api/user/profile', {
          validateResponse: UserSchema,
        })
      ).rejects.toMatchObject({
        kind: 'Auth',
        code: 'HTTP_401',
      });
    });

    it('should validate profile update request', async () => {
      const updateData = {
        name: 'Updated Name',
        preferences: {
          language: 'es',
          theme: 'dark',
        },
      };

      const response = await httpClient.put('/api/user/profile', updateData, {
        headers: { Authorization: 'Bearer mock-token' },
        validateResponse: UserSchema,
      });

      expect(response.name).toBe('Updated Name');
      expect(response.preferences.language).toBe('es');
    });

    it('should handle validation error for invalid email', async () => {
      await expect(
        httpClient.put('/api/user/profile', { email: 'invalid-email' }, {
          headers: { Authorization: 'Bearer mock-token' },
          validateResponse: UserSchema,
        })
      ).rejects.toMatchObject({
        kind: 'Validation',
        code: 'HTTP_400',
      });
    });
  });

  describe('Lessons API', () => {
    it('should return valid lessons list schema', async () => {
      const response = await httpClient.get('/api/lessons', {
        validateResponse: LessonsResponseSchema,
      });

      expect(response.lessons).toHaveLength(2);
      expect(response.total).toBe(2);
      expect(response.lessons[0]).toMatchObject({
        id: 'lesson-1',
        title: 'Basic Greetings',
        difficulty: 'beginner',
      });
    });

    it('should filter lessons by difficulty', async () => {
      const response = await httpClient.get('/api/lessons?difficulty=beginner', {
        validateResponse: LessonsResponseSchema,
      });

      expect(response.lessons).toHaveLength(2);
      response.lessons.forEach(lesson => {
        expect(lesson.difficulty).toBe('beginner');
      });
    });

    it('should return single lesson with valid schema', async () => {
      const response = await httpClient.get('/api/lessons/lesson-1', {
        validateResponse: LessonSchema,
      });

      expect(response.id).toBe('lesson-1');
      expect(response.title).toBe('Basic Greetings');
    });

    it('should handle not found error', async () => {
      await expect(
        httpClient.get('/api/lessons/non-existent', {
          validateResponse: LessonSchema,
        })
      ).rejects.toMatchObject({
        kind: 'Validation',
        code: 'HTTP_404',
      });
    });
  });

  describe('Error Handling Contract Tests', () => {
    it('should handle network errors', async () => {
      await expect(
        httpClient.get('/api/network-error')
      ).rejects.toMatchObject({
        kind: 'Network',
      });
    });

    it('should handle timeout errors', async () => {
      await expect(
        httpClient.get('/api/timeout', { timeout: 1000 })
      ).rejects.toMatchObject({
        kind: 'Network',
        code: 'TIMEOUT_ERROR',
      });
    });

    it('should handle invalid JSON responses', async () => {
      await expect(
        httpClient.get('/api/invalid-json')
      ).rejects.toMatchObject({
        kind: 'Validation',
        code: 'JSON_PARSE_ERROR',
      });
    });

    it('should handle rate limit errors', async () => {
      await expect(
        httpClient.get('/api/rate-limit')
      ).rejects.toMatchObject({
        kind: 'Validation',
        code: 'HTTP_429',
      });
    });

    it('should handle server errors', async () => {
      await expect(
        httpClient.get('/api/server-error')
      ).rejects.toMatchObject({
        kind: 'Server',
        code: 'HTTP_500',
      });
    });
  });

  describe('Schema Validation Edge Cases', () => {
    it('should reject response with missing required fields', async () => {
      // Add handler that returns incomplete user data
      server.use(
        createMockHandler('get', '/api/user/incomplete', {
          id: 'user-123',
          // Missing email and name
        })
      );

      await expect(
        httpClient.get('/api/user/incomplete', {
          validateResponse: UserSchema,
        })
      ).rejects.toMatchObject({
        kind: 'Validation',
        code: 'RESPONSE_VALIDATION_ERROR',
      });
    });

    it('should reject response with wrong data types', async () => {
      server.use(
        createMockHandler('get', '/api/user/wrong-types', {
          id: 123, // Should be string
          email: 'test@example.com',
          name: 'Test User',
          preferences: {
            language: 'en',
            theme: 'light',
          },
        })
      );

      await expect(
        httpClient.get('/api/user/wrong-types', {
          validateResponse: UserSchema,
        })
      ).rejects.toMatchObject({
        kind: 'Validation',
        code: 'RESPONSE_VALIDATION_ERROR',
      });
    });

    it('should handle nested validation errors', async () => {
      server.use(
        createMockHandler('get', '/api/user/invalid-nested', {
          id: 'user-123',
          email: 'invalid-email', // Invalid email format
          name: 'Test User',
          preferences: {
            language: 'en',
            theme: 'light',
          },
        })
      );

      await expect(
        httpClient.get('/api/user/invalid-nested', {
          validateResponse: UserSchema,
        })
      ).rejects.toMatchObject({
        kind: 'Validation',
        code: 'RESPONSE_VALIDATION_ERROR',
      });
    });
  });

  describe('Retry Logic Contract Tests', () => {
    it('should retry on server errors', async () => {
      let callCount = 0;
      
      server.use(
        http.get('/api/retry-test', () => {
          callCount++;
          if (callCount < 3) {
            return createErrorHandler('get', '/api/retry-test', 'Server error', 'SERVER_ERROR', 500);
          }
          return HttpResponse.json({ success: true });
        })
      );

      const response = await httpClient.get('/api/retry-test', {
        retries: 3,
      });

      expect(response.success).toBe(true);
      expect(callCount).toBe(3);
    });

    it('should not retry on client errors', async () => {
      let callCount = 0;
      
      server.use(
        http.get('/api/no-retry-test', () => {
          callCount++;
          return createErrorHandler('get', '/api/no-retry-test', 'Bad request', 'BAD_REQUEST', 400);
        })
      );

      await expect(
        httpClient.get('/api/no-retry-test', {
          retries: 3,
        })
      ).rejects.toMatchObject({
        kind: 'Validation',
        code: 'HTTP_400',
      });

      expect(callCount).toBe(1); // Should not retry
    });
  });
});