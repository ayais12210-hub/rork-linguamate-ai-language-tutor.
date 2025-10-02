import { usePreferences } from '@/state/preferencesStore';
import { Difficulty } from '@/schemas/difficulty.schema';
import { trackDifficultyAutoAdapt } from '@/lib/analytics';

export type AdaptSignal = 'promote' | 'demote' | 'stay';

export function evaluateSessionAccuracy(
  correct: number,
  total: number
): AdaptSignal {
  const acc = total ? correct / total : 0;
  const target = usePreferences.getState().params.targetAccuracy;

  if (acc >= target + 0.07) return 'promote';
  if (acc <= target - 0.12) return 'demote';
  return 'stay';
}

export function maybeAdjustDifficulty(
  signal: AdaptSignal,
  sessionId: string,
  accuracy: number
): Difficulty | undefined {
  const current = usePreferences.getState().difficulty;
  const autoAdapt = usePreferences.getState().autoAdapt;

  if (!autoAdapt || signal === 'stay') return undefined;

  const order: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
  const idx = order.indexOf(current);
  const nextIdx =
    signal === 'promote'
      ? Math.min(idx + 1, order.length - 1)
      : Math.max(idx - 1, 0);
  const newDiff = order[nextIdx];

  if (newDiff !== current) {
    usePreferences.getState().setDifficulty(newDiff);
    trackDifficultyAutoAdapt(current, newDiff, sessionId, accuracy);
    return newDiff;
  }

  return undefined;
}
