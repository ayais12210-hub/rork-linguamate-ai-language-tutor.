import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  selectedLanguage: z.string().length(2).optional(),
  nativeLanguage: z.string().length(2).optional(),
  profilePicture: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  stats: z.object({
    xpPoints: z.number().int().min(0),
    streakDays: z.number().int().min(0),
    wordsLearned: z.number().int().min(0),
    minutesPracticed: z.number().int().min(0),
    lessonsCompleted: z.number().int().min(0),
  }).optional(),
});

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const signupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  ),
  name: z.string().min(1).max(100),
});

export const signupResponseSchema = loginResponseSchema;

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  selectedLanguage: z.string().length(2).optional(),
  nativeLanguage: z.string().length(2).optional(),
  profilePicture: z.string().url().optional(),
});

export const updateProfileResponseSchema = z.object({
  user: userSchema,
});

// Contract tests
describe('User API Contract Tests', () => {
  describe('Login endpoint', () => {
    it('should validate login request schema', () => {
      const validRequest = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      
      expect(() => loginRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject invalid login request', () => {
      const invalidRequests = [
        { email: 'invalid-email', password: 'Password123!' },
        { email: 'test@example.com', password: 'short' },
        { email: '', password: 'Password123!' },
      ];

      invalidRequests.forEach(request => {
        expect(() => loginRequestSchema.parse(request)).toThrow();
      });
    });

    it('should validate login response schema', () => {
      const validResponse = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          name: 'Test User',
          selectedLanguage: 'es',
          nativeLanguage: 'en',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          stats: {
            xpPoints: 100,
            streakDays: 5,
            wordsLearned: 50,
            minutesPracticed: 120,
            lessonsCompleted: 10,
          },
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh_token_here',
        expiresIn: 3600,
      };

      expect(() => loginResponseSchema.parse(validResponse)).not.toThrow();
    });
  });

  describe('Signup endpoint', () => {
    it('should validate signup request schema', () => {
      const validRequest = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User',
      };

      expect(() => signupRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password',
        'Password',
        'Password1',
        'PASSWORD123!',
        'password123!',
      ];

      weakPasswords.forEach(password => {
        const request = {
          email: 'test@example.com',
          password,
          name: 'Test User',
        };
        expect(() => signupRequestSchema.parse(request)).toThrow();
      });
    });
  });

  describe('Update profile endpoint', () => {
    it('should validate partial update requests', () => {
      const validRequests = [
        { name: 'Updated Name' },
        { selectedLanguage: 'fr' },
        { nativeLanguage: 'de' },
        { profilePicture: 'https://example.com/avatar.jpg' },
        {
          name: 'Full Update',
          selectedLanguage: 'ja',
          nativeLanguage: 'ko',
          profilePicture: 'https://example.com/new-avatar.jpg',
        },
      ];

      validRequests.forEach(request => {
        expect(() => updateProfileRequestSchema.parse(request)).not.toThrow();
      });
    });

    it('should reject invalid language codes', () => {
      const invalidRequests = [
        { selectedLanguage: 'eng' }, // Too long
        { selectedLanguage: 'e' }, // Too short
        { nativeLanguage: '123' }, // Invalid format
      ];

      invalidRequests.forEach(request => {
        expect(() => updateProfileRequestSchema.parse(request)).toThrow();
      });
    });
  });
});