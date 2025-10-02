import { storageHelpers, STORAGE_KEYS } from '@/lib/storage';

const CACHE_TTL_DAYS = 7;
const CACHE_VERSION = '1.0';

export interface CachedItem<T> {
  data: T;
  timestamp: number;
  version: string;
  expiresAt: number;
}

export interface CachedLesson {
  id: string;
  title: string;
  content: unknown;
  language: string;
  difficulty: string;
}

export interface CachedProgress {
  userId: string;
  lessonsCompleted: string[];
  currentStreak: number;
  xpPoints: number;
  lastUpdated: number;
}

export interface CachedVocabulary {
  userId: string;
  words: {
    word: string;
    translation: string;
    language: string;
    mastery: number;
  }[];
  lastUpdated: number;
}

class OfflineCache {
  private createCachedItem<T>(data: T, ttlDays: number = CACHE_TTL_DAYS): CachedItem<T> {
    const now = Date.now();
    return {
      data,
      timestamp: now,
      version: CACHE_VERSION,
      expiresAt: now + ttlDays * 24 * 60 * 60 * 1000,
    };
  }

  private isExpired<T>(cached: CachedItem<T>): boolean {
    return Date.now() > cached.expiresAt || cached.version !== CACHE_VERSION;
  }

  async cacheLessons(lessons: CachedLesson[]): Promise<void> {
    console.log('[OfflineCache] Caching', lessons.length, 'lessons');
    try {
      const cached = this.createCachedItem(lessons);
      await storageHelpers.setObject(STORAGE_KEYS.OFFLINE_LESSONS, cached);
    } catch (error) {
      console.error('[OfflineCache] Failed to cache lessons:', error);
      throw error;
    }
  }

  async getCachedLessons(): Promise<CachedLesson[] | null> {
    console.log('[OfflineCache] Retrieving cached lessons');
    try {
      const cached = await storageHelpers.getObject<CachedItem<CachedLesson[]>>(
        STORAGE_KEYS.OFFLINE_LESSONS
      );

      if (!cached) {
        console.log('[OfflineCache] No cached lessons found');
        return null;
      }

      if (this.isExpired(cached)) {
        console.log('[OfflineCache] Cached lessons expired');
        await storageHelpers.remove(STORAGE_KEYS.OFFLINE_LESSONS);
        return null;
      }

      console.log('[OfflineCache] Retrieved', cached.data.length, 'cached lessons');
      return cached.data;
    } catch (error) {
      console.error('[OfflineCache] Failed to get cached lessons:', error);
      return null;
    }
  }

  async cacheProgress(progress: CachedProgress): Promise<void> {
    console.log('[OfflineCache] Caching progress for user:', progress.userId);
    try {
      const cached = this.createCachedItem(progress, 30);
      await storageHelpers.setObject(STORAGE_KEYS.LEARNING_PROGRESS, cached);
    } catch (error) {
      console.error('[OfflineCache] Failed to cache progress:', error);
      throw error;
    }
  }

  async getCachedProgress(): Promise<CachedProgress | null> {
    console.log('[OfflineCache] Retrieving cached progress');
    try {
      const cached = await storageHelpers.getObject<CachedItem<CachedProgress>>(
        STORAGE_KEYS.LEARNING_PROGRESS
      );

      if (!cached) {
        console.log('[OfflineCache] No cached progress found');
        return null;
      }

      if (this.isExpired(cached)) {
        console.log('[OfflineCache] Cached progress expired');
        await storageHelpers.remove(STORAGE_KEYS.LEARNING_PROGRESS);
        return null;
      }

      console.log('[OfflineCache] Retrieved cached progress');
      return cached.data;
    } catch (error) {
      console.error('[OfflineCache] Failed to get cached progress:', error);
      return null;
    }
  }

  async cacheVocabulary(vocabulary: CachedVocabulary): Promise<void> {
    console.log('[OfflineCache] Caching vocabulary for user:', vocabulary.userId);
    try {
      const cached = this.createCachedItem(vocabulary, 14);
      await storageHelpers.setObject(STORAGE_KEYS.VOCABULARY, cached);
    } catch (error) {
      console.error('[OfflineCache] Failed to cache vocabulary:', error);
      throw error;
    }
  }

  async getCachedVocabulary(): Promise<CachedVocabulary | null> {
    console.log('[OfflineCache] Retrieving cached vocabulary');
    try {
      const cached = await storageHelpers.getObject<CachedItem<CachedVocabulary>>(
        STORAGE_KEYS.VOCABULARY
      );

      if (!cached) {
        console.log('[OfflineCache] No cached vocabulary found');
        return null;
      }

      if (this.isExpired(cached)) {
        console.log('[OfflineCache] Cached vocabulary expired');
        await storageHelpers.remove(STORAGE_KEYS.VOCABULARY);
        return null;
      }

      console.log('[OfflineCache] Retrieved cached vocabulary with', cached.data.words.length, 'words');
      return cached.data;
    } catch (error) {
      console.error('[OfflineCache] Failed to get cached vocabulary:', error);
      return null;
    }
  }

  async clearExpiredCache(): Promise<void> {
    console.log('[OfflineCache] Clearing expired cache items');
    
    const keys = [
      STORAGE_KEYS.OFFLINE_LESSONS,
      STORAGE_KEYS.LEARNING_PROGRESS,
      STORAGE_KEYS.VOCABULARY,
    ];

    for (const key of keys) {
      try {
        const cached = await storageHelpers.getObject<CachedItem<unknown>>(key);
        if (cached && this.isExpired(cached)) {
          console.log('[OfflineCache] Removing expired cache:', key);
          await storageHelpers.remove(key);
        }
      } catch (error) {
        console.error('[OfflineCache] Error checking cache expiry for', key, error);
      }
    }
  }

  async clearAllCache(): Promise<void> {
    console.log('[OfflineCache] Clearing all cache');
    
    const keys = [
      STORAGE_KEYS.OFFLINE_LESSONS,
      STORAGE_KEYS.LEARNING_PROGRESS,
      STORAGE_KEYS.VOCABULARY,
    ];

    for (const key of keys) {
      try {
        await storageHelpers.remove(key);
      } catch (error) {
        console.error('[OfflineCache] Error clearing cache for', key, error);
      }
    }
  }

  async getCacheSize(): Promise<{ lessons: number; progress: boolean; vocabulary: number }> {
    const lessons = await this.getCachedLessons();
    const progress = await this.getCachedProgress();
    const vocabulary = await this.getCachedVocabulary();

    return {
      lessons: lessons?.length ?? 0,
      progress: progress !== null,
      vocabulary: vocabulary?.words.length ?? 0,
    };
  }
}

export const offlineCache = new OfflineCache();
