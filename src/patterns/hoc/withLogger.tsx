import React, { ComponentType, useEffect, useRef } from 'react';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Logger interface
export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  log: (level: LogLevel, message: string, ...args: any[]) => void;
}

// Default logger implementation
class DefaultLogger implements Logger {
  private minLevel: LogLevel;
  private componentName: string;

  constructor(componentName: string, minLevel: LogLevel = LogLevel.INFO) {
    this.componentName = componentName;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    return `[${timestamp}] [${levelName}] [${this.componentName}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message), ...args);
    }
  }

  log(level: LogLevel, message: string, ...args: any[]): void {
    if (this.shouldLog(level)) {
      const formattedMessage = this.formatMessage(level, message);
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, ...args);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, ...args);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, ...args);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, ...args);
          break;
      }
    }
  }
}

// Logger context
const LoggerContext = React.createContext<Logger | null>(null);

// Logger provider
export function LoggerProvider({ 
  children, 
  logger 
}: { 
  children: React.ReactNode; 
  logger?: Logger;
}) {
  const defaultLogger = new DefaultLogger('App', LogLevel.INFO);
  const loggerInstance = logger || defaultLogger;

  return (
    <LoggerContext.Provider value={loggerInstance}>
      {children}
    </LoggerContext.Provider>
  );
}

// Hook to use logger
export function useLogger(componentName?: string): Logger {
  const contextLogger = React.useContext(LoggerContext);
  
  if (contextLogger && componentName) {
    return new DefaultLogger(componentName, LogLevel.INFO);
  }
  
  if (contextLogger) {
    return contextLogger;
  }
  
  // Fallback logger
  return new DefaultLogger(componentName || 'Unknown', LogLevel.INFO);
}

// HOC configuration
interface WithLoggerConfig {
  logLevel?: LogLevel;
  logProps?: boolean;
  logLifecycle?: boolean;
  logPerformance?: boolean;
  logErrors?: boolean;
  customLogger?: Logger;
  onMount?: (logger: Logger) => void;
  onUnmount?: (logger: Logger) => void;
}

// Higher-order component for logging
export function withLogger<P extends object>(
  WrappedComponent: ComponentType<P>,
  config: WithLoggerConfig = {}
) {
  const {
    logLevel = LogLevel.INFO,
    logProps = false,
    logLifecycle = true,
    logPerformance = false,
    logErrors = true,
    customLogger,
    onMount,
    onUnmount,
  } = config;

  const WithLoggerComponent = (props: P) => {
    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    const logger = customLogger || new DefaultLogger(componentName, logLevel);
    const mountTimeRef = useRef<number>(0);
    const renderCountRef = useRef<number>(0);

    // Log props if enabled
    useEffect(() => {
      if (logProps) {
        logger.debug('Component props:', props);
      }
    }, [logger, props, logProps]);

    // Log lifecycle events
    useEffect(() => {
      if (logLifecycle) {
        logger.info('Component mounted');
        onMount?.(logger);
      }

      if (logPerformance) {
        mountTimeRef.current = performance.now();
      }

      return () => {
        if (logLifecycle) {
          logger.info('Component unmounting');
          onUnmount?.(logger);
        }

        if (logPerformance) {
          const unmountTime = performance.now();
          const mountDuration = unmountTime - mountTimeRef.current;
          logger.info(`Component lifecycle duration: ${mountDuration.toFixed(2)}ms`);
        }
      };
    }, [logger, logLifecycle, logPerformance, onMount, onUnmount]);

    // Log render count
    useEffect(() => {
      renderCountRef.current += 1;
      if (logPerformance) {
        logger.debug(`Render count: ${renderCountRef.current}`);
      }
    });

    // Error boundary logging
    useEffect(() => {
      if (!logErrors) return;

      const handleError = (error: ErrorEvent) => {
        logger.error('Component error:', {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
          stack: error.error?.stack,
        });
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        logger.error('Unhandled promise rejection:', {
          reason: event.reason,
          promise: event.promise,
        });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [logger, logErrors]);

    return <WrappedComponent {...props} />;
  };

  WithLoggerComponent.displayName = `withLogger(${componentName})`;
  return WithLoggerComponent;
}

// Specific logger HOCs for common use cases
export function withDebugLogging<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return withLogger(WrappedComponent, {
    logLevel: LogLevel.DEBUG,
    logProps: true,
    logLifecycle: true,
    logPerformance: true,
  });
}

export function withErrorLogging<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return withLogger(WrappedComponent, {
    logLevel: LogLevel.ERROR,
    logErrors: true,
  });
}

export function withPerformanceLogging<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return withLogger(WrappedComponent, {
    logLevel: LogLevel.INFO,
    logPerformance: true,
    logLifecycle: true,
  });
}

// Hook for logging in functional components
export function useComponentLogger(componentName?: string) {
  const logger = useLogger(componentName);
  const renderCountRef = useRef<number>(0);

  // Log render count
  useEffect(() => {
    renderCountRef.current += 1;
    logger.debug(`Render count: ${renderCountRef.current}`);
  });

  const logRender = useCallback((message?: string) => {
    logger.debug(message || 'Component rendered');
  }, [logger]);

  const logProps = useCallback((props: any) => {
    logger.debug('Props changed:', props);
  }, [logger]);

  const logState = useCallback((state: any) => {
    logger.debug('State changed:', state);
  }, [logger]);

  const logEffect = useCallback((effectName: string, dependencies?: any[]) => {
    logger.debug(`Effect ${effectName}`, { dependencies });
  }, [logger]);

  const logCallback = useCallback((callbackName: string, ...args: any[]) => {
    logger.debug(`Callback ${callbackName}`, args);
  }, [logger]);

  return {
    logger,
    logRender,
    logProps,
    logState,
    logEffect,
    logCallback,
  };
}

// Development-only logger (tree-shaken in production)
export function withDevLogger<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  if (__DEV__) {
    return withLogger(WrappedComponent, {
      logLevel: LogLevel.DEBUG,
      logProps: true,
      logLifecycle: true,
      logPerformance: true,
    });
  }
  return WrappedComponent;
}

export default withLogger;