export const scoring = {
  // Scoring logic
  calculateScore: (correct: number, total: number, timeSpent: number) => {
    const accuracy = correct / total;
    const speedBonus = Math.max(0, 1 - timeSpent / 300); // 5 minute max
    return Math.round((accuracy * 100) + (speedBonus * 20));
  },
  
  calculateXP: (score: number, difficulty: string) => {
    const difficultyMultiplier = {
      beginner: 1,
      intermediate: 1.5,
      advanced: 2,
    }[difficulty] || 1;
    
    return Math.round(score * difficultyMultiplier);
  },
  
  getGrade: (score: number): 'A' | 'B' | 'C' | 'D' | 'F' => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },
};