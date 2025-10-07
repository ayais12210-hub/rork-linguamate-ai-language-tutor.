import { describe, it, expect } from 'vitest';
import { validateEnv } from '../src/config/envSchemas.js';

describe('envSchemas', () => {
  describe('validateEnv', () => {
    it('should validate github env successfully', () => {
      const result = validateEnv('github', {
        GITHUB_TOKEN: 'ghp_test123',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should fail github validation with missing token', () => {
      const result = validateEnv('github', {});
      
      expect(result.ok).toBe(false);
      expect(result.missing).toContain('GITHUB_TOKEN');
    });

    it('should validate firecrawl env successfully', () => {
      const result = validateEnv('firecrawl', {
        FIRECRAWL_API_KEY: 'fc_test123',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should validate supabase env successfully', () => {
      const result = validateEnv('supabase', {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'anon_key_123',
        SUPABASE_SERVICE_ROLE_KEY: 'service_key_123',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should fail supabase validation with invalid URL', () => {
      const result = validateEnv('supabase', {
        SUPABASE_URL: 'not-a-url',
        SUPABASE_ANON_KEY: 'anon_key_123',
        SUPABASE_SERVICE_ROLE_KEY: 'service_key_123',
      });
      
      expect(result.ok).toBe(false);
      expect(result.missing).toContain('SUPABASE_URL');
    });

    it('should validate playwright env with optional field', () => {
      const result = validateEnv('playwright', {});
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should validate elevenlabs env successfully', () => {
      const result = validateEnv('elevenlabs', {
        ELEVENLABS_API_KEY: 'el_test123',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should validate sentry env with optional DSN', () => {
      const result = validateEnv('sentry', {});
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should validate openrouter env successfully', () => {
      const result = validateEnv('openrouter', {
        OPENROUTER_API_KEY: 'or_test123',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should validate qwen env successfully', () => {
      const result = validateEnv('qwen-max', {
        QWEN_API_KEY: 'qw_test123',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should validate grok env successfully', () => {
      const result = validateEnv('grok', {
        GROK_API_KEY: 'gr_test123',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should validate gemini-cloud-assist env successfully', () => {
      const result = validateEnv('gemini-cloud-assist', {
        GOOGLE_PROJECT_ID: 'test-project',
        GOOGLE_APPLICATION_CREDENTIALS: '/path/to/creds.json',
        GEMINI_API_KEY: 'gemini_test123',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should validate gemini-cloud-assist env without optional API key', () => {
      const result = validateEnv('gemini-cloud-assist', {
        GOOGLE_PROJECT_ID: 'test-project',
        GOOGLE_APPLICATION_CREDENTIALS: '/path/to/creds.json',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should return ok for unknown server', () => {
      const result = validateEnv('unknown-server', {
        SOME_KEY: 'some_value',
      });
      
      expect(result.ok).toBe(true);
      expect(result.missing).toEqual([]);
    });
  });
});