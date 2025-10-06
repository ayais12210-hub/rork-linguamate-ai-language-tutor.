import { MMKV } from 'react-native-mmkv';
import SecureKeyManager from './secure-key-manager';

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
 * 
 * Security: Uses runtime-generated encryption keys stored in platform secure storage
 * - iOS: Keychain Services
 * - Android: Android Keystore
 * - Web: Secure environment variables (development only)
 */

// Initialize secure key management
let isInitialized = false;

/**
 * Initialize MMKV storage with secure encryption keys
 * Must be called before using any storage instances
 */
export async function initializeSecureStorage(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    console.log('[MMKV Storage] Initializing secure storage...');
    
    // Initialize secure key management
    await SecureKeyManager.initialize();
    
    // Create MMKV instances with secure keys
    const [defaultKey, cacheKey, secureKey] = await Promise.all([
      SecureKeyManager.getEncryptionKey('default'),
      SecureKeyManager.getEncryptionKey('cache'),
      SecureKeyManager.getEncryptionKey('secure'),
    ]);

    // Create storage instances with secure keys
    storage.setEncryptionKey(defaultKey);
    cacheStorage.setEncryptionKey(cacheKey);
    secureStorage.setEncryptionKey(secureKey);

    isInitialized = true;
    console.log('[MMKV Storage] Secure storage initialized successfully');
  } catch (error) {
    console.error('[MMKV Storage] Failed to initialize secure storage:', error);
    
    // In development, provide fallback with clear warnings
    if (__DEV__ || process.env.NODE_ENV === 'development') {
      console.warn('[MMKV Storage] Using development fallback keys - NOT SECURE!');
      console.warn('[MMKV Storage] These keys should never be used in production!');
      
      // Use development fallback keys
      storage.setEncryptionKey('dev-fallback-default-key');
      cacheStorage.setEncryptionKey('dev-fallback-cache-key');
      secureStorage.setEncryptionKey('dev-fallback-secure-key');
      
      isInitialized = true;
    } else {
      throw new Error('Failed to initialize secure storage');
    }
  }
}

// Create MMKV instances with placeholder keys (will be updated by initializeSecureStorage)
export const storage = new MMKV({
  id: 'linguamate-default',
  encryptionKey: 'placeholder-key-will-be-replaced',
});

export const cacheStorage = new MMKV({
  id: 'linguamate-cache',
  encryptionKey: 'placeholder-key-will-be-replaced',
});

export const secureStorage = new MMKV({
  id: 'linguamate-secure',
  encryptionKey: 'placeholder-key-will-be-replaced',
});

/**
 * Ensure storage is initialized before use
 */
async function ensureInitialized(): Promise<void> {
  if (!isInitialized) {
    await initializeSecureStorage();
  }
}

/**
 * Type-safe storage helpers
 */
export const mmkvStorage = {
  // String operations
  setString: async (key: string, value: string) => {
    await ensureInitialized();
    storage.set(key, value);
  },
  
  getString: async (key: string): Promise<string | undefined> => {
    await ensureInitialized();
    return storage.getString(key);
  },

  // Number operations
  setNumber: async (key: string, value: number) => {
    await ensureInitialized();
    storage.set(key, value);
  },
  
  getNumber: async (key: string): Promise<number | undefined> => {
    await ensureInitialized();
    return storage.getNumber(key);
  },

  // Boolean operations
  setBoolean: async (key: string, value: boolean) => {
    await ensureInitialized();
    storage.set(key, value);
  },
  
  getBoolean: async (key: string): Promise<boolean | undefined> => {
    await ensureInitialized();
    return storage.getBoolean(key);
  },

  // Object operations (JSON)
  setObject: async <T>(key: string, value: T) => {
    await ensureInitialized();
    storage.set(key, JSON.stringify(value));
  },
  
  getObject: async <T>(key: string): Promise<T | undefined> => {
    await ensureInitialized();
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
  delete: async (key: string) => {
    await ensureInitialized();
    storage.delete(key);
  },

  // Check if key exists
  contains: async (key: string): Promise<boolean> => {
    await ensureInitialized();
    return storage.contains(key);
  },

  // Get all keys
  getAllKeys: async (): Promise<string[]> => {
    await ensureInitialized();
    return storage.getAllKeys();
  },

  // Clear all data
  clearAll: async () => {
    await ensureInitialized();
    storage.clearAll();
  },
};

/**
 * Cache-specific storage helpers
 */
export const mmkvCache = {
  set: async <T>(key: string, value: T, ttl?: number) => {
    await ensureInitialized();
    const data = {
      value,
      expiresAt: ttl ? Date.now() + ttl : null,
    };
    cacheStorage.set(key, JSON.stringify(data));
  },

  get: async <T>(key: string): Promise<T | undefined> => {
    await ensureInitialized();
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

  delete: async (key: string) => {
    await ensureInitialized();
    cacheStorage.delete(key);
  },

  clear: async () => {
    await ensureInitialized();
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
      await ensureInitialized();
      cacheStorage.set('react-query-cache', JSON.stringify(client));
    },
    restoreClient: async () => {
      await ensureInitialized();
      const cache = cacheStorage.getString('react-query-cache');
      return cache ? JSON.parse(cache) : undefined;
    },
    removeClient: async () => {
      await ensureInitialized();
      cacheStorage.delete('react-query-cache');
    },
  };
};

/**
 * Get secure storage statistics for debugging
 */
export async function getSecureStorageStats() {
  return await SecureKeyManager.getKeyStats();
}

/**
 * Clear all secure keys (for testing or reset)
 */
export async function clearSecureKeys() {
  return await SecureKeyManager.clearAllKeys();
}

export default storage;
