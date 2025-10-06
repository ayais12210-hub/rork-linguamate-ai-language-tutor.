import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeStorage, safeGetItem, safeSetItem } from '@/lib/state/safeStorage';
import { z } from 'zod';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('SafeStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItem', () => {
    const TestSchema = z.object({
      id: z.string(),
      name: z.string(),
    });

    it('should return parsed data for valid JSON', async () => {
      const testData = { id: '1', name: 'Test' };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(testData));

      const result = await safeGetItem('test-key', { validate: TestSchema });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(testData);
      }
    });

    it('should return default value for null', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await safeGetItem('test-key', { defaultValue: 'default' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('default');
      }
    });

    it('should handle JSON parse error', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json');

      const result = await safeGetItem('test-key', { validate: TestSchema });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('StorageError');
      }
    });

    it('should handle validation error', async () => {
      const invalidData = { id: 123, name: null };
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(invalidData));

      const result = await safeGetItem('test-key', { validate: TestSchema });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ValidationError');
      }
    });

    it('should handle storage error', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await safeGetItem('test-key');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('StorageError');
      }
    });
  });

  describe('setItem', () => {
    const TestSchema = z.object({
      id: z.string(),
      name: z.string(),
    });

    it('should store valid data', async () => {
      const testData = { id: '1', name: 'Test' };
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);

      const result = await safeSetItem('test-key', testData, { validate: TestSchema });

      expect(result.ok).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testData)
      );
    });

    it('should handle validation error', async () => {
      const invalidData = { id: 123, name: null };

      const result = await safeSetItem('test-key', invalidData, { validate: TestSchema });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('ValidationError');
      }
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle storage error', async () => {
      const testData = { id: '1', name: 'Test' };
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      const result = await safeSetItem('test-key', testData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('StorageError');
      }
    });
  });

  describe('quarantine functionality', () => {
    it('should quarantine corrupted entries', async () => {
      const corruptedData = 'invalid json';
      mockAsyncStorage.getItem.mockResolvedValueOnce(corruptedData);
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await safeGetItem('corrupted-key', { quarantine: true });

      expect(result.ok).toBe(false);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '__bad_corrupted-key',
        expect.stringContaining('JSON_PARSE_ERROR')
      );
    });

    it('should not quarantine when disabled', async () => {
      const corruptedData = 'invalid json';
      mockAsyncStorage.getItem.mockResolvedValueOnce(corruptedData);

      const result = await safeGetItem('corrupted-key', { quarantine: false });

      expect(result.ok).toBe(false);
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});