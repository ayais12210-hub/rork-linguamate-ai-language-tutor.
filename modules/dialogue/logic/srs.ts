import { usePreferences } from '@/state/preferencesStore';
import { Score } from '@/schemas/dialogue.schema';

export function calculateNextReview(
  scores: Score[],
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): number {
  const prefs = usePreferences.getState();
  const intervals = prefs.params.srsIntervals;

  if (scores.length === 0) {
    return Date.now() + intervals[0] * 60 * 1000;
  }

  const avgAccuracy =
    scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length;
  const targetAccuracy = prefs.params.targetAccuracy;

  let intervalIndex = 0;
  if (avgAccuracy >= targetAccuracy + 0.1) {
    intervalIndex = Math.min(intervals.length - 1, 3);
  } else if (avgAccuracy >= targetAccuracy) {
    intervalIndex = Math.min(intervals.length - 1, 2);
  } else if (avgAccuracy >= targetAccuracy - 0.1) {
    intervalIndex = 1;
  } else {
    intervalIndex = 0;
  }

  const intervalMinutes = intervals[intervalIndex] ?? intervals[0];
  return Date.now() + intervalMinutes * 60 * 1000;
}

export function isDue(srsDueAt: number | undefined): boolean {
  if (!srsDueAt) return false;
  return Date.now() >= srsDueAt;
}
