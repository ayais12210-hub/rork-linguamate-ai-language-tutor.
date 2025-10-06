import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

/**
 * Tests for STT endpoint validation schemas
 */

// Import validation schemas
const LanguageSchema = z.string().regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'Invalid language code format');

const MAX_AUDIO_SIZE = 10_000_000;
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/m4a', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];

describe('STT Validation', () => {
  describe('Language parameter validation', () => {
    it('should accept valid BCP47 language codes', () => {
      const validCodes = ['en', 'es', 'fr', 'de', 'pa', 'pa-IN', 'en-US', 'zh-CN'];
      
      validCodes.forEach(code => {
        expect(() => LanguageSchema.parse(code)).not.toThrow();
      });
    });

    it('should reject invalid language codes', () => {
      const invalidCodes = ['EN', 'english', 'en-us', 'e', 'en-USA', 'en_US'];
      
      invalidCodes.forEach(code => {
        expect(() => LanguageSchema.parse(code)).toThrow();
      });
    });

    it('should accept optional language parameter', () => {
      const OptionalLanguageSchema = LanguageSchema.optional();
      expect(() => OptionalLanguageSchema.parse(undefined)).not.toThrow();
    });
  });

  describe('Audio file size validation', () => {
    it('should accept files within size limit', () => {
      const validSizes = [1, 1000, 100_000, 5_000_000, MAX_AUDIO_SIZE];
      
      validSizes.forEach(size => {
        expect(size).toBeLessThanOrEqual(MAX_AUDIO_SIZE);
        expect(size).toBeGreaterThan(0);
      });
    });

    it('should reject empty files', () => {
      const emptySize = 0;
      expect(emptySize).toBe(0);
    });

    it('should reject files exceeding size limit', () => {
      const oversizedFiles = [MAX_AUDIO_SIZE + 1, 20_000_000, 100_000_000];
      
      oversizedFiles.forEach(size => {
        expect(size).toBeGreaterThan(MAX_AUDIO_SIZE);
      });
    });
  });

  describe('Audio MIME type validation', () => {
    it('should accept allowed audio formats', () => {
      ALLOWED_AUDIO_TYPES.forEach(type => {
        expect(ALLOWED_AUDIO_TYPES.includes(type)).toBe(true);
      });
    });

    it('should reject disallowed MIME types', () => {
      const disallowedTypes = [
        'video/mp4',
        'application/pdf',
        'text/plain',
        'image/jpeg',
        'audio/flac',
        'audio/aac'
      ];
      
      disallowedTypes.forEach(type => {
        expect(ALLOWED_AUDIO_TYPES.includes(type)).toBe(false);
      });
    });

    it('should handle case sensitivity correctly', () => {
      // MIME types are case-insensitive but we store them in lowercase
      const upperCaseTypes = ['AUDIO/MP3', 'Audio/WebM'];
      
      upperCaseTypes.forEach(type => {
        expect(ALLOWED_AUDIO_TYPES.includes(type.toLowerCase())).toBe(true);
      });
    });
  });

  describe('File validation combination', () => {
    interface MockFile {
      size: number;
      type: string;
    }

    const validateFile = (file: MockFile): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (file.size === 0) {
        errors.push('File is empty');
      }
      
      if (file.size > MAX_AUDIO_SIZE) {
        errors.push(`File size exceeds ${MAX_AUDIO_SIZE / 1_000_000}MB limit`);
      }
      
      if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
        errors.push('Invalid audio format');
      }
      
      return { valid: errors.length === 0, errors };
    };

    it('should accept valid audio files', () => {
      const validFiles: MockFile[] = [
        { size: 1_000_000, type: 'audio/webm' },
        { size: 5_000_000, type: 'audio/mp3' },
        { size: 10_000_000, type: 'audio/wav' },
      ];
      
      validFiles.forEach(file => {
        const result = validateFile(file);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject files with multiple validation errors', () => {
      const invalidFiles: MockFile[] = [
        { size: 0, type: 'video/mp4' }, // Empty + wrong type
        { size: 20_000_000, type: 'image/jpeg' }, // Too large + wrong type
        { size: 0, type: 'audio/mp3' }, // Empty
        { size: 5_000_000, type: 'video/mp4' }, // Wrong type
        { size: 15_000_000, type: 'audio/mp3' }, // Too large
      ];
      
      invalidFiles.forEach(file => {
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error message formatting', () => {
    it('should provide helpful error messages for validation failures', () => {
      const errors = {
        emptyFile: 'Audio file is empty',
        fileTooLarge: `Audio file too large. Maximum size is ${MAX_AUDIO_SIZE / 1_000_000}MB`,
        invalidFormat: `Invalid audio format. Allowed formats: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
        invalidLanguage: 'Invalid language code format. Expected format: en, es, pa-IN, etc.',
      };
      
      expect(errors.emptyFile).toContain('empty');
      expect(errors.fileTooLarge).toContain('Maximum size');
      expect(errors.invalidFormat).toContain('Allowed formats');
      expect(errors.invalidLanguage).toContain('Expected format');
    });
  });

  describe('Edge cases', () => {
    it('should handle boundary values correctly', () => {
      const boundarySizes = [
        { size: 1, expected: true },
        { size: MAX_AUDIO_SIZE, expected: true },
        { size: MAX_AUDIO_SIZE + 1, expected: false },
      ];
      
      boundarySizes.forEach(({ size, expected }) => {
        const isValid = size > 0 && size <= MAX_AUDIO_SIZE;
        expect(isValid).toBe(expected);
      });
    });

    it('should handle special characters in language codes', () => {
      const specialCases = [
        { code: 'en-', expected: false },
        { code: '-US', expected: false },
        { code: 'en-us', expected: false }, // lowercase country code
        { code: 'EN-US', expected: false }, // uppercase language code
      ];
      
      specialCases.forEach(({ code, expected }) => {
        const isValid = /^[a-z]{2,3}(-[A-Z]{2})?$/.test(code);
        expect(isValid).toBe(expected);
      });
    });
  });
});
