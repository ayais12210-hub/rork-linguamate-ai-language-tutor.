import { trpc } from '@/lib/trpc';

export function useUpdateLessonProgress() {
  return trpc.lessons.updateProgress.useMutation();
}
