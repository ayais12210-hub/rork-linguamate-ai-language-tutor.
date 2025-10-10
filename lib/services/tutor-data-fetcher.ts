// Service to fetch language tutor data from external URLs
import { z } from 'zod';

// Define the expected structure of tutor data
const TutorDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  language: z.string(),
  level: z.string(),
  contentType: z.enum(['json', 'html', 'text']).optional().default('json'),
  rawContent: z.string().optional(), // For HTML/text content
  content: z.object({
    lessons: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      exercises: z.array(z.any()).optional(),
    })).optional(),
    vocabulary: z.array(z.object({
      word: z.string(),
      translation: z.string(),
      pronunciation: z.string().optional(),
    })).optional(),
    conversations: z.array(z.object({
      id: z.string(),
      scenario: z.string(),
      dialogue: z.array(z.object({
        speaker: z.string(),
        text: z.string(),
      })),
    })).optional(),
  }).optional(),
  metadata: z.object({
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    version: z.string().optional(),
    author: z.string().optional(),
    sourceUrl: z.string().optional(),
    contentType: z.string().optional(),
    contentLength: z.number().optional(),
  }).optional(),
});

export type TutorData = z.infer<typeof TutorDataSchema>;

// Error types for better error handling
export class TutorDataFetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public url?: string
  ) {
    super(message);
    this.name = 'TutorDataFetchError';
  }
}

export class TutorDataValidationError extends Error {
  constructor(message: string, public validationErrors: z.ZodError) {
    super(message);
    this.name = 'TutorDataValidationError';
  }
}

// Main service class
export class TutorDataFetcher {
  private static instance: TutorDataFetcher;
  private cache = new Map<string, { data: TutorData; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TutorDataFetcher {
    if (!TutorDataFetcher.instance) {
      TutorDataFetcher.instance = new TutorDataFetcher();
    }
    return TutorDataFetcher.instance;
  }

  /**
   * Fetch tutor data from a URL with caching and validation
   */
  async fetchTutorData(url: string, options: {
    useCache?: boolean;
    timeout?: number;
    validate?: boolean;
  } = {}): Promise<TutorData> {
    const {
      useCache = true,
      timeout = 30000,
      validate = true
    } = options;

    // Check cache first
    if (useCache && this.cache.has(url)) {
      const cached = this.cache.get(url)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('[TutorDataFetcher] Using cached data for:', url);
        return cached.data;
      }
      this.cache.delete(url);
    }

    try {
      console.log('[TutorDataFetcher] Fetching data from:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/html, text/plain, */*',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new TutorDataFetchError(
          `Failed to fetch data: ${response.status} ${response.statusText}`,
          response.status,
          url
        );
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      
      let rawData: any;
      let processedData: TutorData;

      // Handle different content types
      if (contentType.includes('application/json')) {
        rawData = await response.json();
        console.log('[TutorDataFetcher] JSON data received:', rawData);
        
        // Validate data structure if requested
        if (validate) {
          try {
            processedData = TutorDataSchema.parse(rawData);
          } catch (error) {
            if (error instanceof z.ZodError) {
              throw new TutorDataValidationError(
                'Data validation failed',
                error
              );
            }
            throw error;
          }
        } else {
          processedData = rawData as TutorData;
        }
      } else {
        // Handle HTML or text content
        const rawContent = await response.text();
        console.log('[TutorDataFetcher] Non-JSON content received:', contentType);
        
        // Extract basic info from HTML if possible
        const title = this.extractTitleFromHtml(rawContent);
        const description = this.extractDescriptionFromHtml(rawContent);
        
        processedData = {
          id: `html-${Date.now()}`,
          title: title || 'Web Content',
          description: description,
          language: 'en', // Default, could be extracted from HTML
          level: 'unknown',
          contentType: contentType.includes('html') ? 'html' : 'text',
          rawContent: rawContent,
          metadata: {
            sourceUrl: url,
            contentType: contentType,
            contentLength: contentLength,
            createdAt: new Date().toISOString(),
          }
        };
      }

      // Cache the processed data
      if (useCache) {
        this.cache.set(url, {
          data: processedData,
          timestamp: Date.now()
        });
      }

      return processedData;

    } catch (error) {
      console.error('[TutorDataFetcher] Error fetching data:', error);
      
      if (error instanceof TutorDataFetchError || error instanceof TutorDataValidationError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TutorDataFetchError('Request timeout', 408, url);
        }
        if (error.message.includes('Failed to fetch')) {
          throw new TutorDataFetchError('Network error - unable to reach server', 0, url);
        }
      }
      
      throw new TutorDataFetchError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        url
      );
    }
  }

  /**
   * Fetch multiple tutor data sources
   */
  async fetchMultipleTutorData(urls: string[], options: {
    useCache?: boolean;
    timeout?: number;
    validate?: boolean;
    concurrency?: number;
  } = {}): Promise<{ url: string; data: TutorData | null; error: Error | null }[]> {
    const {
      useCache = true,
      timeout = 30000,
      validate = true,
      concurrency = 3
    } = options;

    const results: { url: string; data: TutorData | null; error: Error | null }[] = [];
    
    // Process URLs in batches to control concurrency
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(async (url) => {
        try {
          const data = await this.fetchTutorData(url, { useCache, timeout, validate });
          return { url, data, error: null };
        } catch (error) {
          return { 
            url, 
            data: null, 
            error: error instanceof Error ? error : new Error('Unknown error')
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Clear cache for a specific URL or all URLs
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      console.log('[TutorDataFetcher] Cleared cache for:', url);
    } else {
      this.cache.clear();
      console.log('[TutorDataFetcher] Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; urls: string[]; oldestEntry?: number } {
    const urls = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : undefined;
    
    return {
      size: this.cache.size,
      urls,
      oldestEntry
    };
  }

  /**
   * Validate a URL before attempting to fetch
   */
  static isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Extract domain from URL for logging/identification
   */
  static extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'invalid-url';
    }
  }

  /**
   * Extract title from HTML content
   */
  private extractTitleFromHtml(html: string): string | null {
    try {
      // Look for <title> tag
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim();
      }

      // Look for h1 tag
      const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
      if (h1Match && h1Match[1]) {
        return h1Match[1].trim();
      }

      // Look for meta title
      const metaTitleMatch = html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']*)["']/i);
      if (metaTitleMatch && metaTitleMatch[1]) {
        return metaTitleMatch[1].trim();
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract description from HTML content
   */
  private extractDescriptionFromHtml(html: string): string | null {
    try {
      // Look for meta description
      const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
      if (metaDescMatch && metaDescMatch[1]) {
        return metaDescMatch[1].trim();
      }

      // Look for first paragraph
      const pMatch = html.match(/<p[^>]*>([^<]*)<\/p>/i);
      if (pMatch && pMatch[1]) {
        return pMatch[1].trim().substring(0, 200); // Limit to 200 chars
      }

      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const tutorDataFetcher = TutorDataFetcher.getInstance();

// Helper functions for common operations
export const tutorDataHelpers = {
  /**
   * Fetch and process tutor data with error handling
   */
  async fetchWithFallback(url: string, fallbackData?: Partial<TutorData>): Promise<TutorData | null> {
    try {
      return await tutorDataFetcher.fetchTutorData(url);
    } catch (error) {
      console.warn('[TutorDataHelpers] Failed to fetch tutor data, using fallback:', error);
      
      if (fallbackData) {
        return {
          id: 'fallback',
          title: 'Fallback Content',
          language: 'en',
          level: 'beginner',
          content: {
            lessons: [],
            vocabulary: [],
            conversations: [],
          },
          ...fallbackData,
        } as TutorData;
      }
      
      return null;
    }
  },

  /**
   * Check if data is fresh (less than specified age)
   */
  isDataFresh(timestamp: number, maxAgeMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - timestamp < maxAgeMs;
  },

  /**
   * Format error message for user display
   */
  formatError(error: Error): string {
    if (error instanceof TutorDataFetchError) {
      if (error.status === 404) {
        return 'Tutor data not found at the specified URL.';
      }
      if (error.status === 403) {
        return 'Access denied to tutor data. Please check permissions.';
      }
      if (error.status === 0) {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
      return `Failed to fetch tutor data: ${error.message}`;
    }
    
    if (error instanceof TutorDataValidationError) {
      return 'The tutor data format is invalid or corrupted.';
    }
    
    return `An error occurred: ${error.message}`;
  }
};