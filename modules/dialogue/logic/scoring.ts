import { Score } from '@/schemas/dialogue.schema';
import { calculateCER, normalize, tokenize } from './normalization';
import { DialogueParams } from './adaptation';

export type ScoringInput = {
  userText: string;
  expectedPhrases?: string[];
  keyPhrases: string[];
  timeMs?: number;
  params: DialogueParams;
};

export type ScoringResult = Omit<Score, 'turnId'> & {
  semantic?: number;
};

export function scoreClientSide(input: ScoringInput): ScoringResult {
  const { userText, keyPhrases, params } = input;

  const cer = keyPhrases.length > 0
    ? Math.min(...keyPhrases.map((kp) => calculateCER(kp, userText)))
    : 0;

  const accuracy = Math.max(0, 1 - cer / params.targetCER);

  const userTokens = tokenize(userText);
  const keywordsHit = keyPhrases.filter((kp) => {
    const kpNorm = normalize(kp);
    return userTokens.some((token) => normalize(token).includes(kpNorm));
  });

  const keywordScore =
    keyPhrases.length > 0 ? keywordsHit.length / keyPhrases.length : 1;

  const fluency = Math.min(1, keywordScore + (1 - cer) * 0.5);

  const feedback = generateFeedback(accuracy, keywordsHit, keyPhrases, params);

  return {
    accuracy: Math.min(1, Math.max(0, accuracy)),
    fluency: Math.min(1, Math.max(0, fluency)),
    keywordsHit,
    feedback,
  };
}

export function combineScores(
  clientScore: ScoringResult,
  semanticScore?: number
): ScoringResult {
  if (semanticScore === undefined) {
    return clientScore;
  }

  const combinedAccuracy =
    0.5 * semanticScore + 0.3 * clientScore.accuracy + 0.2 * clientScore.fluency;

  return {
    ...clientScore,
    accuracy: Math.min(1, Math.max(0, combinedAccuracy)),
    semantic: semanticScore,
  };
}

function generateFeedback(
  accuracy: number,
  keywordsHit: string[],
  keyPhrases: string[],
  params: DialogueParams
): string {
  if (accuracy >= 0.9) {
    return params.coachTone === 'gentle'
      ? 'Excellent! You nailed it! 🎉'
      : params.coachTone === 'neutral'
        ? 'Great job!'
        : 'Correct.';
  }

  if (accuracy >= 0.7) {
    const missed = keyPhrases.filter((kp) => !keywordsHit.includes(kp));
    if (missed.length > 0 && params.hintMode !== 'none') {
      return `Good effort! Try including: "${missed[0]}"`;
    }
    return params.coachTone === 'gentle'
      ? 'Nice try! Keep going!'
      : 'Acceptable.';
  }

  if (params.hintMode === 'active') {
    return `Let's try again. Use: "${keyPhrases[0] ?? 'the key phrase'}"`;
  }

  return params.coachTone === 'gentle'
    ? "Don't worry, let's practice more!"
    : 'Needs improvement.';
}
