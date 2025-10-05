import { Difficulty } from '@/schemas/difficulty.schema';

export type DifficultyEvent =
  | {
      type: 'difficulty_select';
      level: Difficulty;
      source: 'onboarding' | 'settings';
    }
  | {
      type: 'difficulty_auto_adapt';
      from: Difficulty;
      to: Difficulty;
      sessionId: string;
      accuracy: number;
    }
  | {
      type: 'session_metrics';
      level: Difficulty;
      correct: number;
      total: number;
      accuracy: number;
      sessionId: string;
    };

export const Analytics = {
  enabled: process.env.ANALYTICS_ENABLED === '1',
  track: (event: string, props?: Record<string, any>) => {
    if (!Analytics.enabled) return;
    if (__DEV__) {

      console.log('[analytics]', event, props);

    }
  },
};

export function trackDifficultyEvent(event: DifficultyEvent): void {
  console.log('[Analytics] Difficulty Event:', {
    ...event,
    timestamp: new Date().toISOString(),
  });
}

export function trackDifficultySelect(
  level: Difficulty,
  source: 'onboarding' | 'settings'
): void {
  trackDifficultyEvent({
    type: 'difficulty_select',
    level,
    source,
  });
}

export function trackDifficultyAutoAdapt(
  from: Difficulty,
  to: Difficulty,
  sessionId: string,
  accuracy: number
): void {
  trackDifficultyEvent({
    type: 'difficulty_auto_adapt',
    from,
    to,
    sessionId,
    accuracy,
  });
}

export function trackSessionMetrics(
  level: Difficulty,
  correct: number,
  total: number,
  sessionId: string
): void {
  const accuracy = total > 0 ? correct / total : 0;
  trackDifficultyEvent({
    type: 'session_metrics',
    level,
    correct,
    total,
    accuracy,
    sessionId,
  });
}
