// Jest setup with RTL and MSW configuration
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    name: 'Test App',
    version: '1.0.0',
  },
}));

jest.mock('expo-application', () => ({
  applicationName: 'Test App',
  nativeApplicationVersion: '1.0.0',
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
}));

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback) => callback({ setContext: jest.fn(), setTag: jest.fn() })),
  startTransaction: jest.fn(() => ({
    setStatus: jest.fn(),
    finish: jest.fn(),
  })),
}));

// Mock our logger to prevent console spam in tests
jest.mock('@/lib/log', () => ({
  log: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    scope: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock feature flags
jest.mock('@/lib/flags', () => ({
  isEnabled: jest.fn(() => true),
  featureFlags: {
    isEnabled: jest.fn(() => true),
    initialize: jest.fn(),
  },
}));

// Setup MSW
import { setupServer } from 'msw/node';
import { handlers } from './tests/mocks/handlers';

export const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

// Reset any request handlers that we may add during the tests
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

// Global test utilities
global.TestUtils = {
  // Helper to wait for async operations
  waitFor: (ms: number = 0) => new Promise((resolve) => setTimeout(resolve, ms)),
  
  // Helper to create mock functions with TypeScript support
  createMockFn: <T extends (...args: any[]) => any>(implementation?: T): jest.MockedFunction<T> => {
    return jest.fn(implementation) as jest.MockedFunction<T>;
  },
  
  // Helper to suppress console errors in tests
  suppressConsoleError: (fn: () => void | Promise<void>) => {
    const originalError = console.error;
    console.error = jest.fn();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        console.error = originalError;
      });
    } else {
      console.error = originalError;
      return result;
    }
  },
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(a: number, b: number): R;
    }
  }
  
  var TestUtils: {
    waitFor: (ms?: number) => Promise<void>;
    createMockFn: <T extends (...args: any[]) => any>(implementation?: T) => jest.MockedFunction<T>;
    suppressConsoleError: (fn: () => void | Promise<void>) => void | Promise<void>;
  };
}

// Custom matcher for number ranges
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});