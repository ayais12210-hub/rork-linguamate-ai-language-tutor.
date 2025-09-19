export const API_CONSTANTS = {
  // Base URLs
  BASE_URL: 'https://api.example.com',
  TIMEOUT: 10000,
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE_PROFILE: '/user/profile',
      DELETE_ACCOUNT: '/user/delete',
      PREFERENCES: '/user/preferences',
    },
    LESSONS: {
      LIST: '/lessons',
      GET: '/lessons/:id',
      COMPLETE: '/lessons/:id/complete',
      PROGRESS: '/lessons/progress',
    },
    VOCABULARY: {
      LIST: '/vocabulary',
      ADD: '/vocabulary',
      UPDATE: '/vocabulary/:id',
      DELETE: '/vocabulary/:id',
      REVIEW: '/vocabulary/review',
    },
    ANALYTICS: {
      PROGRESS: '/analytics/progress',
      STREAKS: '/analytics/streaks',
      ACHIEVEMENTS: '/analytics/achievements',
      LEADERBOARD: '/analytics/leaderboard',
    },
  } as const,
  
  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  } as const,
  
  // Request Headers
  HEADERS: {
    CONTENT_TYPE: 'Content-Type',
    AUTHORIZATION: 'Authorization',
    ACCEPT: 'Accept',
    USER_AGENT: 'User-Agent',
  } as const,
  
  // Content Types
  CONTENT_TYPES: {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT: 'text/plain',
  } as const,
} as const;

export const STORAGE_KEYS = {
  // Authentication
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  
  // User Preferences
  LANGUAGE_PREFERENCE: 'language_preference',
  THEME_PREFERENCE: 'theme_preference',
  NOTIFICATION_SETTINGS: 'notification_settings',
  
  // Learning Data
  LEARNING_PROGRESS: 'learning_progress',
  VOCABULARY_DATA: 'vocabulary_data',
  LESSON_HISTORY: 'lesson_history',
  STREAK_DATA: 'streak_data',
  
  // App Settings
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_LAUNCH: 'first_launch',
  APP_VERSION: 'app_version',
  
  // Cache
  CACHE_LESSONS: 'cache_lessons',
  CACHE_VOCABULARY: 'cache_vocabulary',
  CACHE_USER_PROFILE: 'cache_user_profile',
  
  // Temporary Data
  TEMP_LESSON_STATE: 'temp_lesson_state',
  TEMP_QUIZ_ANSWERS: 'temp_quiz_answers',
} as const;

export const ERROR_MESSAGES = {
  // Network Errors
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  
  // Validation Errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  
  // General Errors
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  DATA_NOT_FOUND: 'Requested data not found.',
  PERMISSION_DENIED: 'Permission denied.',
  
  // Learning Errors
  LESSON_NOT_AVAILABLE: 'This lesson is not available yet.',
  PROGRESS_SAVE_FAILED: 'Failed to save your progress. Please try again.',
  AUDIO_PLAYBACK_FAILED: 'Audio playback failed. Please check your device settings.',
} as const;

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  PASSWORD_RESET_SUCCESS: 'Password reset email sent!',
  
  // Profile
  PROFILE_UPDATED: 'Profile updated successfully!',
  PREFERENCES_SAVED: 'Preferences saved successfully!',
  
  // Learning
  LESSON_COMPLETED: 'Lesson completed! Great job!',
  PROGRESS_SAVED: 'Progress saved successfully!',
  GOAL_ACHIEVED: 'Congratulations! You achieved your daily goal!',
  STREAK_MILESTONE: 'Amazing! You reached a new streak milestone!',
  
  // General
  CHANGES_SAVED: 'Changes saved successfully!',
  DATA_SYNCED: 'Data synchronized successfully!',
} as const;

export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, // At least one lowercase, uppercase, and digit
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;
export type ErrorMessage = keyof typeof ERROR_MESSAGES;
export type SuccessMessage = keyof typeof SUCCESS_MESSAGES;