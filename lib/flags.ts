/**
 * Feature Flags System
 * 
 * Provides type-safe feature flags for progressive rollout and experimentation.
 * Flags can be controlled remotely or via local storage for testing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DebugLogger } from './debugging';

// Define all feature flags with their types
export type FeatureFlags = {
  // Error handling & reliability
  error_handling_v1: boolean;
  enhanced_retry_logic: boolean;
  sentry_integration: boolean;
  
  // UI features
  offline_mode: boolean;
  dark_mode: boolean;
  animations_enabled: boolean;
  
  // Learning features
  ai_feedback: boolean;
  voice_recognition: boolean;
  gamification: boolean;
  
  // Performance
  lazy_loading: boolean;
  image_optimization: boolean;
  prefetch_lessons: boolean;
  
  // Experimental
  experimental_ui: boolean;
  beta_features: boolean;
};

// Default flag values
const DEFAULT_FLAGS: FeatureFlags = {
  // Error handling & reliability
  error_handling_v1: true,
  enhanced_retry_logic: true,
  sentry_integration: false, // Enable after Sentry DSN is configured
  
  // UI features
  offline_mode: true,
  dark_mode: true,
  animations_enabled: true,
  
  // Learning features
  ai_feedback: true,
  voice_recognition: true,
  gamification: true,
  
  // Performance
  lazy_loading: true,
  image_optimization: true,
  prefetch_lessons: false,
  
  // Experimental
  experimental_ui: false,
  beta_features: false,
};

// Storage key for flags
const FLAGS_STORAGE_KEY = 'feature_flags';

/**
 * Feature Flag Manager
 * 
 * Manages feature flags with local and remote capabilities.
 */
export class FeatureFlagManager {
  private static flags: FeatureFlags = { ...DEFAULT_FLAGS };
  private static isInitialized = false;
  private static listeners: Set<(flags: FeatureFlags) => void> = new Set();

  /**
   * Initialize the feature flag system
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load flags from storage
      await this.loadFlags();
      
      // Fetch remote flags (if available)
      await this.fetchRemoteFlags();
      
      this.isInitialized = true;
      await DebugLogger.info('FeatureFlags', 'Feature flags initialized', this.flags);
    } catch (error) {
      console.error('[FeatureFlags] Failed to initialize:', error);
      // Fall back to default flags
      this.flags = { ...DEFAULT_FLAGS };
    }
  }

  /**
   * Load flags from local storage
   */
  private static async loadFlags(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(FLAGS_STORAGE_KEY);
      if (stored) {
        const parsedFlags = JSON.parse(stored) as Partial<FeatureFlags>;
        this.flags = { ...DEFAULT_FLAGS, ...parsedFlags };
        await DebugLogger.debug('FeatureFlags', 'Flags loaded from storage', this.flags);
      }
    } catch (error) {
      console.error('[FeatureFlags] Failed to load flags from storage:', error);
    }
  }

  /**
   * Fetch flags from remote config service
   */
  private static async fetchRemoteFlags(): Promise<void> {
    try {
      // In production, fetch from your remote config service
      // For now, this is a placeholder
      await DebugLogger.debug('FeatureFlags', 'Remote flag fetch skipped (no remote config)');
      
      // Example: const remoteFlags = await configService.getFlags();
      // this.updateFlags(remoteFlags);
    } catch (error) {
      console.error('[FeatureFlags] Failed to fetch remote flags:', error);
    }
  }

  /**
   * Save flags to local storage
   */
  private static async saveFlags(): Promise<void> {
    try {
      await AsyncStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(this.flags));
      await DebugLogger.debug('FeatureFlags', 'Flags saved to storage');
    } catch (error) {
      console.error('[FeatureFlags] Failed to save flags:', error);
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  static isEnabled<K extends keyof FeatureFlags>(flag: K): boolean {
    return this.flags[flag] as boolean;
  }

  /**
   * Get the value of a feature flag
   */
  static getValue<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
    return this.flags[flag];
  }

  /**
   * Get all feature flags
   */
  static getAll(): Readonly<FeatureFlags> {
    return { ...this.flags };
  }

  /**
   * Update a single feature flag (for testing/debugging)
   */
  static async setFlag<K extends keyof FeatureFlags>(
    flag: K,
    value: FeatureFlags[K]
  ): Promise<void> {
    this.flags[flag] = value;
    await this.saveFlags();
    await DebugLogger.info('FeatureFlags', `Flag updated: ${flag} = ${value}`);
    this.notifyListeners();
  }

  /**
   * Update multiple feature flags
   */
  static async updateFlags(updates: Partial<FeatureFlags>): Promise<void> {
    this.flags = { ...this.flags, ...updates };
    await this.saveFlags();
    await DebugLogger.info('FeatureFlags', 'Flags updated', updates);
    this.notifyListeners();
  }

  /**
   * Reset flags to defaults
   */
  static async resetToDefaults(): Promise<void> {
    this.flags = { ...DEFAULT_FLAGS };
    await this.saveFlags();
    await DebugLogger.info('FeatureFlags', 'Flags reset to defaults');
    this.notifyListeners();
  }

  /**
   * Subscribe to flag changes
   */
  static subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of flag changes
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.flags);
      } catch (error) {
        console.error('[FeatureFlags] Listener error:', error);
      }
    });
  }

  /**
   * Get flag metadata for debugging
   */
  static getMetadata(): {
    isInitialized: boolean;
    flagCount: number;
    enabledCount: number;
    flags: Record<string, boolean>;
  } {
    const enabledCount = Object.values(this.flags).filter(Boolean).length;
    return {
      isInitialized: this.isInitialized,
      flagCount: Object.keys(this.flags).length,
      enabledCount,
      flags: { ...this.flags },
    };
  }
}

/**
 * React hook for using feature flags (to be used in React components)
 * 
 * Usage:
 * const isEnabled = useFeatureFlag('offline_mode');
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(
  flag: K
): boolean {
  // This is a simple implementation - in a real app you'd use useState/useEffect
  // to subscribe to flag changes
  return FeatureFlagManager.isEnabled(flag);
}

/**
 * Higher-order component for feature flagging
 * 
 * Usage:
 * const MyComponent = withFeatureFlag('experimental_ui', ExperimentalComponent, FallbackComponent);
 */
export function withFeatureFlag<P extends object>(
  flag: keyof FeatureFlags,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
): React.ComponentType<P> {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flag);
    if (isEnabled) {
      return React.createElement(Component, props);
    }
    return FallbackComponent
      ? React.createElement(FallbackComponent, props)
      : null;
  };
}

/**
 * Utility to conditionally execute code based on feature flag
 */
export function withFlag<T>(
  flag: keyof FeatureFlags,
  enabledFn: () => T,
  disabledFn?: () => T
): T | undefined {
  if (FeatureFlagManager.isEnabled(flag)) {
    return enabledFn();
  }
  return disabledFn ? disabledFn() : undefined;
}

// Initialize flags on module load
FeatureFlagManager.initialize().catch(err => {
  console.error('[FeatureFlags] Auto-initialization failed:', err);
});
