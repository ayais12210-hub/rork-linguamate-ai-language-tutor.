export interface LearnSession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  lessonsCompleted: string[];
  xpEarned: number;
  wordsLearned: string[];
}

export interface LearnProgress {
  currentLevel: string;
  completedLessons: string[];
  totalXP: number;
  streak: number;
  achievements: string[];
}

export interface LearnStats {
  totalSessions: number;
  totalTime: number;
  averageScore: number;
  bestStreak: number;
  totalWordsLearned: number;
}