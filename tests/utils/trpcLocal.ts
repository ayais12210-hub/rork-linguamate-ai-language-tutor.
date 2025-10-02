import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';

export async function createTestContext(overrides?: Partial<any>) {
  const mockReq = {
    headers: new Headers(),
    method: 'POST',
    url: 'http://localhost:3000/api/trpc',
  } as any;

  return createContext({
    req: mockReq,
    resHeaders: new Headers(),
    info: {} as any,
    ...overrides,
  });
}

export async function callProcedure<T = any>(
  procedurePath: string,
  input?: any,
  contextOverrides?: any
): Promise<T> {
  const ctx = await createTestContext(contextOverrides);
  const caller = appRouter.createCaller(ctx);

  const pathParts = procedurePath.split('.');
  let procedure: any = caller;

  for (const part of pathParts) {
    procedure = procedure[part];
  }

  if (typeof procedure === 'function') {
    return procedure(input);
  }

  throw new Error(`Procedure ${procedurePath} not found or not callable`);
}

export function createMockUser(overrides?: Partial<any>) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    ...overrides,
  };
}

export function createAuthenticatedContext(userId: string = 'test-user-id') {
  return createTestContext({
    userId,
    sessionId: 'test-session-id',
  });
}
