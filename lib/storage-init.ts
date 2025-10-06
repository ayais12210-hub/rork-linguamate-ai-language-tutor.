/**
 * Storage Initialization Module
 * 
 * This module handles the initialization of secure storage at app startup.
 * It should be imported and called early in the app lifecycle to ensure
 * all storage operations use secure encryption keys.
 */

import { initializeSecureStorage } from './mmkv-storage';
import SecureKeyManager from './secure-key-manager';

let initializationPromise: Promise<void> | null = null;

/**
 * Initialize secure storage at app startup
 * This function is idempotent and can be called multiple times safely
 */
export async function initializeAppStorage(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('[Storage Init] Starting secure storage initialization...');
      
      // Initialize secure storage
      await initializeSecureStorage();
      
      // Log key statistics for debugging
      const stats = await SecureKeyManager.getKeyStats();
      console.log('[Storage Init] Secure storage initialized:', {
        keyCount: stats.keyCount,
        keyTypes: stats.keyTypes,
        platform: stats.platform,
        lastMigration: stats.lastMigration ? new Date(stats.lastMigration).toISOString() : 'none',
      });
      
      console.log('[Storage Init] Secure storage initialization completed successfully');
    } catch (error) {
      console.error('[Storage Init] Failed to initialize secure storage:', error);
      
      // In development, continue with warnings
      if (__DEV__ || process.env.NODE_ENV === 'development') {
        console.warn('[Storage Init] Continuing with development fallback keys');
      } else {
        // In production, this is a critical error
        throw new Error('Failed to initialize secure storage - app cannot continue');
      }
    }
  })();

  return initializationPromise;
}

/**
 * Check if storage has been initialized
 */
export function isStorageInitialized(): boolean {
  return initializationPromise !== null;
}

/**
 * Get initialization status
 */
export async function getStorageInitStatus(): Promise<{
  initialized: boolean;
  error?: string;
  stats?: any;
}> {
  try {
    if (!isStorageInitialized()) {
      return { initialized: false };
    }

    await initializationPromise;
    const stats = await SecureKeyManager.getKeyStats();
    
    return {
      initialized: true,
      stats,
    };
  } catch (error) {
    return {
      initialized: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default initializeAppStorage;