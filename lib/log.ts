import { logger as coreLogger } from '@/modules/logging';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const log = {
  debug: (evt: string, msg: string, data?: Record<string, unknown>) => coreLogger.debug(evt, msg, data),
  info: (evt: string, msg: string, data?: Record<string, unknown>) => coreLogger.info(evt, msg, data),
  warn: (evt: string, msg: string, data?: Record<string, unknown>) => coreLogger.warn(evt, msg, data),
  error: (evt: string, msg: string, data?: Record<string, unknown>) => coreLogger.error(evt, msg, data),
};
