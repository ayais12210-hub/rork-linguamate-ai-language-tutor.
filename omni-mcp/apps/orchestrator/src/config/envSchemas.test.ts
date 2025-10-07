import { describe, it, expect } from 'vitest';
import { validateEnv, getRequiredEnvKeys, getAllServerEnvSchemas } from '../config/envSchemas.js';

describe('envSchemas', () => {
  describe('validateEnv', () => {
    it('should validate github environment successfully', () => {
      const env = {
        GITHUB_TOKEN: 'ghp_test123',
        GITHUB_OWNER: 'test-owner',
        GITHUB_REPO: 'test-repo',
      };

      const result = validateEnv('github', env);

      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation for missing required github token', () => {
      const env = {
        GITHUB_OWNER: 'test-owner',
        GITHUB_REPO: 'test-repo',
      };

      const result = validateEnv('github', env);

      expect(result.ok).toBe(false);
      expect(result.missing).toContain('GITHUB_TOKEN');
    });

    it('should validate supabase environment successfully', () => {
      const env = {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'anon_key_123',
        SUPABASE_SERVICE_ROLE_KEY: 'service_role_key_123',
      };

      const result = validateEnv('supabase', env);

      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation for invalid supabase URL', () => {
      const env = {
        SUPABASE_URL: 'not-a-valid-url',
        SUPABASE_ANON_KEY: 'anon_key_123',
        SUPABASE_SERVICE_ROLE_KEY: 'service_role_key_123',
      };

      const result = validateEnv('supabase', env);

      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate firecrawl environment successfully', () => {
      const env = {
        FIRECRAWL_API_KEY: 'fc_test123',
      };

      const result = validateEnv('firecrawl', env);

      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should validate playwright environment with optional variables', () => {
      const env = {
        PLAYWRIGHT_BROWSERS_PATH: '/custom/path',
      };

      const result = validateEnv('playwright', env);

      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should validate playwright environment without optional variables', () => {
      const env = {};

      const result = validateEnv('playwright', env);

      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should validate gemini-cloud-assist environment successfully', () => {
      const env = {
        GOOGLE_PROJECT_ID: 'test-project',
        GOOGLE_APPLICATION_CREDENTIALS: '/path/to/credentials.json',
        GEMINI_API_KEY: 'gemini_key_123',
      };

      const result = validateEnv('gemini-cloud-assist', env);

      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should return ok for unknown server', () => {
      const env = {
        SOME_VAR: 'value',
      };

      const result = validateEnv('unknown-server', env);

      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('getRequiredEnvKeys', () => {
    it('should return required keys for github', () => {
      const keys = getRequiredEnvKeys('github');
      expect(keys).toContain('GITHUB_TOKEN');
    });

    it('should return required keys for supabase', () => {
      const keys = getRequiredEnvKeys('supabase');
      expect(keys).toContain('SUPABASE_URL');
      expect(keys).toContain('SUPABASE_ANON_KEY');
      expect(keys).toContain('SUPABASE_SERVICE_ROLE_KEY');
    });

    it('should return required keys for firecrawl', () => {
      const keys = getRequiredEnvKeys('firecrawl');
      expect(keys).toContain('FIRECRAWL_API_KEY');
    });

    it('should return empty array for unknown server', () => {
      const keys = getRequiredEnvKeys('unknown-server');
      expect(keys).toEqual([]);
    });
  });

  describe('getAllServerEnvSchemas', () => {
    it('should return all server schemas', () => {
      const schemas = getAllServerEnvSchemas();
      
      expect(schemas).toHaveProperty('github');
      expect(schemas).toHaveProperty('stripe');
      expect(schemas).toHaveProperty('notion');
      expect(schemas).toHaveProperty('firecrawl');
      expect(schemas).toHaveProperty('supabase');
      expect(schemas).toHaveProperty('playwright');
      expect(schemas).toHaveProperty('elevenlabs');
      expect(schemas).toHaveProperty('sentry');
      expect(schemas).toHaveProperty('openrouter');
      expect(schemas).toHaveProperty('qwen-max');
      expect(schemas).toHaveProperty('grok');
      expect(schemas).toHaveProperty('gemini-cloud-assist');
    });
  });
});