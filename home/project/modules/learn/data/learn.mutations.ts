import { trpc } from '@/lib/trpc';

export function useSubmitProgress() {
  return trpc.learn.submitProgress.useMutation();
}
