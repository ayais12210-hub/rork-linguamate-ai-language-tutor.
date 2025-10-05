// Feature flag system for safe rollout of error-prone features
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from './log';

// Define feature flags with TypeScript safety
export interface FeatureFlags {
  error_handling_v1: boolean;
  enhanced_retry_logic: boolean;
  sentry_integration: boolean;
  offline_queue_v2: boolean;
  network_diagnostics: boolean;
  auto_error_recovery: boolean;
  debug_error_overlay: boolean;
  error_analytics: boolean;
  circuit_breaker: boolean;
  request_deduplication: boolean;
}

// Default flag values
const DEFAULT_FLAGS: FeatureFlags = {
  error_handling_v1: true,
  enhanced_retry_logic: true,
  sentry_integration: false, // Will be enabled after setup
  offline_queue_v2: false,
  network_diagnostics: __DEV__,
  auto_error_recovery: true,
  debug_error_overlay: __DEV__,
  error_analytics: true,
  circuit_breaker: false,
  request_deduplication: false,
};

// Environment-based overrides
const ENV_OVERRIDES: Partial<FeatureFlags> = {
  // Production overrides
  ...(process.env.NODE_ENV === 'production' && {
    debug_error_overlay: false,
    network_diagnostics: false,
  }),
  
  // Development overrides
  ...(process.env.NODE_ENV === 'development' && {
    sentry_integration: false,
  }),
};

class FeatureFlagManager {
  private flags: FeatureFlags = { ...DEFAULT_FLAGS };
  private remoteFlags: Partial<FeatureFlags> = {};
  private initialized = false;
  private logger = log.scope('FeatureFlags');

  constructor() {
    // Apply environment overrides
    this.flags = { ...this.flags, ...ENV_OVERRIDES };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load stored flags
      await this.loadStoredFlags();
      
      // Load remote flags (if available)
      await this.loadRemoteFlags();
      
      this.initialized = true;
      this.logger.info('Feature flags initialized', { flags: this.flags });
    } catch (error) {
      this.logger.error('Failed to initialize feature flags', error);
      // Continue with defaults
      this.initialized = true;
    }
  }

  private async loadStoredFlags(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('feature_flags');
      if (stored) {
        const storedFlags = JSON.parse(stored) as Partial<FeatureFlags>;
        this.flags = { ...this.flags, ...storedFlags };
        this.logger.debug('Loaded stored flags', storedFlags);
      }
    } catch (error) {
      this.logger.warn('Failed to load stored flags', error);
    }
  }

  private async loadRemoteFlags(): Promise<void> {
    try {
      // TODO: Implement remote flag fetching
      // This would typically fetch from your backend or feature flag service
      // For now, we'll use a placeholder
      
      const remoteFlags = await this.fetchRemoteFlags();
      if (remoteFlags) {
        this.remoteFlags = remoteFlags;
        this.flags = { ...this.flags, ...remoteFlags };
        this.logger.debug('Loaded remote flags', remoteFlags);
        
        // Store remote flags locally for offline use
        await this.storeFlags(remoteFlags);
      }
    } catch (error) {
      this.logger.warn('Failed to load remote flags', error);
    }
  }

  private async fetchRemoteFlags(): Promise<Partial<FeatureFlags> | null> {
    // Placeholder for remote flag fetching
    // In a real implementation, this would make an API call
    return null;
  }

  private async storeFlags(flags: Partial<FeatureFlags>): Promise<void> {
    try {
      await AsyncStorage.setItem('feature_flags', JSON.stringify(flags));
    } catch (error) {
      this.logger.warn('Failed to store flags', error);
    }
  }

  // Get flag value with type safety
  isEnabled<K extends keyof FeatureFlags>(flag: K): boolean {
    if (!this.initialized) {
      this.logger.warn(`Flag ${flag} checked before initialization`);
      return DEFAULT_FLAGS[flag];
    }
    
    const value = this.flags[flag];
    this.logger.debug(`Flag ${flag} checked`, { value });
    return value;
  }

  // Set flag value (for testing/debugging)
  async setFlag<K extends keyof FeatureFlags>(
    flag: K,
    value: boolean,
    persist = false
  ): Promise<void> {
    this.flags[flag] = value;
    this.logger.info(`Flag ${flag} set to ${value}`, { persist });
    
    if (persist) {
      try {
        const stored = await AsyncStorage.getItem('feature_flags');
        const storedFlags = stored ? JSON.parse(stored) : {};
        storedFlags[flag] = value;
        await AsyncStorage.setItem('feature_flags', JSON.stringify(storedFlags));
      } catch (error) {
        this.logger.error(`Failed to persist flag ${flag}`, error);
      }
    }
  }

  // Get all flags (for debugging)
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  // Reset to defaults
  async resetFlags(): Promise<void> {
    this.flags = { ...DEFAULT_FLAGS, ...ENV_OVERRIDES };
    this.remoteFlags = {};
    
    try {
      await AsyncStorage.removeItem('feature_flags');
      this.logger.info('Flags reset to defaults');
    } catch (error) {
      this.logger.error('Failed to reset flags', error);
    }
  }

  // Refresh remote flags
  async refreshFlags(): Promise<void> {
    try {
      await this.loadRemoteFlags();
      this.logger.info('Flags refreshed from remote');
    } catch (error) {
      this.logger.error('Failed to refresh flags', error);
    }
  }

  // Flag change listener
  onFlagChange<K extends keyof FeatureFlags>(
    flag: K,
    callback: (value: boolean) => void
  ): () => void {
    // Simple implementation - in production you might want a more sophisticated event system
    const interval = setInterval(() => {
      const currentValue = this.flags[flag];
      callback(currentValue);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }

  // Conditional execution based on flags
  async withFlag<T, K extends keyof FeatureFlags>(
    flag: K,
    enabledFn: () => T | Promise<T>,
    disabledFn?: () => T | Promise<T>
  ): Promise<T | undefined> {
    if (this.isEnabled(flag)) {
      this.logger.debug(`Executing with flag ${flag} enabled`);
      return await enabledFn();
    } else if (disabledFn) {
      this.logger.debug(`Executing with flag ${flag} disabled`);
      return await disabledFn();
    } else {
      this.logger.debug(`Skipping execution, flag ${flag} disabled`);
      return undefined;
    }
  }

  // Gradual rollout support
  isEnabledForUser(flag: keyof FeatureFlags, userId: string, rolloutPercentage = 100): boolean {
    if (!this.isEnabled(flag)) return false;
    
    if (rolloutPercentage >= 100) return true;
    
    // Simple hash-based rollout
    const hash = this.hashUserId(userId);
    const userPercentage = hash % 100;
    const enabled = userPercentage < rolloutPercentage;
    
    this.logger.debug(`Flag ${flag} rollout check`, {
      userId,
      rolloutPercentage,
      userPercentage,
      enabled,
    });
    
    return enabled;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // A/B testing support
  getVariant<T>(
    flag: keyof FeatureFlags,
    variants: Record<string, T>,
    userId: string
  ): T {
    if (!this.isEnabled(flag)) {
      return variants.control || Object.values(variants)[0];
    }
    
    const variantKeys = Object.keys(variants);
    const hash = this.hashUserId(userId + flag);
    const variantIndex = hash % variantKeys.length;
    const selectedVariant = variantKeys[variantIndex];
    
    this.logger.debug(`Variant selected for flag ${flag}`, {
      userId,
      selectedVariant,
      availableVariants: variantKeys,
    });
    
    return variants[selectedVariant];
  }
}

// Create singleton instance
export const featureFlags = new FeatureFlagManager();

// Convenience functions
export const isEnabled = (flag: keyof FeatureFlags): boolean => {
  return featureFlags.isEnabled(flag);
};

export const withFlag = async <T>(
  flag: keyof FeatureFlags,
  enabledFn: () => T | Promise<T>,
  disabledFn?: () => T | Promise<T>
): Promise<T | undefined> => {
  return featureFlags.withFlag(flag, enabledFn, disabledFn);
};

export const isEnabledForUser = (
  flag: keyof FeatureFlags,
  userId: string,
  rolloutPercentage?: number
): boolean => {
  return featureFlags.isEnabledForUser(flag, userId, rolloutPercentage);
};

// React hook for feature flags (if using React)
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  // This would be implemented as a proper React hook in a real app
  // For now, just return the flag value
  return featureFlags.isEnabled(flag);
};

// Initialize flags on module load
featureFlags.initialize().catch((error) => {
  console.warn('[FeatureFlags] Failed to initialize:', error);
});

export default featureFlags;