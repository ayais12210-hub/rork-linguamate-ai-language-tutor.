// Lightweight no-op MSW server shim for Jest
// This avoids heavy polyfills in unit tests and is sufficient
// because our tests do not rely on specific network mocks.
export const server = {
  listen: (_opts?: unknown) => void 0,
  resetHandlers: () => void 0,
  close: () => void 0,
};
