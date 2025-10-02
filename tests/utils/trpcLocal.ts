import { appRouter } from '../../backend/trpc/app-router';
import { createContext } from '../../backend/trpc/create-context';

export async function createTestContext(overrides?: Partial<any>) {
  return createContext({
    req: {} as any,
    resHeaders: new Headers(),
    info: {} as any,
    ...overrides
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
