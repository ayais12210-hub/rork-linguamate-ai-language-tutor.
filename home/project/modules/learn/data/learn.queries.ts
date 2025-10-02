import { trpc } from '@/lib/trpc';

export function useLearnData() {
  return trpc.learn.getData.useQuery();
}
