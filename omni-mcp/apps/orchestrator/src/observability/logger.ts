import pino from 'pino';
import type { Config } from '../config/schema.js';

export function createLogger(config: Config): pino.Logger {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const loggerOptions: pino.LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (isDevelopment) {
    loggerOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  if (config.security?.redactSecrets) {
    loggerOptions.redact = {
      paths: ['password', 'token', 'key', 'secret', 'authorization'],
      censor: '[REDACTED]',
    };
  }
  
  return pino(loggerOptions);
}

export function createServerLogger(baseLogger: pino.Logger, serverName: string): pino.Logger {
  return baseLogger.child({ server: serverName });
}

export function logServerEvent(
  logger: pino.Logger,
  serverName: string,
  event: string,
  data: Record<string, any> = {}
): void {
  logger.info({
    server: serverName,
    event,
    ...data,
  });
}

export function logServerError(
  logger: pino.Logger,
  serverName: string,
  error: Error,
  context: Record<string, any> = {}
): void {
  logger.error({
    server: serverName,
    event: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
}