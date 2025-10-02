export interface LearnSession {
  id: string;
  startedAt: number;
  completedAt?: number;
  exercises: Exercise[];
  score: number;
  xp: number;
}

export interface Exercise {
  id: string;
  type: 'mcq' | 'translation' | 'listening' | 'speaking';
  prompt: string;
  options?: string[];
  answer: string;
  userAnswer?: string;
  correct?: boolean;
}

export interface LearnProgress {
  totalXP: number;
  sessionsCompleted: number;
  currentStreak: number;
  lastSessionAt?: number;
}
