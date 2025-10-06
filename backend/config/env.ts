import { z } from 'zod';
import { logger } from '../logging/pino';

/**
 * Environment variable schema and validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  
  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  
  // CORS
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  CORS_ALLOW_CREDENTIALS: z.string().default('true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('60'),
  RATE_LIMIT_MAX_LOGIN_ATTEMPTS: z.string().default('5'),
  
  // External Services
  EXPO_PUBLIC_TOOLKIT_URL: z.string().url().default('https://toolkit.rork.com'),
  TOOLKIT_API_KEY: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: z.string().default('false'),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().default('0.2'),
  SENTRY_PROFILES_SAMPLE_RATE: z.string().default('0.1'),
  
  // Feature Flags
  STT_MOCK_ENABLED: z.string().default('true'),
  ENABLE_REQUEST_LOGGING: z.string().default('true'),
  ENABLE_SECURITY_HEADERS: z.string().default('true'),
  
  // Session
  SESSION_TIMEOUT_MINUTES: z.string().default('30'),
  MAX_CONCURRENT_SESSIONS: z.string().default('3'),
  
  // File Upload
  MAX_FILE_SIZE_MB: z.string().default('10'),
  ALLOWED_FILE_TYPES: z.string().default('audio/wav,audio/mp3,audio/webm'),
  
  // Build Info
  GIT_COMMIT_SHA: z.string().optional(),
  EXPO_PUBLIC_COMMIT_SHA: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates and parses environment variables
 * Throws on validation failure in production
 */
export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional runtime validations
    if (env.NODE_ENV === 'production') {
      // Ensure critical production values are not defaults
      if (env.JWT_SECRET === 'dev-secret-change-me') {
        throw new Error('JWT_SECRET must be set in production');
      }
      
      if (!env.CORS_ALLOWED_ORIGINS) {
        throw new Error('CORS_ALLOWED_ORIGINS must be set in production');
      }
      
      // Warn about optional but recommended settings
      if (!env.SENTRY_DSN) {
        logger.warn('SENTRY_DSN not configured - error monitoring disabled');
      }
      
      if (!env.TOOLKIT_API_KEY) {
        logger.warn('TOOLKIT_API_KEY not configured - some features may be limited');
      }
    }
    
    logger.info({ 
      env: env.NODE_ENV,
      corsOrigins: env.CORS_ALLOWED_ORIGINS?.split(',').length || 0,
      sentryEnabled: !!env.SENTRY_DSN,
    }, 'Environment configuration validated');
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.fatal({ 
        errors: error.errors,
        issues: error.flatten().fieldErrors 
      }, 'Environment validation failed');
      
      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      
      // In development, log and continue with defaults
      logger.warn('Continuing with default values in development mode');
      return envSchema.parse({});
    }
    
    throw error;
  }
}

// Export validated config
export const config = validateEnv();

// Type-safe config getters
export const getConfig = {
  isDev: () => config.NODE_ENV === 'development',
  isProd: () => config.NODE_ENV === 'production',
  isTest: () => config.NODE_ENV === 'test',
  
  jwt: () => ({
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN,
    refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
  }),
  
  cors: () => ({
    origins: config.CORS_ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [],
    credentials: config.CORS_ALLOW_CREDENTIALS === 'true',
  }),
  
  rateLimit: () => ({
    windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(config.RATE_LIMIT_MAX_REQUESTS, 10),
    maxLoginAttempts: parseInt(config.RATE_LIMIT_MAX_LOGIN_ATTEMPTS, 10),
  }),
  
  logging: () => ({
    level: config.LOG_LEVEL,
    pretty: config.LOG_PRETTY === 'true',
  }),
  
  features: () => ({
    sttMockEnabled: config.STT_MOCK_ENABLED === 'true',
    requestLogging: config.ENABLE_REQUEST_LOGGING === 'true',
    securityHeaders: config.ENABLE_SECURITY_HEADERS === 'true',
  }),
};