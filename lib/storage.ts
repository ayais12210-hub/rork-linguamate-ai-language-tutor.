import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
export const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  LEARNING_PROGRESS: 'learning_progress',
  VOCABULARY: 'vocabulary',
  SETTINGS: 'settings',
  OFFLINE_LESSONS: 'offline_lessons',
  OFFLINE_QUEUE: 'offline_queue',
  CHAT_HISTORY: 'chat_history',
  NOTIFICATIONS: 'notifications',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LANGUAGE_PREFERENCES: 'language_preferences',
  GAMIFICATION_DATA: 'gamification_data',
  JOURNAL: 'journal_entries',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Generic storage interface
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// AsyncStorage adapter for React Native
class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
      throw new Error(`Failed to set item '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
      throw new Error(`Failed to remove item '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Web localStorage adapter
class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage getItem error:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage setItem error:', error);
      throw new Error(`Failed to set item '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage removeItem error:', error);
      throw new Error(`Failed to remove item '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('localStorage clear error:', error);
      throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Platform-specific storage adapter
export const storage: StorageAdapter = Platform.select({
  web: new LocalStorageAdapter(),
  default: new AsyncStorageAdapter(),
});

// Typed storage helpers
export const storageHelpers = {
  async getObject<T>(key: StorageKey): Promise<T | null> {
    try {
      const item = await storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting object from storage (${key}):`, error);
      return null;
    }
  },

  async setObject<T>(key: StorageKey, value: T): Promise<void> {
    try {
      await storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting object to storage (${key}):`, error);
      throw error;
    }
  },

  async getString(key: StorageKey): Promise<string | null> {
    try {
      return await storage.getItem(key);
    } catch (error) {
      console.error(`Error getting string from storage (${key}):`, error);
      return null;
    }
  },

  async setString(key: StorageKey, value: string): Promise<void> {
    try {
      await storage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting string to storage (${key}):`, error);
      throw error;
    }
  },

  async remove(key: StorageKey): Promise<void> {
    try {
      await storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      throw error;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },
};