import '@testing-library/jest-native/extend-expect';
// Polyfill TextEncoder/TextDecoder BEFORE importing whatwg-url which needs them
// @ts-expect-error Node <19 in Jest environment may lack these globals
import { TextEncoder, TextDecoder } from 'util';
// @ts-expect-error assign to global for libs expecting web TextEncoder/Decoder
(global as any).TextEncoder = TextEncoder;
// @ts-expect-error assign to global for libs expecting web TextEncoder/Decoder
(global as any).TextDecoder = TextDecoder;
// Polyfill URL after globals are set
require('whatwg-url');
// Ensure Web Streams exist before initializing fetch polyfills
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web');
// @ts-expect-error assign web streams globals if missing
(global as any).ReadableStream = (global as any).ReadableStream || ReadableStream;
// @ts-expect-error assign web streams globals if missing
(global as any).WritableStream = (global as any).WritableStream || WritableStream;
// @ts-expect-error assign web streams globals if missing
(global as any).TransformStream = (global as any).TransformStream || TransformStream;
// Provide BroadcastChannel for libraries expecting it (prefer worker_threads if available)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BroadcastChannel } = require('worker_threads');
  // @ts-expect-error attach global
  (global as any).BroadcastChannel = (global as any).BroadcastChannel || BroadcastChannel;
} catch {
  // Minimal no-op fallback
  // @ts-expect-error attach global
  (global as any).BroadcastChannel =
    (global as any).BroadcastChannel ||
    class {
      name: string;
      onmessage: any;
      constructor(name?: string) { this.name = name || 'jest-broadcast'; }
      postMessage() {}
      close() {}
      addEventListener() {}
      removeEventListener() {}
    };
}
// Polyfill Fetch APIs required by MSW and libraries
try {
  // whatwg-fetch attaches fetch/Headers/Request/Response to globalThis
  require('whatwg-fetch');
} catch {}
// Require MSW server AFTER polyfills are in place
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { server } = require('../msw/server');

// Ensure React Native global flags exist in Jest
(globalThis as any).__DEV__ = true;

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
