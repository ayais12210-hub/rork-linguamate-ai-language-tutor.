import { z } from 'zod';
import { protectedProcedure, createTRPCRouter } from '@/backend/trpc/create-context';
import { PreferenceProfile } from '@/schemas/preferences';
import SHA256 from 'crypto-js/sha256';

const store = new Map<string, { etag: string; profile: unknown; updatedAt: string }>();

function computeEtag(profile: unknown) {
  const json = JSON.stringify(profile);
  return SHA256(json).toString();
}

const getProcedure = protectedProcedure.query(({ ctx }) => {
  const existing = store.get(ctx.userId);
  if (!existing) {
    return { profile: null as unknown, etag: null as string | null };
  }
  return existing;
});

const upsertProcedure = protectedProcedure
  .input(z.object({ profile: PreferenceProfile, ifMatch: z.string().nullable().optional() }))
  .mutation(({ ctx, input }) => {
    const parsed = PreferenceProfile.parse(input.profile);
    const etag = computeEtag(parsed);
    const record = { etag, profile: parsed, updatedAt: new Date().toISOString() };
    store.set(ctx.userId, record);
    return record;
  });

export default createTRPCRouter({
  get: getProcedure,
  upsert: upsertProcedure,
});
