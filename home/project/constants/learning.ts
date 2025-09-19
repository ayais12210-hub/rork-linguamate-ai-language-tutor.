export const LEARNING_CONSTANTS = {
  // Difficulty Levels
  DIFFICULTY_LEVELS: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
  } as const,

  // Learning Goals (words per day)
  DAILY_GOALS: {
    CASUAL: 5,
    REGULAR: 10,
    SERIOUS: 20,
    INTENSE: 50,
  } as const,

  // XP Points
  XP_REWARDS: {
    LESSON_COMPLETE: 10,
    PERFECT_LESSON: 15,
    STREAK_BONUS: 5,
    DAILY_GOAL: 20,
    WEEKLY_GOAL: 50,
    MONTHLY_GOAL: 200,
    FIRST_LESSON: 25,
    MODULE_COMPLETE: 100,
  } as const,

  // Streak Rewards
  STREAK_MILESTONES: {
    WEEK: 7,
    MONTH: 30,
    QUARTER: 90,
    YEAR: 365,
  } as const,

  // Learning Session Durations (minutes)
  SESSION_DURATIONS: {
    SHORT: 5,
    MEDIUM: 15,
    LONG: 30,
    EXTENDED: 60,
  } as const,

  // Spaced Repetition Intervals (days)
  SRS_INTERVALS: {
    NEW: 0,
    LEARNING: [1, 3],
    REVIEW: [7, 14, 30, 90, 180, 365],
  } as const,

  // Mastery Levels
  MASTERY_LEVELS: {
    NEW: 0,
    LEARNING: 1,
    FAMILIAR: 2,
    PROFICIENT: 3,
    MASTERED: 4,
  } as const,

  // Question Types
  QUESTION_TYPES: {
    MULTIPLE_CHOICE: 'multiple_choice',
    FILL_BLANK: 'fill_blank',
    TRANSLATION: 'translation',
    LISTENING: 'listening',
    SPEAKING: 'speaking',
    MATCHING: 'matching',
    ORDERING: 'ordering',
  } as const,

  // Module Types
  MODULE_TYPES: {
    ALPHABET: 'alphabet',
    NUMBERS: 'numbers',
    VOWELS: 'vowels',
    CONSONANTS: 'consonants',
    SYLLABLES: 'syllables',
    GRAMMAR: 'grammar',
    DIALOGUE: 'dialogue',
    SENTENCE: 'sentence',
    PRONUNCIATION: 'pronunciation',
    CULTURE: 'culture',
  } as const,

  // Achievement Types
  ACHIEVEMENT_TYPES: {
    STREAK: 'streak',
    LESSONS: 'lessons',
    XP: 'xp',
    PERFECT: 'perfect',
    SPEED: 'speed',
    CONSISTENCY: 'consistency',
  } as const,
} as const;

export const GAMIFICATION_CONSTANTS = {
  // Levels and XP
  LEVEL_XP_REQUIREMENTS: {
    1: 0,
    2: 100,
    3: 250,
    4: 450,
    5: 700,
    6: 1000,
    7: 1350,
    8: 1750,
    9: 2200,
    10: 2700,
    11: 3250,
    12: 3850,
    13: 4500,
    14: 5200,
    15: 5950,
    16: 6750,
    17: 7600,
    18: 8500,
    19: 9450,
    20: 10450,
  } as const,

  // Badges
  BADGES: {
    FIRST_LESSON: {
      id: 'first_lesson',
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
    },
    WEEK_STREAK: {
      id: 'week_streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
    },
    MONTH_STREAK: {
      id: 'month_streak',
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: '💎',
    },
    PERFECT_WEEK: {
      id: 'perfect_week',
      name: 'Perfectionist',
      description: 'Get perfect scores for a week',
      icon: '⭐',
    },
    SPEED_DEMON: {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Complete 10 lessons in one day',
      icon: '⚡',
    },
    EARLY_BIRD: {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Complete lessons before 8 AM for 7 days',
      icon: '🌅',
    },
    NIGHT_OWL: {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Complete lessons after 10 PM for 7 days',
      icon: '🦉',
    },
  } as const,

  // Leaderboard
  LEADERBOARD_TYPES: {
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    ALL_TIME: 'all_time',
  } as const,
} as const;

export const NOTIFICATION_CONSTANTS = {
  // Notification Types
  TYPES: {
    REMINDER: 'reminder',
    STREAK: 'streak',
    ACHIEVEMENT: 'achievement',
    GOAL: 'goal',
    SOCIAL: 'social',
  } as const,

  // Default Reminder Times
  DEFAULT_REMINDERS: [
    { hour: 9, minute: 0, label: 'Morning' },
    { hour: 18, minute: 0, label: 'Evening' },
  ] as const,

  // Reminder Messages
  REMINDER_MESSAGES: [
    "Time to practice! Your language skills are waiting! 📚",
    "Don't break your streak! A few minutes of practice goes a long way 🔥",
    "Your daily goal is within reach! Let's learn together 🎯",
    "Ready for today's lesson? Your future self will thank you! 🌟",
    "Learning time! Every word you learn is progress 💪",
  ] as const,
} as const;

export type DifficultyLevel = keyof typeof LEARNING_CONSTANTS.DIFFICULTY_LEVELS;
export type DailyGoal = keyof typeof LEARNING_CONSTANTS.DAILY_GOALS;
export type QuestionType = typeof LEARNING_CONSTANTS.QUESTION_TYPES[keyof typeof LEARNING_CONSTANTS.QUESTION_TYPES];
export type ModuleType = typeof LEARNING_CONSTANTS.MODULE_TYPES[keyof typeof LEARNING_CONSTANTS.MODULE_TYPES];
export type AchievementType = typeof LEARNING_CONSTANTS.ACHIEVEMENT_TYPES[keyof typeof LEARNING_CONSTANTS.ACHIEVEMENT_TYPES];