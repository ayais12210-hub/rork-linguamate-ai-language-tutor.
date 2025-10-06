import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';

/**
 * Tests for validation middleware utilities
 */

// Mock the validation middleware helper functions
const CommonSchemas = {
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).optional(),
  }),

  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),

  search: z.object({
    q: z.string().min(1).max(256).optional(),
    query: z.string().min(1).max(256).optional(),
  }),

  id: z.object({
    id: z.string().uuid(),
  }),

  language: z.object({
    language: z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/),
  }),

  dateRange: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    { message: 'startDate must be before or equal to endDate' }
  ),
};

describe('Validation Middleware', () => {
  describe('Pagination schema', () => {
    it('should accept valid pagination parameters', () => {
      const validInputs = [
        { page: 1, limit: 20 },
        { page: 5, limit: 50 },
        { page: 1, limit: 100, offset: 0 },
        { page: 2, limit: 10, offset: 10 },
      ];

      validInputs.forEach(input => {
        expect(() => CommonSchemas.pagination.parse(input)).not.toThrow();
      });
    });

    it('should apply default values', () => {
      const result = CommonSchemas.pagination.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should coerce string values to numbers', () => {
      const input = { page: '5', limit: '30' };
      const result = CommonSchemas.pagination.parse(input);
      expect(result.page).toBe(5);
      expect(result.limit).toBe(30);
    });

    it('should reject invalid pagination parameters', () => {
      const invalidInputs = [
        { page: 0, limit: 20 },
        { page: -1, limit: 20 },
        { page: 1, limit: 0 },
        { page: 1, limit: 101 },
        { page: 1.5, limit: 20 },
        { page: 1, limit: 20, offset: -1 },
      ];

      invalidInputs.forEach(input => {
        expect(() => CommonSchemas.pagination.parse(input)).toThrow();
      });
    });
  });

  describe('Sorting schema', () => {
    it('should accept valid sorting parameters', () => {
      const validInputs = [
        { sortBy: 'name', sortOrder: 'asc' as const },
        { sortBy: 'createdAt', sortOrder: 'desc' as const },
        { sortOrder: 'asc' as const },
        {},
      ];

      validInputs.forEach(input => {
        expect(() => CommonSchemas.sorting.parse(input)).not.toThrow();
      });
    });

    it('should apply default sort order', () => {
      const result = CommonSchemas.sorting.parse({});
      expect(result.sortOrder).toBe('asc');
    });

    it('should reject invalid sort orders', () => {
      const invalidInputs = [
        { sortOrder: 'ascending' },
        { sortOrder: 'descending' },
        { sortOrder: 'ASC' },
      ];

      invalidInputs.forEach(input => {
        expect(() => CommonSchemas.sorting.parse(input)).toThrow();
      });
    });
  });

  describe('Search schema', () => {
    it('should accept valid search queries', () => {
      const validInputs = [
        { q: 'test' },
        { query: 'hello world' },
        { q: 'a' },
        { q: 'x'.repeat(256) },
        {},
      ];

      validInputs.forEach(input => {
        expect(() => CommonSchemas.search.parse(input)).not.toThrow();
      });
    });

    it('should reject invalid search queries', () => {
      const invalidInputs = [
        { q: '' },
        { q: 'x'.repeat(257) },
        { query: '' },
        { query: 'x'.repeat(257) },
      ];

      invalidInputs.forEach(input => {
        expect(() => CommonSchemas.search.parse(input)).toThrow();
      });
    });
  });

  describe('ID schema', () => {
    it('should accept valid UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      ];

      validUUIDs.forEach(id => {
        expect(() => CommonSchemas.id.parse({ id })).not.toThrow();
      });
    });

    it('should reject invalid UUIDs', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
      ];

      invalidUUIDs.forEach(id => {
        expect(() => CommonSchemas.id.parse({ id })).toThrow();
      });
    });
  });

  describe('Language schema', () => {
    it('should accept valid BCP47 language codes', () => {
      const validCodes = [
        'en',
        'es',
        'fr',
        'de',
        'pa-IN',
        'en-US',
        'zh-CN',
      ];

      validCodes.forEach(language => {
        expect(() => CommonSchemas.language.parse({ language })).not.toThrow();
      });
    });

    it('should reject invalid language codes', () => {
      const invalidCodes = [
        'EN',
        'english',
        'en-us',
        'e',
        'en-USA',
        'en_US',
      ];

      invalidCodes.forEach(language => {
        expect(() => CommonSchemas.language.parse({ language })).toThrow();
      });
    });
  });

  describe('Date range schema', () => {
    it('should accept valid date ranges', () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 86400000);
      
      const validInputs = [
        { startDate: now, endDate: tomorrow },
        { startDate: now, endDate: now },
        { startDate: now },
        { endDate: tomorrow },
        {},
      ];

      validInputs.forEach(input => {
        expect(() => CommonSchemas.dateRange.parse(input)).not.toThrow();
      });
    });

    it('should coerce date strings to Date objects', () => {
      const input = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };
      
      const result = CommonSchemas.dateRange.parse(input);
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should reject invalid date ranges', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      
      const invalidInputs = [
        { startDate: now, endDate: yesterday },
      ];

      invalidInputs.forEach(input => {
        expect(() => CommonSchemas.dateRange.parse(input)).toThrow();
      });
    });
  });

  describe('Error formatting', () => {
    it('should provide structured error messages', () => {
      try {
        CommonSchemas.pagination.parse({ page: -1, limit: 200 });
      } catch (error: any) {
        expect(error.errors).toBeDefined();
        expect(error.errors.length).toBeGreaterThan(0);
        expect(error.errors[0]).toHaveProperty('path');
        expect(error.errors[0]).toHaveProperty('message');
      }
    });
  });

  describe('Schema composition', () => {
    it('should allow combining multiple schemas', () => {
      const CombinedSchema = z.object({
        ...CommonSchemas.pagination.shape,
        ...CommonSchemas.sorting.shape,
      });

      const validInput = {
        page: 2,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'desc' as const,
      };

      expect(() => CombinedSchema.parse(validInput)).not.toThrow();
    });

    it('should allow extending schemas with custom fields', () => {
      const ExtendedSchema = CommonSchemas.pagination.extend({
        search: z.string().optional(),
      });

      const validInput = {
        page: 1,
        limit: 20,
        search: 'test',
      };

      expect(() => ExtendedSchema.parse(validInput)).not.toThrow();
    });
  });
});
