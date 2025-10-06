import 'whatwg-url';

// MSW setup commented out temporarily due to ESM issues
// import { server } from '../msw/server';
// beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
// afterEach(() => server.resetHandlers());
// afterAll(() => server.close());

// Set up React Native globals for testing
(global as any).__DEV__ = process.env.NODE_ENV !== 'production';

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
