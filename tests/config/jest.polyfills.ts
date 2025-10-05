import 'whatwg-fetch';

// Minimal BroadcastChannel polyfill for tests that import msw ws module
if (!(globalThis as any).BroadcastChannel) {
  (globalThis as any).BroadcastChannel = class {
    name: string;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(_msg: unknown) {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  } as unknown as typeof BroadcastChannel;
}
