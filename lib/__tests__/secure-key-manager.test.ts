/**
 * Tests for SecureKeyManager
 * 
 * These tests verify that the secure key management system works correctly
 * and properly handles migration from insecure default keys.
 */

import SecureKeyManager from '../secure-key-manager';
import { initializeSecureStorage, getSecureStorageStats } from '../mmkv-storage';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock storage
jest.mock('../storage', () => ({
  storage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('SecureKeyManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage for web tests
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Key Generation', () => {
    it('should generate secure keys with proper format', async () => {
      const key = SecureKeyManager['generateSecureKey']();
      
      expect(key).toMatch(/^secure-v2-/);
      expect(key.length).toBeGreaterThan(20);
    });

    it('should generate different keys each time', async () => {
      const key1 = SecureKeyManager['generateSecureKey']();
      const key2 = SecureKeyManager['generateSecureKey']();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Key Validation', () => {
    it('should identify insecure default keys', async () => {
      const validation = await SecureKeyManager['validateKey']('linguamate-encryption-key-v1', 'default');
      
      expect(validation.isInsecureDefault).toBe(true);
      expect(validation.isValid).toBe(false);
      expect(validation.needsMigration).toBe(true);
    });

    it('should validate secure keys as valid', async () => {
      const secureKey = 'secure-v2-abcdef1234567890';
      const validation = await SecureKeyManager['validateKey'](secureKey, 'default');
      
      expect(validation.isInsecureDefault).toBe(false);
      expect(validation.isValid).toBe(true);
      expect(validation.needsMigration).toBe(false);
    });

    it('should reject keys that are too short', async () => {
      const shortKey = 'short';
      const validation = await SecureKeyManager['validateKey'](shortKey, 'default');
      
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Development Fallback', () => {
    it('should provide development fallback keys', () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;
      
      const fallbackKey = SecureKeyManager['getDevelopmentFallback']('default');
      
      expect(fallbackKey).toMatch(/^dev-fallback-default-/);
      
      (global as any).__DEV__ = originalDev;
    });
  });

  describe('Key Statistics', () => {
    it('should return key statistics', async () => {
      const stats = await SecureKeyManager.getKeyStats();
      
      expect(stats).toHaveProperty('keyCount');
      expect(stats).toHaveProperty('keyTypes');
      expect(stats).toHaveProperty('platform');
      expect(typeof stats.keyCount).toBe('number');
      expect(Array.isArray(stats.keyTypes)).toBe(true);
    });
  });
});

describe('MMKV Storage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize storage with secure keys', async () => {
    // Mock the secure key manager
    const mockGetEncryptionKey = jest.spyOn(SecureKeyManager, 'getEncryptionKey');
    mockGetEncryptionKey.mockResolvedValue('secure-test-key');

    const mockInitialize = jest.spyOn(SecureKeyManager, 'initialize');
    mockInitialize.mockResolvedValue();

    await initializeSecureStorage();

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockGetEncryptionKey).toHaveBeenCalledWith('default');
    expect(mockGetEncryptionKey).toHaveBeenCalledWith('cache');
    expect(mockGetEncryptionKey).toHaveBeenCalledWith('secure');
  });

  it('should provide fallback in development mode', async () => {
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = true;

    const mockInitialize = jest.spyOn(SecureKeyManager, 'initialize');
    mockInitialize.mockRejectedValue(new Error('Secure storage not available'));

    // Should not throw in development mode
    await expect(initializeSecureStorage()).resolves.not.toThrow();

    (global as any).__DEV__ = originalDev;
  });

  it('should throw in production if initialization fails', async () => {
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = false;

    const mockInitialize = jest.spyOn(SecureKeyManager, 'initialize');
    mockInitialize.mockRejectedValue(new Error('Secure storage not available'));

    await expect(initializeSecureStorage()).rejects.toThrow('Failed to initialize secure storage');

    (global as any).__DEV__ = originalDev;
  });
});

describe('Migration Logic', () => {
  it('should detect and migrate from insecure keys', async () => {
    // Mock localStorage to simulate existing insecure key
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mmkv_default_encryption_key', 'linguamate-encryption-key-v1');
    }

    const mockGenerateAndStoreKey = jest.spyOn(SecureKeyManager as any, 'generateAndStoreKey');
    mockGenerateAndStoreKey.mockResolvedValue('new-secure-key');

    const mockGetSecureKey = jest.spyOn(SecureKeyManager as any, 'getSecureKey');
    mockGetSecureKey.mockResolvedValue('linguamate-encryption-key-v1');

    await SecureKeyManager['validateAndMigrateKey']('mmkv_default_encryption_key', 'default');

    expect(mockGenerateAndStoreKey).toHaveBeenCalled();
  });
});