import '@testing-library/jest-native/extend-expect';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'node:util';
// Polyfill for libraries expecting Web TextEncoder/Decoder in Jest
// @ts-ignore
global.TextEncoder = TextEncoder;
// @ts-ignore
global.TextDecoder = TextDecoder as any;
// Some libraries expect globalThis.TextEncoder too
// @ts-ignore
globalThis.TextEncoder = globalThis.TextEncoder || TextEncoder;
// @ts-ignore
globalThis.TextDecoder = globalThis.TextDecoder || (TextDecoder as any);
// IMPORTANT: Use msw with node environment in Jest
import { server } from '../msw/server';

// Mock AsyncStorage for Jest
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    setItem: async (k: string, v: string) => {
      store[k] = v;
    },
    getItem: async (k: string) => store[k] ?? null,
    removeItem: async (k: string) => {
      delete store[k];
    },
    clear: async () => {
      store = {};
    },
  };
});

// Ensure crypto.randomUUID and webcrypto in Jest
try {
  const g: any = globalThis as any;
  if (!g.crypto || typeof g.crypto.randomUUID !== 'function') {
    // Prefer Node's webcrypto if available
    const nodeCrypto = require('node:crypto');
    const webcrypto = nodeCrypto.webcrypto;
    g.crypto = (webcrypto ?? {}) as Crypto;
    if (!g.crypto.randomUUID) {
      g.crypto.randomUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
  }
} catch {}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
