// Lightweight logger with levels, scoped tags, and environment routing
import { Platform } from 'react-native';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  tag: string;
  message: string;
  data?: any;
  timestamp: number;
  platform: string;
  sessionId?: string;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableSentry: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
  sessionId?: string;
}

class Logger {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: __DEV__ ? 'debug' : 'info',
      enableConsole: true,
      enableSentry: !__DEV__, // Only in production
      enableStorage: true,
      maxStoredLogs: 1000,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.minLevel];
  }

  private createLogEntry(
    level: LogLevel,
    tag: string,
    message: string,
    data?: any
  ): LogEntry {
    return {
      level,
      tag,
      message,
      data,
      timestamp: Date.now(),
      platform: Platform.OS,
      sessionId: this.config.sessionId,
    };
  }

  private async logToConsole(entry: LogEntry): Promise<void> {
    if (!this.config.enableConsole) return;

    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.tag}]`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.data || '');
        break;
    }
  }

  private async logToSentry(entry: LogEntry): Promise<void> {
    if (!this.config.enableSentry) return;

    try {
      // Import Sentry dynamically to avoid issues if not installed
      const Sentry = await import('@sentry/react-native').catch(() => null);
      if (!Sentry) return;

      // Add breadcrumb for non-error logs
      if (entry.level !== 'error') {
        Sentry.addBreadcrumb({
          message: entry.message,
          category: entry.tag,
          level: entry.level === 'warn' ? 'warning' : entry.level,
          data: entry.data,
          timestamp: entry.timestamp / 1000,
        });
      } else {
        // Capture error
        Sentry.withScope((scope) => {
          scope.setTag('logger.tag', entry.tag);
          scope.setLevel('error');
          scope.setContext('logData', entry.data || {});
          
          if (entry.data instanceof Error) {
            Sentry.captureException(entry.data);
          } else {
            Sentry.captureMessage(entry.message, 'error');
          }
        });
      }
    } catch (error) {
      console.warn('[Logger] Failed to log to Sentry:', error);
    }
  }

  private async logToStorage(entry: LogEntry): Promise<void> {
    if (!this.config.enableStorage) return;

    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      
      // Get existing logs
      const existingLogsJson = await AsyncStorage.default.getItem('app_logs');
      const existingLogs: LogEntry[] = existingLogsJson ? JSON.parse(existingLogsJson) : [];
      
      // Add new log and trim if necessary
      const updatedLogs = [entry, ...existingLogs].slice(0, this.config.maxStoredLogs);
      
      // Store back
      await AsyncStorage.default.setItem('app_logs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.warn('[Logger] Failed to store log:', error);
    }
  }

  private async processLog(entry: LogEntry): Promise<void> {
    // Log to all enabled sinks in parallel
    const promises: Promise<void>[] = [];
    
    promises.push(this.logToConsole(entry));
    
    if (this.config.enableSentry) {
      promises.push(this.logToSentry(entry));
    }
    
    if (this.config.enableStorage) {
      promises.push(this.logToStorage(entry));
    }
    
    await Promise.allSettled(promises);
  }

  // Main logging methods
  debug(tag: string, message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', tag, message, data);
    this.processLog(entry).catch(() => {}); // Fire and forget
  }

  info(tag: string, message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', tag, message, data);
    this.processLog(entry).catch(() => {});
  }

  warn(tag: string, message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', tag, message, data);
    this.processLog(entry).catch(() => {});
  }

  error(tag: string, message: string, data?: any): void {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', tag, message, data);
    this.processLog(entry).catch(() => {});
  }

  // Scoped logger factory
  scope(tag: string): ScopedLogger {
    return new ScopedLogger(this, tag);
  }

  // Configuration methods
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  // Utility methods
  async getLogs(limit = 100): Promise<LogEntry[]> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const logsJson = await AsyncStorage.default.getItem('app_logs');
      const logs: LogEntry[] = logsJson ? JSON.parse(logsJson) : [];
      return logs.slice(0, limit);
    } catch (error) {
      console.warn('[Logger] Failed to get logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.removeItem('app_logs');
    } catch (error) {
      console.warn('[Logger] Failed to clear logs:', error);
    }
  }

  async getLogStats(): Promise<{
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    oldestLog?: number;
    newestLog?: number;
  }> {
    try {
      const logs = await this.getLogs(this.config.maxStoredLogs);
      
      const logsByLevel = logs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {} as Record<LogLevel, number>);

      return {
        totalLogs: logs.length,
        logsByLevel,
        oldestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : undefined,
        newestLog: logs.length > 0 ? logs[0].timestamp : undefined,
      };
    } catch (error) {
      console.warn('[Logger] Failed to get log stats:', error);
      return {
        totalLogs: 0,
        logsByLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      };
    }
  }
}

// Scoped logger for specific components/modules
class ScopedLogger {
  constructor(private logger: Logger, private tag: string) {}

  debug(message: string, data?: any): void {
    this.logger.debug(this.tag, message, data);
  }

  info(message: string, data?: any): void {
    this.logger.info(this.tag, message, data);
  }

  warn(message: string, data?: any): void {
    this.logger.warn(this.tag, message, data);
  }

  error(message: string, data?: any): void {
    this.logger.error(this.tag, message, data);
  }

  scope(subTag: string): ScopedLogger {
    return new ScopedLogger(this.logger, `${this.tag}:${subTag}`);
  }
}

// Create global logger instance
export const log = new Logger();

// Export types and classes
export { Logger, ScopedLogger, LogEntry, LoggerConfig };

// Convenience function to create scoped loggers
export const createLogger = (tag: string): ScopedLogger => {
  return log.scope(tag);
};

// Performance logging utilities
export const perf = {
  start(tag: string, operation: string): () => void {
    const startTime = Date.now();
    log.debug(tag, `Started: ${operation}`);
    
    return () => {
      const duration = Date.now() - startTime;
      log.info(tag, `Completed: ${operation}`, { duration });
    };
  },

  async measure<T>(
    tag: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    log.debug(tag, `Started: ${operation}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      log.info(tag, `Completed: ${operation}`, { duration, success: true });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(tag, `Failed: ${operation}`, { duration, error });
      throw error;
    }
  },
};

// Network logging utilities
export const networkLog = {
  request(method: string, url: string, requestId: string): void {
    log.info('Network', `${method} ${url}`, { requestId, type: 'request' });
  },

  response(method: string, url: string, status: number, requestId: string, duration?: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    log[level]('Network', `${method} ${url} → ${status}`, { 
      requestId, 
      status, 
      duration,
      type: 'response' 
    });
  },

  error(method: string, url: string, error: Error, requestId: string): void {
    log.error('Network', `${method} ${url} failed`, { 
      requestId, 
      error: error.message,
      type: 'error' 
    });
  },
};

// Initialize logger with session ID
let sessionId: string | undefined;

export const initializeLogger = async (userId?: string): Promise<void> => {
  // Generate session ID
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  log.setSessionId(sessionId);
  
  // Set user context for Sentry
  if (userId) {
    try {
      const Sentry = await import('@sentry/react-native').catch(() => null);
      if (Sentry) {
        Sentry.setUser({ id: userId });
      }
    } catch (error) {
      console.warn('[Logger] Failed to set Sentry user:', error);
    }
  }
  
  log.info('Logger', 'Logger initialized', { sessionId, userId });
};

export const getSessionId = (): string | undefined => sessionId;