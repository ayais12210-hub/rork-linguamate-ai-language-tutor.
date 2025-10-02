import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level: logLevel,
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
  },
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export function logSecurityEvent(
  evt: string,
  data?: Record<string, unknown>
) {
  logger.error({
    lvl: 'SECURITY',
    cat: 'security',
    evt,
    ...data,
  }, `Security event: ${evt}`);
}

export default logger;
