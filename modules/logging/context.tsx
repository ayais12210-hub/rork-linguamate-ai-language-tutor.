import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CorrelationInfo, UserInfo } from './schemas';

interface LoggingContextValue {
  correlationId: string | null;
  sessionId: string | null;
  userInfo: UserInfo | null;
  setCorrelationId: (id: string | null) => void;
  setSessionId: (id: string | null) => void;
  setUserInfo: (info: UserInfo | null) => void;
  generateCorrelationId: () => string;
}

const LoggingContext = createContext<LoggingContextValue | undefined>(undefined);

function generateUUID(): string {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function LoggingContextProvider({ children }: { children: ReactNode }) {
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => generateUUID());
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const generateCorrelationId = useCallback(() => {
    const id = generateUUID();
    setCorrelationId(id);
    return id;
  }, []);

  const value: LoggingContextValue = {
    correlationId,
    sessionId,
    userInfo,
    setCorrelationId,
    setSessionId,
    setUserInfo,
    generateCorrelationId,
  };

  return (
    <LoggingContext.Provider value={value}>
      {children}
    </LoggingContext.Provider>
  );
}

export function useLoggingContext(): LoggingContextValue {
  const context = useContext(LoggingContext);
  if (!context) {
    throw new Error('useLoggingContext must be used within LoggingContextProvider');
  }
  return context;
}

export function getCorrelationInfo(context: LoggingContextValue): CorrelationInfo | undefined {
  if (!context.correlationId && !context.sessionId) {
    return undefined;
  }

  return {
    correlationId: context.correlationId || generateUUID(),
    sessionId: context.sessionId || undefined,
  };
}

type AnyFunction = (...args: any[]) => any;

export function withCorrelation<T extends AnyFunction>(
  fn: T,
  context?: LoggingContextValue
): T {
  const wrapped = (...args: any[]) => {
    if (context) {
      const correlationId = generateUUID();
      context.setCorrelationId(correlationId);
    }
    return fn(...args);
  };
  return wrapped as T;
}
