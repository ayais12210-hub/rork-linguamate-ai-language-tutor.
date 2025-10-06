import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';

async function call(path: string, input?: any, headers?: HeadersInit) {
  const ctx = await createContext({
    req: new Request('http://localhost', { headers }),
    resHeaders: new Headers(),
    info: {} as any,
  } as any);
  const caller = appRouter.createCaller(ctx);
  const parts = path.split('.');
  let proc: any = caller;
  for (const p of parts) proc = proc[p];
  return proc(input);
}

describe('tRPC happy and invalid routes', () => {
  it('example.hi returns greeting', async () => {
    const result = await call('example.hi', { name: 'World' });
    expect(result.hello).toBe('World');
  });

  it('protected route rejects without auth', async () => {
    await expect(call('user.get')).rejects.toThrowError();
  });
});
