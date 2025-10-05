// With moduleNameMapper forcing 'msw/node' to CJS path, simple require works
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setupServer } = require('msw/node');
import { handlers } from './handlers';

export const server = setupServer(...handlers);
