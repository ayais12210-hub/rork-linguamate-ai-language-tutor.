import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tutorDataFetcher, TutorDataFetchError, TutorDataValidationError } from '../lib/services/tutor-data-fetcher';

// Mock fetch globally
global.fetch = jest.fn();

describe('TutorDataFetcher', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    tutorDataFetcher.clearCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchTutorData', () => {
    it('should fetch and validate tutor data successfully', async () => {
      const mockData = {
        id: 'test-1',
        title: 'Test Lesson',
        language: 'en',
        level: 'beginner',
        content: {
          lessons: [{
            id: 'lesson-1',
            title: 'Basic Greetings',
            content: 'Hello, how are you?',
          }],
          vocabulary: [{
            word: 'hello',
            translation: 'hola',
            pronunciation: 'heh-loh',
          }],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await tutorDataFetcher.fetchTutorData('https://example.com/tutor-data');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/tutor-data',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should throw TutorDataFetchError for HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        tutorDataFetcher.fetchTutorData('https://example.com/not-found')
      ).rejects.toThrow(TutorDataFetchError);
    });

    it('should throw TutorDataValidationError for invalid data', async () => {
      const invalidData = {
        id: 'test-1',
        // Missing required fields
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidData),
      });

      await expect(
        tutorDataFetcher.fetchTutorData('https://example.com/invalid-data')
      ).rejects.toThrow(TutorDataValidationError);
    });

    it('should use cache when enabled', async () => {
      const mockData = {
        id: 'test-1',
        title: 'Test Lesson',
        language: 'en',
        level: 'beginner',
        content: {},
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const url = 'https://example.com/cached-data';
      
      // First fetch
      const result1 = await tutorDataFetcher.fetchTutorData(url);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second fetch should use cache
      const result2 = await tutorDataFetcher.fetchTutorData(url);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(result1).toEqual(result2);
    });

    it('should bypass cache when disabled', async () => {
      const mockData = {
        id: 'test-1',
        title: 'Test Lesson',
        language: 'en',
        level: 'beginner',
        content: {},
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const url = 'https://example.com/no-cache-data';
      
      // First fetch
      await tutorDataFetcher.fetchTutorData(url, { useCache: true });
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second fetch with cache disabled
      await tutorDataFetcher.fetchTutorData(url, { useCache: false });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchMultipleTutorData', () => {
    it('should fetch multiple URLs successfully', async () => {
      const mockData1 = {
        id: 'test-1',
        title: 'Test Lesson 1',
        language: 'en',
        level: 'beginner',
        content: {},
      };

      const mockData2 = {
        id: 'test-2',
        title: 'Test Lesson 2',
        language: 'es',
        level: 'intermediate',
        content: {},
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData2),
        });

      const urls = ['https://example.com/data1', 'https://example.com/data2'];
      const results = await tutorDataFetcher.fetchMultipleTutorData(urls);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        url: urls[0],
        data: mockData1,
        error: null,
      });
      expect(results[1]).toEqual({
        url: urls[1],
        data: mockData2,
        error: null,
      });
    });

    it('should handle mixed success and failure results', async () => {
      const mockData = {
        id: 'test-1',
        title: 'Test Lesson',
        language: 'en',
        level: 'beginner',
        content: {},
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const urls = ['https://example.com/success', 'https://example.com/fail'];
      const results = await tutorDataFetcher.fetchMultipleTutorData(urls);

      expect(results).toHaveLength(2);
      expect(results[0].data).toEqual(mockData);
      expect(results[0].error).toBeNull();
      expect(results[1].data).toBeNull();
      expect(results[1].error).toBeInstanceOf(Error);
    });
  });

  describe('cache management', () => {
    it('should clear cache for specific URL', async () => {
      const mockData = {
        id: 'test-1',
        title: 'Test Lesson',
        language: 'en',
        level: 'beginner',
        content: {},
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const url = 'https://example.com/cache-test';
      
      // Fetch and cache
      await tutorDataFetcher.fetchTutorData(url);
      expect(tutorDataFetcher.getCacheStats().size).toBe(1);

      // Clear specific URL
      tutorDataFetcher.clearCache(url);
      expect(tutorDataFetcher.getCacheStats().size).toBe(0);
    });

    it('should clear all cache', async () => {
      const mockData = {
        id: 'test-1',
        title: 'Test Lesson',
        language: 'en',
        level: 'beginner',
        content: {},
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      // Fetch multiple URLs
      await tutorDataFetcher.fetchTutorData('https://example.com/url1');
      await tutorDataFetcher.fetchTutorData('https://example.com/url2');
      expect(tutorDataFetcher.getCacheStats().size).toBe(2);

      // Clear all cache
      tutorDataFetcher.clearCache();
      expect(tutorDataFetcher.getCacheStats().size).toBe(0);
    });
  });

  describe('utility methods', () => {
    it('should validate URLs correctly', () => {
      expect(tutorDataFetcher.constructor.isValidUrl('https://example.com')).toBe(true);
      expect(tutorDataFetcher.constructor.isValidUrl('http://example.com')).toBe(true);
      expect(tutorDataFetcher.constructor.isValidUrl('ftp://example.com')).toBe(false);
      expect(tutorDataFetcher.constructor.isValidUrl('invalid-url')).toBe(false);
    });

    it('should extract domain correctly', () => {
      expect(tutorDataFetcher.constructor.extractDomain('https://example.com/path')).toBe('example.com');
      expect(tutorDataFetcher.constructor.extractDomain('http://subdomain.example.com')).toBe('subdomain.example.com');
      expect(tutorDataFetcher.constructor.extractDomain('invalid-url')).toBe('invalid-url');
    });
  });
});