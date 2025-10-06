/**
 * Example usage of secure storage implementation
 * 
 * This file demonstrates how to use the new secure storage system
 * that replaces hardcoded encryption keys with runtime-generated keys.
 */

import { initializeAppStorage } from '../storage-init';
import { mmkvStorage, mmkvCache, createMMKVPersister, getSecureStorageStats } from '../mmkv-storage';

/**
 * Example: Basic storage operations
 */
export async function basicStorageExample() {
  // Initialize secure storage at app startup
  await initializeAppStorage();

  // Store and retrieve data (all operations are now async)
  await mmkvStorage.setString('user_name', 'John Doe');
  await mmkvStorage.setNumber('user_age', 30);
  await mmkvStorage.setBoolean('user_premium', true);
  
  const name = await mmkvStorage.getString('user_name');
  const age = await mmkvStorage.getNumber('user_age');
  const isPremium = await mmkvStorage.getBoolean('user_premium');
  
  console.log('User data:', { name, age, isPremium });
}

/**
 * Example: Object storage with JSON serialization
 */
export async function objectStorageExample() {
  await initializeAppStorage();
  
  const userProfile = {
    id: 'user123',
    name: 'Jane Smith',
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: true,
    },
    lastLogin: new Date().toISOString(),
  };
  
  // Store complex object
  await mmkvStorage.setObject('user_profile', userProfile);
  
  // Retrieve and use object
  const profile = await mmkvStorage.getObject<typeof userProfile>('user_profile');
  console.log('User profile:', profile);
}

/**
 * Example: Cache storage with TTL
 */
export async function cacheStorageExample() {
  await initializeAppStorage();
  
  // Store data with 5 minute TTL
  const ttl = 5 * 60 * 1000; // 5 minutes
  await mmkvCache.set('api_response', { data: 'cached data' }, ttl);
  
  // Retrieve cached data
  const cachedData = await mmkvCache.get('api_response');
  console.log('Cached data:', cachedData);
  
  // After TTL expires, data will be automatically removed
}

/**
 * Example: React Query persistence
 */
export async function reactQueryPersistenceExample() {
  await initializeAppStorage();
  
  const persister = createMMKVPersister();
  
  // Persist React Query cache
  const queryClient = { /* your query client */ };
  await persister.persistClient(queryClient);
  
  // Restore React Query cache
  const restoredClient = await persister.restoreClient();
  console.log('Restored query client:', restoredClient);
}

/**
 * Example: Storage statistics and debugging
 */
export async function storageDebuggingExample() {
  await initializeAppStorage();
  
  // Get storage statistics
  const stats = await getSecureStorageStats();
  console.log('Storage statistics:', {
    keyCount: stats.keyCount,
    keyTypes: stats.keyTypes,
    platform: stats.platform,
    lastMigration: stats.lastMigration ? new Date(stats.lastMigration).toISOString() : 'none',
  });
  
  // Get all storage keys
  const allKeys = await mmkvStorage.getAllKeys();
  console.log('All storage keys:', allKeys);
}

/**
 * Example: Error handling
 */
export async function errorHandlingExample() {
  try {
    await initializeAppStorage();
    
    // Storage operations will automatically initialize if needed
    await mmkvStorage.setString('test_key', 'test_value');
    const value = await mmkvStorage.getString('test_key');
    console.log('Retrieved value:', value);
    
  } catch (error) {
    console.error('Storage error:', error);
    
    // In development, the app will continue with fallback keys
    // In production, this would be a critical error
    if (__DEV__) {
      console.warn('Using development fallback keys - NOT SECURE!');
    }
  }
}

/**
 * Example: Migration from old storage
 */
export async function migrationExample() {
  // The system automatically migrates from hardcoded keys like:
  // 'linguamate-encryption-key-v1' -> 'secure-v2-{random-key}'
  
  await initializeAppStorage();
  
  // Check if migration occurred
  const stats = await getSecureStorageStats();
  if (stats.lastMigration) {
    console.log('Storage was migrated from insecure keys at:', new Date(stats.lastMigration).toISOString());
  } else {
    console.log('No migration needed - using secure keys from start');
  }
}

/**
 * Example: App initialization
 */
export async function appInitializationExample() {
  console.log('Initializing app with secure storage...');
  
  try {
    // Initialize secure storage first
    await initializeAppStorage();
    
    // Now safe to use any storage operations
    console.log('Secure storage initialized successfully');
    
    // Your app initialization continues here...
    
  } catch (error) {
    console.error('Failed to initialize secure storage:', error);
    
    // Handle initialization failure
    if (__DEV__) {
      console.warn('Continuing with development fallback keys');
    } else {
      // In production, this is critical
      throw new Error('App cannot start without secure storage');
    }
  }
}

// Export all examples for easy testing
export const examples = {
  basicStorageExample,
  objectStorageExample,
  cacheStorageExample,
  reactQueryPersistenceExample,
  storageDebuggingExample,
  errorHandlingExample,
  migrationExample,
  appInitializationExample,
};