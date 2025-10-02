import { LessonRequestSchema, GetLessonsSchema, VocabularyAddSchema } from '@/schemas/lessons';

describe('Lesson Schemas', () => {
  describe('LessonRequestSchema', () => {
    it('should validate a valid lesson request', () => {
      const validRequest = {
        lang: 'pa',
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        level: 5,
      };

      const result = LessonRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid language code', () => {
      const invalidRequest = {
        lang: 'invalid',
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        level: 5,
      };

      const result = LessonRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject level out of range', () => {
      const invalidRequest = {
        lang: 'pa',
        unitId: '123e4567-e89b-12d3-a456-426614174000',
        level: 15,
      };

      const result = LessonRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('GetLessonsSchema', () => {
    it('should apply default values', () => {
      const result = GetLessonsSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should validate with optional filters', () => {
      const request = {
        language: 'pa',
        level: 3,
        completed: true,
        page: 2,
        limit: 50,
      };

      const result = GetLessonsSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.language).toBe('pa');
        expect(result.data.level).toBe(3);
      }
    });
  });

  describe('VocabularyAddSchema', () => {
    it('should validate a complete vocabulary entry', () => {
      const entry = {
        word: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
        translation: 'Hello (formal greeting)',
        language: 'pa',
        notes: 'Traditional Sikh greeting',
      };

      const result = VocabularyAddSchema.safeParse(entry);
      expect(result.success).toBe(true);
    });

    it('should reject empty word', () => {
      const entry = {
        word: '',
        translation: 'Hello',
        language: 'pa',
      };

      const result = VocabularyAddSchema.safeParse(entry);
      expect(result.success).toBe(false);
    });

    it('should reject word that is too long', () => {
      const entry = {
        word: 'a'.repeat(101),
        translation: 'Hello',
        language: 'pa',
      };

      const result = VocabularyAddSchema.safeParse(entry);
      expect(result.success).toBe(false);
    });
  });
});
