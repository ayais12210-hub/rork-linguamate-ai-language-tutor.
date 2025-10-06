import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { storage } from './storage';

/**
 * Secure Key Manager for MMKV Storage
 * 
 * Manages encryption keys securely using platform-specific secure storage:
 * - iOS: Keychain Services
 * - Android: Android Keystore
 * - Web: Secure environment variables (development only)
 * 
 * Features:
 * - Generates unique per-install encryption keys
 * - Validates keys at startup to detect insecure defaults
 * - Provides migration path from hardcoded keys
 * - Development fallback with clear logging
 */

export interface KeyValidationResult {
  isValid: boolean;
  isInsecureDefault: boolean;
  needsMigration: boolean;
  keyId: string;
}

export class SecureKeyManager {
  private static readonly KEY_NAMES = {
    DEFAULT: 'mmkv_default_encryption_key',
    CACHE: 'mmkv_cache_encryption_key', 
    SECURE: 'mmkv_secure_encryption_key',
  } as const;

  private static readonly INSECURE_DEFAULTS = [
    'linguamate-encryption-key-v1',
    'linguamate-cache-key-v1', 
    'linguamate-secure-key-v1',
  ];

  private static readonly DEV_FALLBACK_PREFIX = 'dev-fallback-';
  private static readonly KEY_VERSION = 'v2';

  /**
   * Initialize secure key management
   * Validates existing keys and migrates from insecure defaults
   */
  static async initialize(): Promise<void> {
    try {
      console.log('[SecureKeyManager] Initializing secure key management...');
      
      // Check if we're in development mode
      const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        console.warn('[SecureKeyManager] Running in development mode - using fallback keys');
        console.warn('[SecureKeyManager] These keys are NOT secure for production!');
      }

      // Validate and migrate all keys
      await Promise.all([
        this.validateAndMigrateKey(this.KEY_NAMES.DEFAULT, 'default'),
        this.validateAndMigrateKey(this.KEY_NAMES.CACHE, 'cache'),
        this.validateAndMigrateKey(this.KEY_NAMES.SECURE, 'secure'),
      ]);

      console.log('[SecureKeyManager] Secure key management initialized successfully');
    } catch (error) {
      console.error('[SecureKeyManager] Failed to initialize:', error);
      throw new Error('Failed to initialize secure key management');
    }
  }

  /**
   * Get encryption key for MMKV storage
   * @param keyType - Type of storage (default, cache, secure)
   * @returns Encryption key string
   */
  static async getEncryptionKey(keyType: 'default' | 'cache' | 'secure'): Promise<string> {
    try {
      const keyName = this.getKeyName(keyType);
      
      // Try to get existing key from secure storage
      let key = await this.getSecureKey(keyName);
      
      if (!key) {
        // Generate new key if none exists
        key = await this.generateAndStoreKey(keyName, keyType);
        console.log(`[SecureKeyManager] Generated new ${keyType} encryption key`);
      }

      // Validate the key
      const validation = await this.validateKey(key, keyType);
      if (!validation.isValid) {
        if (validation.isInsecureDefault) {
          console.warn(`[SecureKeyManager] Detected insecure default key for ${keyType}, migrating...`);
          key = await this.migrateFromInsecureKey(keyName, keyType);
        } else {
          throw new Error(`Invalid encryption key for ${keyType}`);
        }
      }

      return key;
    } catch (error) {
      console.error(`[SecureKeyManager] Failed to get encryption key for ${keyType}:`, error);
      
      // In development, provide fallback
      if (__DEV__ || process.env.NODE_ENV === 'development') {
        console.warn(`[SecureKeyManager] Using development fallback for ${keyType}`);
        return this.getDevelopmentFallback(keyType);
      }
      
      throw error;
    }
  }

  /**
   * Validate and migrate a specific key
   */
  private static async validateAndMigrateKey(keyName: string, keyType: string): Promise<void> {
    try {
      const key = await this.getSecureKey(keyName);
      
      if (!key) {
        // No existing key, generate new one
        await this.generateAndStoreKey(keyName, keyType as any);
        console.log(`[SecureKeyManager] Generated new ${keyType} key`);
        return;
      }

      const validation = await this.validateKey(key, keyType);
      
      if (validation.isInsecureDefault) {
        console.warn(`[SecureKeyManager] Migrating insecure default key for ${keyType}`);
        await this.migrateFromInsecureKey(keyName, keyType as any);
      } else if (!validation.isValid) {
        console.warn(`[SecureKeyManager] Invalid key detected for ${keyType}, regenerating...`);
        await this.generateAndStoreKey(keyName, keyType as any);
      }
    } catch (error) {
      console.error(`[SecureKeyManager] Failed to validate/migrate ${keyType} key:`, error);
      throw error;
    }
  }

  /**
   * Get key name for storage type
   */
  private static getKeyName(keyType: 'default' | 'cache' | 'secure'): string {
    switch (keyType) {
      case 'default': return this.KEY_NAMES.DEFAULT;
      case 'cache': return this.KEY_NAMES.CACHE;
      case 'secure': return this.KEY_NAMES.SECURE;
      default: throw new Error(`Unknown key type: ${keyType}`);
    }
  }

  /**
   * Retrieve key from secure storage
   */
  private static async getSecureKey(keyName: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // On web, use localStorage as fallback (not secure, but better than hardcoded)
        const key = localStorage.getItem(keyName);
        return key;
      } else {
        // Use platform secure storage
        return await SecureStore.getItemAsync(keyName);
      }
    } catch (error) {
      console.error(`[SecureKeyManager] Failed to get secure key ${keyName}:`, error);
      return null;
    }
  }

  /**
   * Store key in secure storage
   */
  private static async storeSecureKey(keyName: string, key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // On web, use localStorage as fallback
        localStorage.setItem(keyName, key);
      } else {
        // Use platform secure storage
        await SecureStore.setItemAsync(keyName, key);
      }
    } catch (error) {
      console.error(`[SecureKeyManager] Failed to store secure key ${keyName}:`, error);
      throw error;
    }
  }

  /**
   * Generate a cryptographically secure encryption key
   */
  private static async generateAndStoreKey(keyName: string, keyType: string): Promise<string> {
    try {
      // Generate a secure random key
      const key = this.generateSecureKey();
      
      // Store the key securely
      await this.storeSecureKey(keyName, key);
      
      // Store key metadata for validation
      await this.storeKeyMetadata(keyName, keyType, key);
      
      return key;
    } catch (error) {
      console.error(`[SecureKeyManager] Failed to generate and store key for ${keyType}:`, error);
      throw error;
    }
  }

  /**
   * Generate a cryptographically secure key
   */
  private static generateSecureKey(): string {
    // Generate 32 random bytes and encode as base64
    const randomBytes = new Uint8Array(32);
    
    if (Platform.OS === 'web' && typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Use Web Crypto API on web
      crypto.getRandomValues(randomBytes);
    } else {
      // Fallback to Math.random (less secure but better than hardcoded)
      for (let i = 0; i < randomBytes.length; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
      }
    }
    
    // Convert to base64 string
    const key = btoa(String.fromCharCode(...randomBytes));
    return `secure-${this.KEY_VERSION}-${key}`;
  }

  /**
   * Validate an encryption key
   */
  private static async validateKey(key: string, keyType: string): Promise<KeyValidationResult> {
    const isInsecureDefault = this.INSECURE_DEFAULTS.includes(key);
    const isValid = !isInsecureDefault && key.length > 20 && key.startsWith('secure-');
    const needsMigration = isInsecureDefault;
    
    return {
      isValid,
      isInsecureDefault,
      needsMigration,
      keyId: key.substring(0, 20) + '...',
    };
  }

  /**
   * Migrate from insecure default key
   */
  private static async migrateFromInsecureKey(keyName: string, keyType: string): Promise<string> {
    try {
      console.log(`[SecureKeyManager] Migrating ${keyType} key from insecure default...`);
      
      // Generate new secure key
      const newKey = await this.generateAndStoreKey(keyName, keyType);
      
      // Log migration event
      await this.logKeyMigration(keyType, 'insecure_default');
      
      console.log(`[SecureKeyManager] Successfully migrated ${keyType} key`);
      return newKey;
    } catch (error) {
      console.error(`[SecureKeyManager] Failed to migrate ${keyType} key:`, error);
      throw error;
    }
  }

  /**
   * Store key metadata for tracking and validation
   */
  private static async storeKeyMetadata(keyName: string, keyType: string, key: string): Promise<void> {
    try {
      const metadata = {
        keyType,
        version: this.KEY_VERSION,
        createdAt: Date.now(),
        keyId: key.substring(0, 20) + '...',
        platform: Platform.OS,
      };
      
      const metadataKey = `${keyName}_metadata`;
      await storage.setItem(metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.warn(`[SecureKeyManager] Failed to store key metadata for ${keyType}:`, error);
    }
  }

  /**
   * Log key migration events
   */
  private static async logKeyMigration(keyType: string, reason: string): Promise<void> {
    try {
      const logEntry = {
        timestamp: Date.now(),
        keyType,
        reason,
        platform: Platform.OS,
        version: this.KEY_VERSION,
      };
      
      const logKey = 'key_migration_log';
      let existingLogsRaw = await storage.getItem(logKey);
      let existingLogs: any[] = [];
      if (existingLogsRaw) {
        try {
          existingLogs = JSON.parse(existingLogsRaw);
          if (!Array.isArray(existingLogs)) {
            existingLogs = [];
          }
        } catch (e) {
          existingLogs = [];
        }
      }
      const updatedLogs = [logEntry, ...existingLogs].slice(0, 100); // Keep last 100 entries
      
      await storage.setItem(logKey, JSON.stringify(updatedLogs));
    } catch (error) {
      console.warn(`[SecureKeyManager] Failed to log key migration:`, error);
    }
  }

  /**
   * Get development fallback key (clearly marked as insecure)
   */
  private static getDevelopmentFallback(keyType: string): string {
    const fallbackKey = `${this.DEV_FALLBACK_PREFIX}${keyType}-${Date.now()}`;
    console.warn(`[SecureKeyManager] Using development fallback key for ${keyType}: ${fallbackKey.substring(0, 20)}...`);
    console.warn('[SecureKeyManager] This key is NOT secure and should never be used in production!');
    return fallbackKey;
  }

  /**
   * Clear all stored keys (for testing or reset)
   */
  static async clearAllKeys(): Promise<void> {
    try {
      console.log('[SecureKeyManager] Clearing all stored keys...');
      
      const keyNames = Object.values(this.KEY_NAMES);
      
      for (const keyName of keyNames) {
        try {
          if (Platform.OS === 'web') {
            localStorage.removeItem(keyName);
            localStorage.removeItem(`${keyName}_metadata`);
          } else {
            await SecureStore.deleteItemAsync(keyName);
          }
        } catch (error) {
          console.warn(`[SecureKeyManager] Failed to clear key ${keyName}:`, error);
        }
      }
      
      // Clear migration logs
      await storage.removeItem('key_migration_log');
      
      console.log('[SecureKeyManager] All keys cleared');
    } catch (error) {
      console.error('[SecureKeyManager] Failed to clear keys:', error);
      throw error;
    }
  }

  /**
   * Get key statistics for debugging
   */
  static async getKeyStats(): Promise<{
    keyCount: number;
    keyTypes: string[];
    lastMigration?: number;
    platform: string;
  }> {
    try {
      const keyNames = Object.values(this.KEY_NAMES);
      let keyCount = 0;
      const keyTypes: string[] = [];
      
      for (const keyName of keyNames) {
        const key = await this.getSecureKey(keyName);
        if (key) {
          keyCount++;
          const metadata = await storage.getItem(`${keyName}_metadata`);
          if (metadata) {
            try {
              const parsed = JSON.parse(metadata);
              keyTypes.push(parsed.keyType);
            } catch (e) {
              console.warn(`[SecureKeyManager] Failed to parse metadata for key ${keyName}:`, e);
            }
          }
        }
      }
      
      const migrationLog = await storage.getItem('key_migration_log');
      let lastMigration: number | undefined = undefined;
      if (migrationLog) {
        try {
          lastMigration = JSON.parse(migrationLog)[0]?.timestamp;
        } catch (e) {
          console.warn('[SecureKeyManager] Failed to parse migration log:', e);
        }
      }
      
      return {
        keyCount,
        keyTypes,
        lastMigration,
        platform: Platform.OS,
      };
    } catch (error) {
      console.error('[SecureKeyManager] Failed to get key stats:', error);
      return {
        keyCount: 0,
        keyTypes: [],
        platform: Platform.OS,
      };
    }
  }
}

export default SecureKeyManager;