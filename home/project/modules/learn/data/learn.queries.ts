import { trpc } from '@/lib/trpc';

export function useLearnContent(targetName: string, nativeName: string) {
  return trpc.learn.getContent.useQuery({ targetName, nativeName });
}
