import { z } from 'zod';

// Chat schemas
export const messageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  timestamp: z.string().datetime(),
  metadata: z.object({
    confidence: z.number().min(0).max(1).optional(),
    language: z.string().length(2).optional(),
    translatedContent: z.string().optional(),
  }).optional(),
});

export const chatSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  language: z.string().length(2),
  messages: z.array(messageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.object({
    topic: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    totalMessages: z.number().int().min(0),
  }).optional(),
});

export const sendMessageRequestSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(1000),
  language: z.string().length(2),
});

export const sendMessageResponseSchema = z.object({
  message: messageSchema,
  suggestions: z.array(z.string()).optional(),
  corrections: z.array(z.object({
    original: z.string(),
    corrected: z.string(),
    explanation: z.string(),
  })).optional(),
});

export const createSessionRequestSchema = z.object({
  language: z.string().length(2),
  topic: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const createSessionResponseSchema = z.object({
  session: chatSessionSchema,
});

export const translateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  sourceLang: z.string().length(2),
  targetLang: z.string().length(2),
});

export const translateResponseSchema = z.object({
  translatedText: z.string(),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.string()).optional(),
});

// Contract tests
describe('Chat API Contract Tests', () => {
  describe('Send message endpoint', () => {
    it('should validate send message request', () => {
      const validRequest = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        content: 'Hola, ¿cómo estás?',
        language: 'es',
      };

      expect(() => sendMessageRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject invalid message requests', () => {
      const invalidRequests = [
        {
          sessionId: 'invalid-uuid',
          content: 'Hello',
          language: 'es',
        },
        {
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
          content: '', // Empty content
          language: 'es',
        },
        {
          sessionId: '123e4567-e89b-12d3-a456-426614174000',
          content: 'Hello',
          language: 'esp', // Invalid language code
        },
      ];

      invalidRequests.forEach(request => {
        expect(() => sendMessageRequestSchema.parse(request)).toThrow();
      });
    });

    it('should validate send message response with corrections', () => {
      const validResponse = {
        message: {
          id: '456e7890-e89b-12d3-a456-426614174000',
          role: 'assistant',
          content: '¡Hola! Estoy bien, gracias. ¿Y tú?',
          timestamp: '2024-01-01T12:00:00.000Z',
          metadata: {
            confidence: 0.95,
            language: 'es',
          },
        },
        suggestions: [
          '¿Qué tal tu día?',
          '¿De dónde eres?',
          '¿Qué te gusta hacer?',
        ],
        corrections: [
          {
            original: 'estás',
            corrected: 'estás',
            explanation: 'Correct! You used the right form of estar.',
          },
        ],
      };

      expect(() => sendMessageResponseSchema.parse(validResponse)).not.toThrow();
    });
  });

  describe('Create session endpoint', () => {
    it('should validate create session request', () => {
      const validRequests = [
        { language: 'fr' },
        { language: 'de', topic: 'Travel' },
        { language: 'ja', difficulty: 'intermediate' },
        { language: 'it', topic: 'Food', difficulty: 'beginner' },
      ];

      validRequests.forEach(request => {
        expect(() => createSessionRequestSchema.parse(request)).not.toThrow();
      });
    });

    it('should validate create session response', () => {
      const validResponse = {
        session: {
          id: '789e0123-e89b-12d3-a456-426614174000',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          language: 'es',
          messages: [
            {
              id: '111e2222-e89b-12d3-a456-426614174000',
              role: 'system',
              content: 'Welcome! Let\'s practice Spanish together.',
              timestamp: '2024-01-01T12:00:00.000Z',
            },
          ],
          createdAt: '2024-01-01T12:00:00.000Z',
          updatedAt: '2024-01-01T12:00:00.000Z',
          metadata: {
            topic: 'General Conversation',
            difficulty: 'beginner',
            totalMessages: 1,
          },
        },
      };

      expect(() => createSessionResponseSchema.parse(validResponse)).not.toThrow();
    });
  });

  describe('Translate endpoint', () => {
    it('should validate translate request', () => {
      const validRequest = {
        text: 'Hello, how are you?',
        sourceLang: 'en',
        targetLang: 'es',
      };

      expect(() => translateRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject translate request with invalid language codes', () => {
      const invalidRequest = {
        text: 'Hello',
        sourceLang: 'english', // Too long
        targetLang: 'es',
      };

      expect(() => translateRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should validate translate response with alternatives', () => {
      const validResponse = {
        translatedText: 'Hola, ¿cómo estás?',
        confidence: 0.98,
        alternatives: [
          'Hola, ¿qué tal?',
          'Hola, ¿cómo te va?',
        ],
      };

      expect(() => translateResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should reject invalid confidence scores', () => {
      const invalidResponses = [
        {
          translatedText: 'Hola',
          confidence: -0.1, // Negative
        },
        {
          translatedText: 'Hola',
          confidence: 1.5, // Greater than 1
        },
      ];

      invalidResponses.forEach(response => {
        expect(() => translateResponseSchema.parse(response)).toThrow();
      });
    });
  });

  describe('Message schema edge cases', () => {
    it('should handle messages with special characters', () => {
      const specialMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'user',
        content: '¿Qué significa "déjà vu"? 🤔',
        timestamp: '2024-01-01T12:00:00.000Z',
      };

      expect(() => messageSchema.parse(specialMessage)).not.toThrow();
    });

    it('should validate messages with full metadata', () => {
      const fullMetadataMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'assistant',
        content: 'That means "already seen" in French.',
        timestamp: '2024-01-01T12:00:00.000Z',
        metadata: {
          confidence: 0.99,
          language: 'en',
          translatedContent: 'Eso significa "ya visto" en francés.',
        },
      };

      expect(() => messageSchema.parse(fullMetadataMessage)).not.toThrow();
    });
  });
});