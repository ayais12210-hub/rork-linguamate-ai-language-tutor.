import { z } from 'zod';
import yaml from 'js-yaml';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Health check configuration schema
const HealthCheckSchema = z.object({
  type: z.enum(['stdio', 'http']),
  command: z.string().optional(),
  url: z.string().optional(),
  timeoutMs: z.number().positive().default(10000),
});

// Server limits schema
const ServerLimitsSchema = z.object({
  rps: z.number().positive().default(3),
  burst: z.number().positive().default(6),
  timeoutMs: z.number().positive().default(30000),
});

// Server configuration schema
const ServerConfigSchema = z.object({
  name: z.string(),
  enabled: z.boolean().default(false),
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string()),
  healthCheck: HealthCheckSchema,
  scopes: z.array(z.string()).default([]),
  limits: ServerLimitsSchema.default({}),
});

// Feature flags schema
const FeatureFlagsSchema = z.record(
  z.string(),
  z.object({
    enabled: z.boolean().default(false),
  })
);

// Runtime configuration schema
const RuntimeConfigSchema = z.object({
  maxConcurrency: z.number().positive().default(10),
  defaultTimeoutMs: z.number().positive().default(30000),
  retry: z.object({
    attempts: z.number().positive().default(3),
    backoffMs: z.number().positive().default(1000),
  }).default({}),
});

// Network configuration schema
const NetworkConfigSchema = z.object({
  outboundAllowlist: z.array(z.string()).default([]),
});

// Observability configuration schema
const ObservabilityConfigSchema = z.object({
  otelEnabled: z.boolean().default(true),
  sentryDsn: z.string().optional(),
  sampling: z.number().min(0).max(1).default(0.1),
});

// Security configuration schema
const SecurityConfigSchema = z.object({
  auditLog: z.boolean().default(true),
  redactSecrets: z.boolean().default(true),
});

// Main configuration schema
export const ConfigSchema = z.object({
  features: FeatureFlagsSchema.default({}),
  servers: z.record(z.string(), ServerConfigSchema).default({}),
  runtime: RuntimeConfigSchema.default({}),
  network: NetworkConfigSchema.default({}),
  observability: ObservabilityConfigSchema.default({}),
  security: SecurityConfigSchema.default({}),
});

export type Config = z.infer<typeof ConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;

// Environment variable interpolation
function interpolateEnvVars(template: string): string {
  return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
    const defaultValue = key.includes(':-') ? key.split(':-')[1] : undefined;
    const envKey = key.split(':-')[0];
    return process.env[envKey] || defaultValue || '';
  });
}

// Load and merge configuration files
export function loadConfig(): Config {
  const configDir = join(process.cwd(), 'config');
  
  // Load default configuration
  const defaultPath = join(configDir, 'default.yaml');
  let config: any = {};
  
  if (existsSync(defaultPath)) {
    const defaultContent = readFileSync(defaultPath, 'utf8');
    config = yaml.load(defaultContent) || {};
  }
  
  // Load environment-specific configuration
  const env = process.env.NODE_ENV || 'development';
  const envPath = join(configDir, `${env}.yaml`);
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    const envConfig = yaml.load(envContent) || {};
    config = { ...config, ...envConfig };
  }
  
  // Load local configuration (git-ignored)
  const localPath = join(configDir, 'local.yaml');
  if (existsSync(localPath)) {
    const localContent = readFileSync(localPath, 'utf8');
    const localConfig = yaml.load(localContent) || {};
    config = { ...config, ...localConfig };
  }
  
  // Interpolate environment variables in server configurations
  if (config.servers) {
    for (const [, serverConfig] of Object.entries(config.servers as Record<string, any>)) {
      if (serverConfig.env) {
        for (const [key, value] of Object.entries(serverConfig.env)) {
          serverConfig.env[key] = interpolateEnvVars(value as string);
        }
      }
    }
  }
  
  return ConfigSchema.parse(config);
}

// Check if required environment variables are present
export function hasRequiredEnvs(envConfig: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(envConfig)) {
    if (value && !process.env[key]) {
      return false;
    }
  }
  return true;
}

// Resolve environment variables for server
export function resolveEnv(envConfig: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(envConfig)) {
    resolved[key] = interpolateEnvVars(value);
  }
  return resolved;
}