// Core types for advanced learning modules

export type ModuleType = 
  | 'alphabet' 
  | 'numbers' 
  | 'vowels' 
  | 'consonants' 
  | 'syllables' 
  | 'grammar' 
  | 'sentence' 
  | 'dialogue' 
  | 'pronunciation'
  | 'culture';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface LearningModule {
  id: string;
  type: ModuleType;
  title: string;
  description: string;
  icon: string;
  difficulty: DifficultyLevel;
  estimatedTime: number; // in minutes
  xpReward: number;
  isLocked: boolean;
  progress: number; // 0-100
  subModules?: SubModule[];
}

export interface SubModule {
  id: string;
  title: string;
  type: 'lesson' | 'practice' | 'quiz' | 'game';
  content: ModuleContent;
  isCompleted: boolean;
  score?: number;
}

export interface ModuleContent {
  instructions?: string;
  items: ContentItem[];
  gamification?: GamificationElement;
}

export interface ContentItem {
  id: string;
  type: 'character' | 'word' | 'sentence' | 'audio' | 'image' | 'interactive';
  value: string;
  translation?: string;
  pronunciation?: string;
  audioUrl?: string;
  imageUrl?: string;
  hints?: string[];
  relatedItems?: string[];
}

export interface GamificationElement {
  type: 'streak' | 'timer' | 'lives' | 'combo' | 'achievement';
  value: number;
  maxValue?: number;
  rewards?: Reward[];
}

export interface Reward {
  type: 'xp' | 'badge' | 'unlock' | 'powerup';
  value: string | number;
  description?: string;
}

export interface TracingData {
  character: string;
  strokes: StrokeData[];
  guidePoints: Point[];
}

export interface StrokeData {
  points: Point[];
  order: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface AlphabetCharacter {
  id: string;
  character: string;
  romanization?: string;
  pronunciation: string;
  type: 'vowel' | 'consonant' | 'special';
  examples: WordExample[];
  tracingData?: TracingData;
  audioUrl?: string;
  difficulty: number;
}

export interface WordExample {
  word: string;
  translation: string;
  pronunciation?: string;
  audioUrl?: string;
}

export interface NumberData {
  id: string;
  digit: number;
  word: string;
  pronunciation: string;
  ordinal?: string;
  audioUrl?: string;
}

export interface SyllableData {
  id: string;
  syllable: string;
  components: string[];
  pronunciation: string;
  meaning?: string;
  audioUrl?: string;
}

export interface GrammarRule {
  id: string;
  rule: string;
  explanation: string;
  examples: GrammarExample[];
  exceptions?: string[];
  difficulty: DifficultyLevel;
}

export interface GrammarExample {
  correct: string;
  incorrect?: string;
  translation: string;
  explanation?: string;
}

export interface DialogueData {
  id: string;
  title: string;
  context: string;
  participants: string[];
  lines: DialogueLine[];
  vocabulary: WordExample[];
  culturalNotes?: string[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
  translation: string;
  audioUrl?: string;
}

export interface PracticeSession {
  moduleId: string;
  startTime: Date;
  endTime?: Date;
  exercises: Exercise[];
  score: number;
  accuracy: number;
  xpEarned: number;
  mistakes: Mistake[];
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  userAnswer?: string;
  correctAnswer: string;
  isCorrect?: boolean;
  timeSpent?: number;
  hints?: string[];
}

export type ExerciseType = 
  | 'tracing'
  | 'matching'
  | 'multiple_choice'
  | 'fill_blank'
  | 'pronunciation'
  | 'translation'
  | 'word_order'
  | 'listening'
  | 'speaking'
  | 'drag_drop'
  | 'memory_game';

export interface Mistake {
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  reviewCount: number;
}

export interface AIFeedback {
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  nextSteps: string[];
}

export interface UserProgress {
  userId: string;
  language: string;
  modules: ModuleProgress[];
  overallProgress: number;
  dailyGoal: number;
  dailyProgress: number;
  streakDays: number;
  totalXP: number;
  achievements: Achievement[];
  weakAreas: string[];
  strongAreas: string[];
}

export interface ModuleProgress {
  moduleId: string;
  progress: number;
  lastPracticed: Date;
  totalTime: number;
  accuracy: number;
  completedSubModules: string[];
  masteryLevel: 'learning' | 'practicing' | 'mastered';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DailyChallenge {
  id: string;
  date: string;
  challenges: Challenge[];
  totalXPReward: number;
  completed: boolean;
}

export interface Challenge {
  id: string;
  type: 'practice' | 'streak' | 'accuracy' | 'speed' | 'perfect';
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}