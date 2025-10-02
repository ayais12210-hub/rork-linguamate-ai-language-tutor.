import type { LogLevel } from './levels';
import type { LogEnvelope, UserInfo } from './schemas';
import { shouldLog, getLogLevelFromEnv } from './levels';
import { redactLogData } from './redactors';
import { getDeviceInfo } from './device';
import { enqueue, initQueue } from './queue';
import { logToConsole } from './transport/console';
import { shouldLogEvent } from '../security/consent';

let deviceInfoCache: Awaited<ReturnType<typeof getDeviceInfo>> | null = null;
let isInitialized = false;

export async function initLogger(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    deviceInfoCache = await getDeviceInfo();
    await initQueue();
    isInitialized = true;
    console.log('[Logger] Initialized successfully');
  } catch (error) {
    console.error('[Logger] Failed to initialize:', error);
  }
}

export interface LogOptions {
  cat?: string;
  correlationId?: string;
  sessionId?: string;
  userInfo?: UserInfo;
}

export async function log(
  level: LogLevel,
  evt: string,
  msg: string,
  data?: Record<string, unknown>,
  options?: LogOptions
): Promise<void> {
  const minLevel = getLogLevelFromEnv();
  
  if (!shouldLog(level, minLevel)) {
    return;
  }

  const category = options?.cat || 'app';
  
  if (!shouldLogEvent(level, category)) {
    return;
  }

  try {
    const redactedData = data ? redactLogData(data) : undefined;

    const envelope: LogEnvelope = {
      ts: new Date().toISOString(),
      lvl: level,
      cat: category,
      evt,
      msg,
      data: redactedData,
      device: deviceInfoCache || undefined,
      user: options?.userInfo,
      corr: options?.correlationId || options?.sessionId
        ? {
            correlationId: options.correlationId || '',
            sessionId: options.sessionId,
          }
        : undefined,
    };

    logToConsole(envelope);

    if (isInitialized) {
      await enqueue(envelope);
    }
  } catch (error) {
    console.error('[Logger] Failed to log:', error);
  }
}

export const logger = {
  trace: (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) =>
    log('TRACE', evt, msg, data, options),
  
  debug: (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) =>
    log('DEBUG', evt, msg, data, options),
  
  info: (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) =>
    log('INFO', evt, msg, data, options),
  
  notice: (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) =>
    log('NOTICE', evt, msg, data, options),
  
  warn: (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) =>
    log('WARN', evt, msg, data, options),
  
  error: (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) =>
    log('ERROR', evt, msg, data, options),
  
  fatal: (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) =>
    log('FATAL', evt, msg, data, options),
  
  security: (evt: string, msg: string, data?: Record<string, unknown>, options?: LogOptions) =>
    log('SECURITY', evt, msg, data, options),
};

export { shouldLog, getLogLevelFromEnv, LOG_LEVELS } from './levels';
export type { LogLevel } from './levels';
export type { LogEnvelope, LogBatch, UserInfo, DeviceInfo as DeviceInfoType, CorrelationInfo, SignatureInfo } from './schemas';
export { LoggingContextProvider, useLoggingContext, getCorrelationInfo, withCorrelation } from './context';
export { getQueueSize, getQueueStats, clearQueue, flushQueue } from './queue';
export { getDeviceInfo, getDeviceFingerprint } from './device';
export { addRedactor, removeRedactor } from './redactors';
