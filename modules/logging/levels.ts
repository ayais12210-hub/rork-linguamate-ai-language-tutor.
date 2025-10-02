export type LogLevel =
  | 'TRACE'
  | 'DEBUG'
  | 'INFO'
  | 'NOTICE'
  | 'WARN'
  | 'ERROR'
  | 'FATAL'
  | 'SECURITY';

export const LOG_LEVELS: Record<LogLevel, number> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  NOTICE: 3,
  WARN: 4,
  ERROR: 5,
  FATAL: 6,
  SECURITY: 7,
};

export function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

export function getLogLevelFromEnv(): LogLevel {
  const envLevel = process.env.EXPO_PUBLIC_LOG_LEVEL?.toUpperCase() as LogLevel;
  return envLevel && envLevel in LOG_LEVELS ? envLevel : 'INFO';
}
