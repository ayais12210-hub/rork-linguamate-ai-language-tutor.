import { z } from 'zod';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ServerManifest {
  name: string;
  pkg: string;
  bin?: string;
  envKeys: string[];
  probe: {
    type: 'stdio' | 'http';
    timeoutMs: number;
    url?: string;
  };
  notes?: string;
}

interface ManifestFile {
  $schema: string;
  servers: ServerManifest[];
}

// Hand-crafted schemas for specific servers (these take precedence)
const handCraftedSchemas: Record<string, z.ZodSchema> = {
  github: z.object({
    GITHUB_TOKEN: z.string().min(1, 'GitHub token is required'),
  }),
  
  supabase: z.object({
    SUPABASE_URL: z.string().url('Supabase URL must be valid'),
    SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  }),
  
  notion: z.object({
    NOTION_TOKEN: z.string().min(1, 'Notion token is required'),
    NOTION_DATABASE_ID: z.string().min(1, 'Notion database ID is required'),
  }),
  
  openrouter: z.object({
    OPENROUTER_API_KEY: z.string().min(1, 'OpenRouter API key is required'),
  }),
  
  elevenlabs: z.object({
    ELEVENLABS_API_KEY: z.string().min(1, 'ElevenLabs API key is required'),
  }),
  
  sentry: z.object({
    SENTRY_DSN: z.string().url('Sentry DSN must be a valid URL'),
  }),
  
  stripe: z.object({
    STRIPE_API_KEY: z.string().min(1, 'Stripe API key is required'),
    STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required'),
  }),
  
  microsoft: z.object({
    AZURE_TENANT_ID: z.string().min(1, 'Azure tenant ID is required'),
    AZURE_CLIENT_ID: z.string().min(1, 'Azure client ID is required'),
    AZURE_CLIENT_SECRET: z.string().min(1, 'Azure client secret is required'),
  }),
  
  gemini_cloud_assist: z.object({
    GOOGLE_PROJECT_ID: z.string().min(1, 'Google project ID is required'),
    GOOGLE_APPLICATIONS_CREDENTIALS: z.string().min(1, 'Google credentials path is required'),
    GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  }),
};

// Load manifest and generate auto-schemas
function loadManifest(): ManifestFile | null {
  const manifestPath = join(process.cwd(), 'servers', 'servers.manifest.json');
  
  if (!existsSync(manifestPath)) {
    console.warn('⚠️  servers.manifest.json not found, skipping auto-schema generation');
    return null;
  }
  
  try {
    const content = readFileSync(manifestPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('⚠️  Failed to parse servers.manifest.json:', error);
    return null;
  }
}

// Generate auto-schema from envKeys
function generateAutoSchema(envKeys: string[]): z.ZodSchema {
  const schemaFields: Record<string, z.ZodString> = {};
  
  for (const key of envKeys) {
    // Convert to lowercase for schema key
    const schemaKey = key.toLowerCase();
    schemaFields[schemaKey] = z.string().min(1, `${key} is required`);
  }
  
  return z.object(schemaFields);
}

// Get all environment schemas
export function getEnvSchemas(): Record<string, z.ZodSchema> {
  const schemas: Record<string, z.ZodSchema> = { ...handCraftedSchemas };
  
  const manifest = loadManifest();
  if (!manifest) {
    return schemas;
  }
  
  // Generate auto-schemas for servers not in hand-crafted list
  for (const server of manifest.servers) {
    const serverKey = server.name.toLowerCase().replace(/-/g, '_');
    
    // Skip if hand-crafted schema exists
    if (handCraftedSchemas[serverKey]) {
      continue;
    }
    
    // Generate auto-schema from envKeys
    if (server.envKeys.length > 0) {
      schemas[serverKey] = generateAutoSchema(server.envKeys);
    }
  }
  
  return schemas;
}

// Validate environment variables for a specific server
export function validateServerEnv(serverName: string, env: Record<string, string>): {
  success: boolean;
  errors: string[];
} {
  const schemas = getEnvSchemas();
  const serverKey = serverName.toLowerCase().replace(/-/g, '_');
  const schema = schemas[serverKey];
  
  if (!schema) {
    return { success: true, errors: [] };
  }
  
  try {
    schema.parse(env);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

// Get required environment variables for a server
export function getRequiredEnvKeys(serverName: string): string[] {
  const manifest = loadManifest();
  if (!manifest) {
    return [];
  }
  
  const server = manifest.servers.find(s => s.name === serverName);
  return server?.envKeys || [];
}

// Check if all required environment variables are present
export function hasRequiredEnv(serverName: string): boolean {
  const requiredKeys = getRequiredEnvKeys(serverName);
  
  for (const key of requiredKeys) {
    if (!process.env[key]) {
      return false;
    }
  }
  
  return true;
}