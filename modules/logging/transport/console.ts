import type { LogEnvelope } from '../schemas';
import type { LogLevel } from '../levels';

const COLORS = {
  TRACE: '\x1b[90m',
  DEBUG: '\x1b[36m',
  INFO: '\x1b[32m',
  NOTICE: '\x1b[34m',
  WARN: '\x1b[33m',
  ERROR: '\x1b[31m',
  FATAL: '\x1b[35m',
  SECURITY: '\x1b[41m\x1b[37m',
  RESET: '\x1b[0m',
} as const;

const CONSOLE_METHODS: Record<LogLevel, keyof Console> = {
  TRACE: 'debug',
  DEBUG: 'debug',
  INFO: 'info',
  NOTICE: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'error',
  SECURITY: 'error',
};

export function logToConsole(log: LogEnvelope): void {
  const isDev = process.env.NODE_ENV === 'development' || __DEV__;
  
  if (!isDev && (log.lvl === 'TRACE' || log.lvl === 'DEBUG')) {
    return;
  }

  const method = CONSOLE_METHODS[log.lvl];
  const color = COLORS[log.lvl];
  const reset = COLORS.RESET;

  const timestamp = new Date(log.ts).toISOString();
  const prefix = `${color}[${log.lvl}]${reset}`;
  const category = `[${log.cat}]`;
  const event = log.evt;

  const parts = [prefix, timestamp, category, event, '-', log.msg];

  const consoleMethod = console[method] as (...args: unknown[]) => void;
  
  if (log.data && Object.keys(log.data).length > 0) {
    consoleMethod(...parts, log.data);
  } else {
    consoleMethod(...parts);
  }

  if (log.corr?.correlationId) {
    consoleMethod(`  └─ Correlation ID: ${log.corr.correlationId}`);
  }
}

export function logBatchToConsole(logs: LogEnvelope[]): void {
  for (const log of logs) {
    logToConsole(log);
  }
}
