// Feature flags system for safe feature rollouts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './log';

export interface FeatureFlag {
  key: string;
  defaultValue: boolean;
  description: string;
  rolloutPercentage?: number;
  enabledForUsers?: string[];
  disabledForUsers?: string[];
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  userId?: string;
  environmentOverrides?: Record<string, boolean>;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private overrides: Map<string, boolean> = new Map();
  private userId?: string;
  private storageKey = 'feature_flags_overrides';
  private initialized = false;

  async initialize(config: FeatureFlagConfig) {
    try {
      // Set flags
      Object.entries(config.flags).forEach(([key, flag]) => {
        this.flags.set(key, { ...flag, key });
      });

      // Set user ID
      this.userId = config.userId;

      // Apply environment overrides
      if (config.environmentOverrides) {
        Object.entries(config.environmentOverrides).forEach(([key, value]) => {
          this.overrides.set(key, value);
        });
      }

      // Load local overrides from storage
      await this.loadLocalOverrides();

      this.initialized = true;
      
      logger.info('FeatureFlags', 'Feature flags initialized', {
        flagCount: this.flags.size,
        userId: this.userId,
      });
    } catch (error) {
      logger.error('FeatureFlags', 'Failed to initialize feature flags', {}, error as Error);
    }
  }

  private async loadLocalOverrides() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const overrides = JSON.parse(stored);
        Object.entries(overrides).forEach(([key, value]) => {
          this.overrides.set(key, value as boolean);
        });
      }
    } catch (error) {
      logger.error('FeatureFlags', 'Failed to load local overrides', {}, error as Error);
    }
  }

  private async saveLocalOverrides() {
    try {
      const overrides: Record<string, boolean> = {};
      this.overrides.forEach((value, key) => {
        overrides[key] = value;
      });
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(overrides));
    } catch (error) {
      logger.error('FeatureFlags', 'Failed to save local overrides', {}, error as Error);
    }
  }

  isEnabled(flagKey: string): boolean {
    if (!this.initialized) {
      logger.warn('FeatureFlags', 'Checking flag before initialization', { flagKey });
      return false;
    }

    // Check for override first
    if (this.overrides.has(flagKey)) {
      return this.overrides.get(flagKey)!;
    }

    const flag = this.flags.get(flagKey);
    if (!flag) {
      logger.warn('FeatureFlags', 'Unknown feature flag', { flagKey });
      return false;
    }

    // Check user-specific rules
    if (this.userId) {
      if (flag.enabledForUsers?.includes(this.userId)) {
        return true;
      }
      if (flag.disabledForUsers?.includes(this.userId)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(this.userId || 'anonymous', flagKey);
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rolloutPercentage;
    }

    return flag.defaultValue;
  }

  private hashUserId(userId: string, flagKey: string): number {
    const str = `${userId}:${flagKey}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async setOverride(flagKey: string, enabled: boolean) {
    this.overrides.set(flagKey, enabled);
    await this.saveLocalOverrides();
    
    logger.info('FeatureFlags', 'Feature flag override set', {
      flagKey,
      enabled,
    });
  }

  async clearOverride(flagKey: string) {
    this.overrides.delete(flagKey);
    await this.saveLocalOverrides();
    
    logger.info('FeatureFlags', 'Feature flag override cleared', { flagKey });
  }

  async clearAllOverrides() {
    this.overrides.clear();
    await AsyncStorage.removeItem(this.storageKey);
    
    logger.info('FeatureFlags', 'All feature flag overrides cleared');
  }

  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    
    this.flags.forEach((flag) => {
      result[flag.key] = this.isEnabled(flag.key);
    });
    
    return result;
  }

  getFlagDetails(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  updateUserId(userId: string | undefined) {
    this.userId = userId;
    logger.info('FeatureFlags', 'User ID updated', { userId });
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = useState(() => featureFlags.isEnabled(flagKey));

  useEffect(() => {
    // Check for updates periodically
    const interval = setInterval(() => {
      const newValue = featureFlags.isEnabled(flagKey);
      setEnabled(newValue);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [flagKey]);

  return enabled;
}

// Higher-order component for feature flags
import React from 'react';

export function withFeatureFlag<P extends object>(
  flagKey: string,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(Component: React.ComponentType<P>) {
    return function WrappedComponent(props: P) {
      const enabled = useFeatureFlag(flagKey);

      if (!enabled && FallbackComponent) {
        return <FallbackComponent {...props} />;
      }

      if (!enabled) {
        return null;
      }

      return <Component {...props} />;
    };
  };
}

// Default feature flags configuration
export const defaultFeatureFlags: Record<string, FeatureFlag> = {
  error_handling_v1: {
    key: 'error_handling_v1',
    defaultValue: true,
    description: 'Enhanced error handling with retry and recovery',
  },
  network_retry: {
    key: 'network_retry',
    defaultValue: true,
    description: 'Automatic network request retry with exponential backoff',
  },
  offline_mode: {
    key: 'offline_mode',
    defaultValue: true,
    description: 'Enable offline mode with request queuing',
  },
  debug_mode: {
    key: 'debug_mode',
    defaultValue: __DEV__,
    description: 'Show debug information and error details',
  },
  performance_monitoring: {
    key: 'performance_monitoring',
    defaultValue: true,
    description: 'Track performance metrics and send to analytics',
    rolloutPercentage: 50, // 50% rollout
  },
  sentry_reporting: {
    key: 'sentry_reporting',
    defaultValue: !__DEV__,
    description: 'Send error reports to Sentry in production',
  },
  enhanced_logging: {
    key: 'enhanced_logging',
    defaultValue: true,
    description: 'Use enhanced logging with structured data',
  },
  error_recovery: {
    key: 'error_recovery',
    defaultValue: true,
    description: 'Automatic error recovery strategies',
    rolloutPercentage: 75, // 75% rollout
  },
};