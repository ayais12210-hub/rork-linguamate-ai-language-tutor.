import { useCallback } from 'react';
import { logger, type LogOptions } from '@/modules/logging';
import { useLoggingContext, getCorrelationInfo } from '@/modules/logging';

export function useLogger() {
  const context = useLoggingContext();

  const createLogFn = useCallback(
    (level: 'trace' | 'debug' | 'info' | 'notice' | 'warn' | 'error' | 'fatal' | 'security') => {
      return (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) => {
        const corrInfo = getCorrelationInfo(context);
        const mergedOptions: LogOptions = {
          ...options,
          correlationId: options?.correlationId || corrInfo?.correlationId,
          sessionId: options?.sessionId || corrInfo?.sessionId,
          userInfo: options?.userInfo || context.userInfo || undefined,
        };

        return logger[level](evt, msg, data, mergedOptions);
      };
    },
    [context]
  );

  return {
    trace: createLogFn('trace'),
    debug: createLogFn('debug'),
    info: createLogFn('info'),
    notice: createLogFn('notice'),
    warn: createLogFn('warn'),
    error: createLogFn('error'),
    fatal: createLogFn('fatal'),
    security: createLogFn('security'),
  };
}
