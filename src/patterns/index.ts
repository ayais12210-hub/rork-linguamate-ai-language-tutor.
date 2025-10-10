// Context Patterns
export { SettingsProvider, useSettings, useSetting } from './context/SettingsContext';
export { AudioEngineProvider, useAudioEngine, useAudioEngineInstance, useAudioConfig } from './context/AudioEngineContext';

// Memoization Patterns
export { useExpensiveCalc, useMemoizedCalculation, useDebouncedCalculation } from './memo/useExpensiveCalc';

// Code Splitting Patterns
export {
  LoadingView,
  withLoading,
  PronunciationLab,
  OfflinePackManager,
  AdvancedAnalytics,
  LanguagePackDownloader,
  SpeechRecognitionEngine,
  ComponentPreloader,
  useLazyComponent,
  useLazyRoute,
  useBackgroundPreloading,
  LazyScreenWrapper,
  LazyPronunciationLab,
  LazyOfflinePackManager,
  LazyAdvancedAnalytics,
  LazyLanguagePackDownloader,
  LazySpeechRecognitionEngine,
} from './lazy/lazyScreens';

// Render Props Patterns
export {
  Deferred,
  MouseTracker,
  InputTracker,
  IntersectionObserver,
  DebouncedValue,
  AsyncData,
} from './render-props/Deferred';

// Higher-Order Component Patterns
export {
  withAnalytics,
  withScreenTracking,
  withInteractionTracking,
  withAppStateTracking,
  useAnalyticsTracking,
  AnalyticsProvider,
  useAnalytics,
} from './hoc/withAnalytics';

export {
  withLogger,
  withDebugLogging,
  withErrorLogging,
  withPerformanceLogging,
  useComponentLogger,
  withDevLogger,
  LoggerProvider,
  useLogger,
  LogLevel,
} from './hoc/withLogger';

// Performance Patterns
export {
  withProfiler,
  usePerformanceMetrics,
  PerformanceDashboard,
  DevProfiler,
} from './performance/ReactProfiler';

// Audio Vendors
export {
  ElevenLabsAudioEngine,
  AWSAudioEngine,
  GoogleAudioEngine,
  createAudioEngine,
} from '../vendors/audio';

// Quiz Engine
export { QuizEngine } from '../features/quiz/QuizEngine';
export type { QuizQuestion, QuizResult, QuizStats } from '../features/quiz/QuizEngine';

// Re-export types
export type { Settings } from './context/SettingsContext';
export type { AudioConfig, AudioEngine } from './context/AudioEngineContext';
export type { PronunciationScore } from './memo/useExpensiveCalc';
export type { PerformanceMetrics } from './performance/ReactProfiler';