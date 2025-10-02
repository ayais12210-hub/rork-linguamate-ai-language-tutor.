export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function calculateXP(correct: number, total: number): number {
  const baseXP = 10;
  const bonusMultiplier = correct / total;
  return Math.round(baseXP * total * bonusMultiplier);
}
