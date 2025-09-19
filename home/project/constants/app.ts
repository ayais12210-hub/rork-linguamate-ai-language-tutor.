export const DEVICE_CONSTANTS = {
  // Screen Breakpoints
  BREAKPOINTS: {
    SMALL: 320,
    MEDIUM: 768,
    LARGE: 1024,
    EXTRA_LARGE: 1200,
  } as const,
  
  // Platform Specific
  PLATFORM: {
    IOS: 'ios',
    ANDROID: 'android',
    WEB: 'web',
  } as const,
  
  // Haptic Feedback Types
  HAPTIC_TYPES: {
    LIGHT: 'light',
    MEDIUM: 'medium',
    HEAVY: 'heavy',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
  } as const,
  
  // Animation Durations (ms)
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    EXTRA_SLOW: 1000,
  } as const,
  
  // Touch Targets (minimum recommended sizes)
  TOUCH_TARGET: {
    MIN_SIZE: 44,
    COMFORTABLE_SIZE: 48,
    LARGE_SIZE: 56,
  } as const,
} as const;

export const ACCESSIBILITY_CONSTANTS = {
  // Accessibility Labels
  LABELS: {
    CLOSE: 'Close',
    BACK: 'Go back',
    NEXT: 'Next',
    PREVIOUS: 'Previous',
    PLAY: 'Play audio',
    PAUSE: 'Pause audio',
    MENU: 'Open menu',
    SEARCH: 'Search',
    SETTINGS: 'Settings',
    PROFILE: 'Profile',
    HOME: 'Home',
    LESSONS: 'Lessons',
    PROGRESS: 'Progress',
  } as const,
  
  // Accessibility Hints
  HINTS: {
    TAP_TO_PLAY: 'Tap to play audio',
    DOUBLE_TAP_TO_SELECT: 'Double tap to select',
    SWIPE_FOR_MORE: 'Swipe for more options',
    LONG_PRESS_FOR_MENU: 'Long press for menu',
  } as const,
  
  // Accessibility Roles
  ROLES: {
    BUTTON: 'button',
    LINK: 'link',
    TEXT: 'text',
    IMAGE: 'image',
    HEADER: 'header',
    SEARCH: 'search',
    MENU: 'menu',
    TAB: 'tab',
    CHECKBOX: 'checkbox',
    RADIO: 'radio',
  } as const,
} as const;

export const PERFORMANCE_CONSTANTS = {
  // Image Optimization
  IMAGE: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    QUALITY: 0.8,
    THUMBNAIL_SIZE: 150,
  } as const,
  
  // Caching
  CACHE: {
    MAX_AGE: 86400000, // 24 hours in ms
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    CLEANUP_THRESHOLD: 0.8, // Clean when 80% full
  } as const,
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    INFINITE_SCROLL_THRESHOLD: 0.8,
  } as const,
  
  // Debounce/Throttle
  TIMING: {
    SEARCH_DEBOUNCE: 300,
    SCROLL_THROTTLE: 16, // ~60fps
    RESIZE_DEBOUNCE: 250,
    INPUT_DEBOUNCE: 500,
  } as const,
} as const;

export const FEATURE_FLAGS = {
  // Experimental Features
  EXPERIMENTAL: {
    AI_TUTOR: false,
    VOICE_RECOGNITION: true,
    OFFLINE_MODE: true,
    SOCIAL_FEATURES: false,
    GAMIFICATION_V2: false,
  } as const,
  
  // Platform Features
  PLATFORM_FEATURES: {
    PUSH_NOTIFICATIONS: true,
    BIOMETRIC_AUTH: true,
    CAMERA_INTEGRATION: true,
    SPEECH_TO_TEXT: true,
    TEXT_TO_SPEECH: true,
  } as const,
  
  // A/B Testing
  AB_TESTS: {
    NEW_ONBOARDING: 'control', // 'control' | 'variant_a' | 'variant_b'
    LESSON_UI: 'control',
    PRICING_PAGE: 'control',
  } as const,
} as const;

export const LIMITS = {
  // Content Limits
  CONTENT: {
    MAX_LESSON_DURATION: 30, // minutes
    MAX_VOCABULARY_ITEMS: 10000,
    MAX_CUSTOM_LISTS: 50,
    MAX_NOTES_LENGTH: 1000,
  } as const,
  
  // User Limits
  USER: {
    MAX_DAILY_LESSONS: 50,
    MAX_STREAK_FREEZE: 3,
    MAX_PROFILE_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_USERNAME_LENGTH: 30,
  } as const,
  
  // Free Tier Limits
  FREE_TIER: {
    MAX_LESSONS_PER_DAY: 5,
    MAX_VOCABULARY_ITEMS: 100,
    MAX_CUSTOM_LISTS: 3,
    OFFLINE_LESSONS: 0,
  } as const,
  
  // Premium Tier Limits
  PREMIUM_TIER: {
    MAX_LESSONS_PER_DAY: -1, // Unlimited
    MAX_VOCABULARY_ITEMS: -1, // Unlimited
    MAX_CUSTOM_LISTS: -1, // Unlimited
    OFFLINE_LESSONS: -1, // Unlimited
  } as const,
} as const;

export type Platform = typeof DEVICE_CONSTANTS.PLATFORM[keyof typeof DEVICE_CONSTANTS.PLATFORM];
export type HapticType = typeof DEVICE_CONSTANTS.HAPTIC_TYPES[keyof typeof DEVICE_CONSTANTS.HAPTIC_TYPES];
export type AccessibilityRole = typeof ACCESSIBILITY_CONSTANTS.ROLES[keyof typeof ACCESSIBILITY_CONSTANTS.ROLES];