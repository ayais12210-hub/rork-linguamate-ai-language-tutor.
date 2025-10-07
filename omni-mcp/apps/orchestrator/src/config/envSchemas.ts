import { z } from 'zod';

export const githubEnv = z.object({ 
  GITHUB_TOKEN: z.string().min(1) 
});

export const firecrawlEnv = z.object({ 
  FIRECRAWL_API_KEY: z.string().min(1) 
});

export const supabaseEnv = z.object({ 
  SUPABASE_URL: z.string().url(), 
  SUPABASE_ANON_KEY: z.string().min(1), 
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1) 
});

export const playwrightEnv = z.object({ 
  PLAYWRIGHT_BROWSERS_PATH: z.string().optional() 
});

export const elevenlabsEnv = z.object({ 
  ELEVENLABS_API_KEY: z.string().min(1) 
});

export const sentryEnv = z.object({ 
  SENTRY_DSN: z.string().url().optional() 
});

export const openrouterEnv = z.object({ 
  OPENROUTER_API_KEY: z.string().min(1) 
});

export const qwenEnv = z.object({ 
  QWEN_API_KEY: z.string().min(1) 
});

export const grokEnv = z.object({ 
  GROK_API_KEY: z.string().min(1) 
});

export const geminiAssistEnv = z.object({ 
  GOOGLE_PROJECT_ID: z.string().min(1), 
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1), 
  GEMINI_API_KEY: z.string().min(1).optional() 
});

const map: Record<string, z.ZodSchema> = {
  github: githubEnv, 
  firecrawl: firecrawlEnv, 
  supabase: supabaseEnv,
  playwright: playwrightEnv, 
  elevenlabs: elevenlabsEnv, 
  sentry: sentryEnv,
  openrouter: openrouterEnv, 
  'qwen-max': qwenEnv, 
  grok: grokEnv, 
  'gemini-cloud-assist': geminiAssistEnv
};

export function validateEnv(name: string, env: Record<string, string>): { ok: boolean; missing: string[] } {
  const sch = map[name];
  if (!sch) return { ok: true, missing: [] };
  
  const res = sch.safeParse(env);
  if (res.success) return { ok: true, missing: [] };
  
  const missing = res.error.issues.map(i => i.path[0]).filter(Boolean) as string[];
  return { ok: false, missing: [...new Set(missing)] };
}