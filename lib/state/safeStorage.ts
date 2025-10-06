import AsyncStorage from '@react-native-async-storage/async-storage';
import { Result, wrapAsync, err, ok } from '@/lib/errors/result';
import { AppError, createAppError } from '@/lib/errors/AppError';
import { z } from 'zod';

const QUARANTINE_PREFIX = '__bad_';
const QUARANTINE_KEY = '__quarantine_entries';

export interface StorageOptions {
  validate?: z.ZodType<unknown>;
  defaultValue?: unknown;
  quarantine?: boolean;
}

export class SafeStorage {
  private static instance: SafeStorage;
  private quarantineEntries: Set<string> = new Set();

  static getInstance(): SafeStorage {
    if (!SafeStorage.instance) {
      SafeStorage.instance = new SafeStorage();
    }
    return SafeStorage.instance;
  }

  async initialize(): Promise<Result<void>> {
    return wrapAsync<T>(async () => {
      // Load quarantine entries
      const quarantineData = await AsyncStorage.getItem(QUARANTINE_KEY);
      if (quarantineData) {
        try {
          const entries = JSON.parse(quarantineData);
          this.quarantineEntries = new Set(entries);
        } catch (error) {
          console.warn('Failed to parse quarantine entries:', error);
          this.quarantineEntries = new Set();
        }
      }
    });
  }

  async getItem<T = unknown>(
    key: string,
    options: StorageOptions = {}
  ): Promise<Result<T>> {
    return wrapAsync(async () => {
      try {
        const value = await AsyncStorage.getItem(key);
        
        if (value === null) {
          return (options.defaultValue as T) ?? (undefined as unknown as T);
        }

        let parsedValue: unknown;
        try {
          parsedValue = JSON.parse(value);
        } catch (parseError) {
          if (options.quarantine !== false) {
            await this.quarantineEntry(key, value, 'JSON_PARSE_ERROR', parseError);
          }
          return createAppError(
            'StorageError',
            'Failed to parse stored data',
            {
              cause: parseError,
              context: { key, value: value.substring(0, 100) },
            }
          );
        }

        // Validate with schema if provided
        if (options.validate) {
          const validation = options.validate.safeParse(parsedValue);
          if (!validation.success) {
            if (options.quarantine !== false) {
              await this.quarantineEntry(key, value, 'VALIDATION_ERROR', validation.error);
            }
            return createAppError(
              'ValidationError',
              'Stored data does not match expected schema',
              {
                cause: validation.error,
                context: {
                  key,
                  validationErrors: validation.error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                  })),
                },
              }
            );
          }
          return validation.data as T;
        }

        return parsedValue as T;
      } catch (error) {
        return createAppError(
          'StorageError',
          'Failed to retrieve data from storage',
          {
            cause: error,
            context: { key },
          }
        );
      }
    });
  }

  async setItem<T = unknown>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): Promise<Result<void>> {
    return wrapAsync<void>(async () => {
      try {
        // Validate with schema if provided
        if (options.validate) {
          const validation = options.validate.safeParse(value);
          if (!validation.success) {
            return createAppError(
              'ValidationError',
              'Data does not match expected schema',
              {
                cause: validation.error,
                context: {
                  key,
                  validationErrors: validation.error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                  })),
                },
              }
            );
          }
        }

        const serialized = JSON.stringify(value);
        
        // Check storage quota (rough estimate)
        const currentSize = await this.getStorageSize();
        if (currentSize + serialized.length > 5 * 1024 * 1024) { // 5MB limit
          return createAppError(
            'StorageError',
            'Storage quota exceeded',
            {
              context: { key, currentSize, newSize: serialized.length },
            }
          );
        }

        await AsyncStorage.setItem(key, serialized);
      } catch (error) {
        return createAppError(
          'StorageError',
          'Failed to store data',
          {
            cause: error,
            context: { key },
          }
        );
      }
    });
  }

  async removeItem(key: string): Promise<Result<void>> {
    return wrapAsync<void>(async () => {
      try {
        await AsyncStorage.removeItem(key);
        this.quarantineEntries.delete(key);
        await this.saveQuarantineEntries();
      } catch (error) {
        return createAppError(
          'StorageError',
          'Failed to remove data from storage',
          {
            cause: error,
            context: { key },
          }
        );
      }
    });
  }

  async clear(): Promise<Result<void>> {
    return wrapAsync<void>(async () => {
      try {
        await AsyncStorage.clear();
        this.quarantineEntries.clear();
        await this.saveQuarantineEntries();
      } catch (error) {
        return createAppError(
          'StorageError',
          'Failed to clear storage',
          { cause: error }
        );
      }
    });
  }

  async getAllKeys(): Promise<Result<string[]>> {
    return wrapAsync<Array<{ key: string; reason: string; timestamp: number }>>(async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        return keys.filter(key => !key.startsWith(QUARANTINE_PREFIX));
      } catch (error) {
        return createAppError(
          'StorageError',
          'Failed to get storage keys',
          { cause: error }
        );
      }
    });
  }

  async getQuarantineEntries(): Promise<Result<Array<{ key: string; reason: string; timestamp: number }>>> {
    return wrapAsync<void>(async () => {
      const entries: Array<{ key: string; reason: string; timestamp: number }> = [];
      
      for (const key of this.quarantineEntries) {
        const quarantineKey = `${QUARANTINE_PREFIX}${key}`;
        const data = await AsyncStorage.getItem(quarantineKey);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            entries.push({
              key,
              reason: parsed.reason || 'UNKNOWN',
              timestamp: parsed.timestamp || Date.now(),
            });
          } catch (error) {
            console.warn(`Failed to parse quarantine entry for ${key}:`, error);
          }
        }
      }
      
      return entries;
    });
  }

  async restoreQuarantineEntry(key: string): Promise<Result<void>> {
    return wrapAsync(async () => {
      const quarantineKey = `${QUARANTINE_PREFIX}${key}`;
      const data = await AsyncStorage.getItem(quarantineKey);
      
      if (!data) {
        return createAppError(
          'StorageError',
          'Quarantine entry not found',
          { context: { key } }
        );
      }

      try {
        const parsed = JSON.parse(data);
        await AsyncStorage.setItem(key, parsed.value);
        await AsyncStorage.removeItem(quarantineKey);
        this.quarantineEntries.delete(key);
        await this.saveQuarantineEntries();
      } catch (error) {
        return createAppError(
          'StorageError',
          'Failed to restore quarantine entry',
          {
            cause: error,
            context: { key },
          }
        );
      }
    });
  }

  private async quarantineEntry(
    key: string,
    value: string,
    reason: string,
    error: unknown
  ): Promise<void> {
    try {
      const quarantineKey = `${QUARANTINE_PREFIX}${key}`;
      const quarantineData = {
        originalKey: key,
        value,
        reason,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(quarantineKey, JSON.stringify(quarantineData));
      this.quarantineEntries.add(key);
      await this.saveQuarantineEntries();

      console.warn(`Quarantined corrupted storage entry: ${key} (${reason})`);
    } catch (quarantineError) {
      console.error(`Failed to quarantine entry ${key}:`, quarantineError);
    }
  }

  private async saveQuarantineEntries(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        QUARANTINE_KEY,
        JSON.stringify(Array.from(this.quarantineEntries))
      );
    } catch (error) {
      console.error('Failed to save quarantine entries:', error);
    }
  }

  private async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.warn('Failed to calculate storage size:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const safeStorage = SafeStorage.getInstance();

// Convenience functions
export const safeGetItem = <T = unknown>(
  key: string,
  options?: StorageOptions
): Promise<Result<T>> => safeStorage.getItem(key, options);

export const safeSetItem = <T = unknown>(
  key: string,
  value: T,
  options?: StorageOptions
): Promise<Result<void>> => safeStorage.setItem(key, value, options);

export const safeRemoveItem = (key: string): Promise<Result<void>> =>
  safeStorage.removeItem(key);

export const safeClear = (): Promise<Result<void>> => safeStorage.clear();