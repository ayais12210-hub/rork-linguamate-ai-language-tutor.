import { MMKV } from 'react-native-mmkv';

/**
 * MMKV Storage Configuration
 * 
 * Ultra-fast, encrypted key-value storage for:
 * - User preferences
 * - Session data
 * - Query cache persistence
 * - Offline data
 * 
 * Up to 30x faster than AsyncStorage
 */

// Create MMKV instances for different purposes
export const storage = new MMKV({
  id: 'linguamate-default',
  encryptionKey: 'linguamate-encryption-key-v1', // TODO: Use secure key from keychain
});

export const cacheStorage = new MMKV({
  id: 'linguamate-cache',
  encryptionKey: 'linguamate-cache-key-v1',
});

export const secureStorage = new MMKV({
  id: 'linguamate-secure',
  encryptionKey: 'linguamate-secure-key-v1', // TODO: Use secure key from keychain
});

/**
 * Type-safe storage helpers
 */
export const mmkvStorage = {
  // String operations
  setString: (key: string, value: string) => {
    storage.set(key, value);
  },
  
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  // Number operations
  setNumber: (key: string, value: number) => {
    storage.set(key, value);
  },
  
  getNumber: (key: string): number | undefined => {
    return storage.getNumber(key);
  },

  // Boolean operations
  setBoolean: (key: string, value: boolean) => {
    storage.set(key, value);
  },
  
  getBoolean: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },

  // Object operations (JSON)
  setObject: <T>(key: string, value: T) => {
    storage.set(key, JSON.stringify(value));
  },
  
  getObject: <T>(key: string): T | undefined => {
    const value = storage.getString(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch (error) {
        console.error('[MMKV] Failed to parse JSON:', error);
        return undefined;
      }
    }
    return undefined;
  },

  // Delete operations
  delete: (key: string) => {
    storage.delete(key);
  },

  // Check if key exists
  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  // Get all keys
  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },

  // Clear all data
  clearAll: () => {
    storage.clearAll();
  },
};

/**
 * Cache-specific storage helpers
 */
export const mmkvCache = {
  set: <T>(key: string, value: T, ttl?: number) => {
    const data = {
      value,
      expiresAt: ttl ? Date.now() + ttl : null,
    };
    cacheStorage.set(key, JSON.stringify(data));
  },

  get: <T>(key: string): T | undefined => {
    const raw = cacheStorage.getString(key);
    if (!raw) return undefined;

    try {
      const data = JSON.parse(raw);
      
      // Check if expired
      if (data.expiresAt && data.expiresAt < Date.now()) {
        cacheStorage.delete(key);
        return undefined;
      }

      return data.value as T;
    } catch (error) {
      console.error('[MMKV Cache] Failed to parse:', error);
      return undefined;
    }
  },

  delete: (key: string) => {
    cacheStorage.delete(key);
  },

  clear: () => {
    cacheStorage.clearAll();
  },
};

/**
 * React Query MMKV persister
 * For offline-first data caching
 */
export const createMMKVPersister = () => {
  return {
    persistClient: async (client: any) => {
      cacheStorage.set('react-query-cache', JSON.stringify(client));
    },
    restoreClient: async () => {
      const cache = cacheStorage.getString('react-query-cache');
      return cache ? JSON.parse(cache) : undefined;
    },
    removeClient: async () => {
      cacheStorage.delete('react-query-cache');
    },
  };
};

export default storage;
