export type SemanticScoreResult = {
  semantic: number;
  feedback: string;
};

export async function scoreSemanticServer(
  text: string,
  goal: string,
  lang: string
): Promise<SemanticScoreResult> {
  console.log('[Scorer] Semantic scoring:', { text, goal, lang });

  const textLower = text.toLowerCase();
  const goalLower = goal.toLowerCase();

  const goalWords = goalLower.split(/\s+/);
  const matchedWords = goalWords.filter((word) => textLower.includes(word));
  const semantic = matchedWords.length / Math.max(goalWords.length, 1);

  const feedback =
    semantic >= 0.7
      ? 'Great! Your response aligns well with the goal.'
      : semantic >= 0.4
        ? 'Good attempt. Try to include more key concepts.'
        : 'Let\'s focus on the main goal of the conversation.';

  return {
    semantic: Math.min(1, semantic),
    feedback,
  };
}
