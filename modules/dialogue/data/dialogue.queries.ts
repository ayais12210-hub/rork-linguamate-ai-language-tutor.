import { trpc } from '@/lib/trpc';

export function useTopics() {
  return trpc.dialogue.getTopics.useQuery();
}

export function useScenes(topicId: string) {
  return trpc.dialogue.getScenes.useQuery({ topicId });
}

export function useTranscript(sessionId: string) {
  return trpc.dialogue.getTranscript.useQuery({ sessionId });
}
