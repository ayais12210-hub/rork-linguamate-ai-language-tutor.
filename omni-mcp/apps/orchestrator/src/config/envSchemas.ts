import { z } from 'zod';

// GitHub environment schema
export const githubEnv = z.object({
  GITHUB_TOKEN: z.string().min(1, 'GitHub token is required'),
  GITHUB_OWNER: z.string().optional(),
  GITHUB_REPO: z.string().optional(),
});

// Stripe environment schema
export const stripeEnv = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required'),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

// Notion environment schema
export const notionEnv = z.object({
  NOTION_API_KEY: z.string().min(1, 'Notion API key is required'),
  NOTION_DATABASE_ID: z.string().optional(),
});

// Firecrawl environment schema
export const firecrawlEnv = z.object({
  FIRECRAWL_API_KEY: z.string().min(1, 'Firecrawl API key is required'),
  FIRECRAWL_BASE_URL: z.string().url().optional(),
});

// Supabase environment schema
export const supabaseEnv = z.object({
  SUPABASE_URL: z.string().url('Supabase URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
});

// Playwright environment schema
export const playwrightEnv = z.object({
  PLAYWRIGHT_BROWSERS_PATH: z.string().optional(),
  PLAYWRIGHT_HEADLESS: z.string().optional(),
});

// ElevenLabs environment schema
export const elevenlabsEnv = z.object({
  ELEVENLABS_API_KEY: z.string().min(1, 'ElevenLabs API key is required'),
  ELEVENLABS_VOICE_ID: z.string().optional(),
});

// Sentry environment schema
export const sentryEnv = z.object({
  SENTRY_DSN: z.string().url('Sentry DSN must be a valid URL'),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
});

// OpenRouter environment schema
export const openrouterEnv = z.object({
  OPENROUTER_API_KEY: z.string().min(1, 'OpenRouter API key is required'),
  OPENROUTER_BASE_URL: z.string().url().optional(),
});

// Qwen environment schema
export const qwenEnv = z.object({
  QWEN_API_KEY: z.string().min(1, 'Qwen API key is required'),
  QWEN_BASE_URL: z.string().url().optional(),
});

// Grok environment schema
export const grokEnv = z.object({
  GROK_API_KEY: z.string().min(1, 'Grok API key is required'),
  GROK_BASE_URL: z.string().url().optional(),
});

// Gemini Cloud Assist environment schema
export const geminiAssistEnv = z.object({
  GOOGLE_PROJECT_ID: z.string().min(1, 'Google Project ID is required'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1, 'Google Application Credentials path is required'),
  GEMINI_API_KEY: z.string().optional(),
});

// Server environment schemas mapping
export const serverEnvSchemas = {
  github: githubEnv,
  stripe: stripeEnv,
  notion: notionEnv,
  firecrawl: firecrawlEnv,
  supabase: supabaseEnv,
  playwright: playwrightEnv,
  elevenlabs: elevenlabsEnv,
  sentry: sentryEnv,
  openrouter: openrouterEnv,
  'qwen-max': qwenEnv,
  grok: grokEnv,
  'gemini-cloud-assist': geminiAssistEnv,
} as const;

// Validate environment for a specific server
export function validateEnv(name: string, env: Record<string, string>): { ok: boolean; missing: string[]; errors: string[] } {
  const schema = serverEnvSchemas[name as keyof typeof serverEnvSchemas];
  
  if (!schema) {
    return { ok: true, missing: [], errors: [] };
  }
  
  try {
    schema.parse(env);
    return { ok: true, missing: [], errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      
      return { ok: false, missing, errors };
    }
    
    return { ok: false, missing: [], errors: [String(error)] };
  }
}

// Get required environment keys for a server
export function getRequiredEnvKeys(serverName: string): string[] {
  const schema = serverEnvSchemas[serverName as keyof typeof serverEnvSchemas];
  
  if (!schema) {
    return [];
  }
  
  const shape = schema.shape;
  const required: string[] = [];
  
  for (const [key, field] of Object.entries(shape)) {
    if (field instanceof z.ZodString && !field.isOptional()) {
      required.push(key);
    }
  }
  
  return required;
}

// Get all server environment schemas
export function getAllServerEnvSchemas(): Record<string, z.ZodSchema> {
  return serverEnvSchemas;
}