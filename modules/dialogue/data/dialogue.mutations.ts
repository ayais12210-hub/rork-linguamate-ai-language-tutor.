import { trpc } from '@/lib/trpc';

export function useStartSession() {
  return trpc.dialogue.startSession.useMutation();
}

export function useSubmitTurn() {
  return trpc.dialogue.submitTurn.useMutation();
}

export function useEndSession() {
  return trpc.dialogue.endSession.useMutation();
}

export function useScoreSemantic() {
  return trpc.dialogue.scoreSemantic.useMutation();
}
