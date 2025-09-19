export interface User {
  id: string;
  name?: string;
  email?: string;
  nativeLanguage?: string;
  selectedLanguage?: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced';
  isPremium: boolean;
  stats?: UserStats;
  settings?: UserSettings;
  onboardingCompleted: boolean;
  learningGoals?: string[];
  interests?: string[];
  preferredTopics?: string[];
  dailyGoalMinutes?: number;
  createdAt?: number;
  dailyMessageCount?: number;
  lastMessageReset?: number;
  targetLanguage?: string;
  dailyGoal?: number;
  streak?: number;
  totalXP?: number;
  achievements?: string[];
  completedLessons?: string[];
}

export interface UserStats {
  totalChats: number;
  streakDays: number;
  wordsLearned: number;
  xpPoints: number;
  lastActiveDate: string;
  messagesUsedToday: number;
  lastMessageDate: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface UserSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  hapticsEnabled?: boolean;
  autoPlayAudio?: boolean;
  reminderTime?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  corrections?: Correction[];
  language: string;
  nativeTranslation?: string;
  targetTranslation?: string;
  context?: string;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

export interface OnboardingData {
  learningGoals: string[];
  interests: string[];
  preferredTopics: string[];
  dailyGoalMinutes: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  previousExperience: string;
  motivations: string[];
}