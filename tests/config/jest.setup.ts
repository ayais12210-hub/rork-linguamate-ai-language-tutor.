import 'whatwg-url';

// MSW setup commented out temporarily due to ESM issues
// import { server } from '../msw/server';
// beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// Set __DEV__ global for React Native (already declared by React Native types)
(global as any).__DEV__ = true;

global.crypto = {
  ...global.crypto,
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
} as Crypto;

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
