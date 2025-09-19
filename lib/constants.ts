// Application constants for the language learning app

// App configuration
export const APP_CONFIG = {
  NAME: 'Language Learning App',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered language learning platform',
  SUPPORT_EMAIL: 'support@languageapp.com',
  WEBSITE: 'https://languageapp.com',
  PRIVACY_POLICY_URL: 'https://languageapp.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://languageapp.com/terms',
} as const;

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  th: { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  sv: { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  da: { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  no: { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  beginner: {
    name: 'Beginner',
    description: 'New to the language',
    color: '#4CAF50',
    icon: '🌱',
  },
  intermediate: {
    name: 'Intermediate',
    description: 'Some experience with the language',
    color: '#FF9800',
    icon: '🌿',
  },
  advanced: {
    name: 'Advanced',
    description: 'Comfortable with the language',
    color: '#F44336',
    icon: '🌳',
  },
} as const;

export type DifficultyLevel = keyof typeof DIFFICULTY_LEVELS;

// Learning modules
export const LEARNING_MODULES = {
  alphabet: {
    name: 'Alphabet',
    description: 'Learn the alphabet and basic sounds',
    icon: '🔤',
    color: '#E3F2FD',
    estimatedTime: 15,
  },
  numbers: {
    name: 'Numbers',
    description: 'Learn numbers and counting',
    icon: '🔢',
    color: '#F3E5F5',
    estimatedTime: 20,
  },
  vowels: {
    name: 'Vowels',
    description: 'Master vowel sounds and pronunciation',
    icon: '🎵',
    color: '#E8F5E8',
    estimatedTime: 25,
  },
  consonants: {
    name: 'Consonants',
    description: 'Learn consonant sounds and combinations',
    icon: '🎶',
    color: '#FFF3E0',
    estimatedTime: 30,
  },
  syllables: {
    name: 'Syllables',
    description: 'Practice syllable formation and rhythm',
    icon: '🎼',
    color: '#FCE4EC',
    estimatedTime: 20,
  },
  grammar: {
    name: 'Grammar',
    description: 'Essential grammar rules and structures',
    icon: '📚',
    color: '#E1F5FE',
    estimatedTime: 35,
  },
  dialogue: {
    name: 'Dialogue',
    description: 'Practice conversations and interactions',
    icon: '💬',
    color: '#F1F8E9',
    estimatedTime: 40,
  },
  sentence: {
    name: 'Sentences',
    description: 'Build and understand complete sentences',
    icon: '📝',
    color: '#FFF8E1',
    estimatedTime: 30,
  },
  pronunciation: {
    name: 'Pronunciation',
    description: 'Perfect your accent and speaking skills',
    icon: '🗣️',
    color: '#EFEBE9',
    estimatedTime: 25,
  },
  culture: {
    name: 'Culture',
    description: 'Learn about culture and customs',
    icon: '🌍',
    color: '#E8EAF6',
    estimatedTime: 45,
  },
} as const;

export type ModuleType = keyof typeof LEARNING_MODULES;

// User subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Basic lessons',
      'Limited AI chat',
      '3 modules per day',
      'Basic progress tracking',
    ],
    limits: {
      dailyMessages: 10,
      dailyModules: 3,
      offlineContent: false,
    },
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    features: [
      'All lessons and modules',
      'Unlimited AI chat',
      'Offline content',
      'Advanced analytics',
      'Personalized learning path',
      'Priority support',
    ],
    limits: {
      dailyMessages: -1, // Unlimited
      dailyModules: -1, // Unlimited
      offlineContent: true,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

// Achievement types
export const ACHIEVEMENT_TYPES = {
  streak: {
    name: 'Streak Master',
    description: 'Maintain learning streaks',
    icon: '🔥',
    color: '#FF5722',
  },
  modules: {
    name: 'Module Completionist',
    description: 'Complete learning modules',
    icon: '🎯',
    color: '#2196F3',
  },
  vocabulary: {
    name: 'Word Collector',
    description: 'Learn new vocabulary',
    icon: '📖',
    color: '#4CAF50',
  },
  conversation: {
    name: 'Conversation Expert',
    description: 'Practice conversations',
    icon: '💭',
    color: '#9C27B0',
  },
  pronunciation: {
    name: 'Pronunciation Pro',
    description: 'Perfect pronunciation',
    icon: '🎤',
    color: '#FF9800',
  },
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  reminder: {
    title: 'Time to Learn!',
    body: 'Your daily lesson is waiting for you',
    icon: '📚',
  },
  streak: {
    title: 'Keep Your Streak!',
    body: "Don't break your learning streak",
    icon: '🔥',
  },
  achievement: {
    title: 'Achievement Unlocked!',
    body: 'You earned a new badge',
    icon: '🏆',
  },
  lesson: {
    title: 'New Lesson Available',
    body: 'A new lesson is ready for you',
    icon: '✨',
  },
} as const;

// Time constants
export const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// API limits
export const API_LIMITS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_AUDIO_DURATION: 5 * 60 * 1000, // 5 minutes
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: TIME_CONSTANTS.HOUR,
} as const;

// Storage limits
export const STORAGE_LIMITS = {
  MAX_OFFLINE_LESSONS: 50,
  MAX_CHAT_HISTORY: 1000,
  MAX_VOCABULARY_WORDS: 10000,
  CACHE_EXPIRY: 7 * TIME_CONSTANTS.DAY,
} as const;

// UI constants
export const UI_CONSTANTS = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 3000,
  LOADING_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Color palette
export const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  
  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Border colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
} as const;

// Font sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// Border radius
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// Shadow presets
export const SHADOWS = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Authentication failed. Please log in again.',
  FORBIDDEN: 'Access denied. You may need to upgrade your account.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LESSON_COMPLETED: 'Great job! Lesson completed successfully.',
  PROGRESS_SAVED: 'Your progress has been saved.',
  SETTINGS_UPDATED: 'Settings updated successfully.',
  ACCOUNT_CREATED: 'Account created successfully. Welcome!',
  PASSWORD_CHANGED: 'Password changed successfully.',
  EMAIL_VERIFIED: 'Email verified successfully.',
  SUBSCRIPTION_UPGRADED: 'Subscription upgraded successfully.',
} as const;