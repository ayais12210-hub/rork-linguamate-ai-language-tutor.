// Main exports for the lib directory

// Core utilities
export {
  textUtils,
  dateUtils,
  numberUtils,
  arrayUtils,
  platformUtils,
  debounce,
  throttle,
  deepClone,
  generateId,
  sleep,
  handleError,
} from './utils';

export {
  Validator,
  userValidation,
  learningValidation,
  chatValidation,
  settingsValidation,
  fileValidation,
  validationUtils as validationHelpers,
} from './validation';

export {
  STORAGE_KEYS,
  storage,
  storageHelpers,
} from './storage';

export {
  API_ENDPOINTS,
  ApiClient,
  apiClient,
  apiHelpers,
  handleApiError,
} from './api';

export {
  WebAudioRecorder,
  audioFormats,
  audioQualityPresets,
  audioValidation,
  audioProcessing,
  audioPermissions,
  webAudioRecorder,
} from './audio';

// Configuration and constants
export {
  APP_CONFIG,
  SUPPORTED_LANGUAGES,
  DIFFICULTY_LEVELS,
  LEARNING_MODULES,
  SUBSCRIPTION_TIERS,
  ACHIEVEMENT_TYPES,
  NOTIFICATION_TYPES,
  TIME_CONSTANTS,
  API_LIMITS,
  STORAGE_LIMITS,
  UI_CONSTANTS,
  COLORS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants';

export {
  theme,
  darkTheme,
  themeUtils,
  typography,
} from './theme';

// tRPC client
export { trpc, trpcClient } from './trpc';

// Re-export commonly used items with aliases for convenience
export { theme as defaultTheme } from './theme';
export { apiClient as api } from './api';
export { storageHelpers as storageUtils } from './storage';

// Type exports
export type {
  ValidationResult,
  ValidationRule,
  ValidationSchema,
} from './validation';

export type {
  Theme,
  FontConfig,
  LayoutConfig,
  ComponentStyles,
  ButtonStyles,
  InputStyles,
  CardStyles,
  ModalStyles,
  ToastStyles,
} from './theme';

export type {
  LanguageCode,
  DifficultyLevel,
  ModuleType,
  SubscriptionTier,
} from './constants';

export type {
  LLMRequest,
  LLMResponse,
  ImageGenerateRequest,
  ImageGenerateResponse,
  ImageEditRequest,
  ImageEditResponse,
  STTRequest,
  STTResponse,
  CoreMessage,
  ContentPart,
} from './api';

export type {
  AudioConfig,
  RecordingOptions,
  PlaybackOptions,
  RecordingState,
  PlaybackState,
} from './audio';

export type {
  StorageAdapter,
} from './storage';