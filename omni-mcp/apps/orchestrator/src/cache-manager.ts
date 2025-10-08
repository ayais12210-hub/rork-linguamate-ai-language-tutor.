import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { MonitoringSystem } from './monitoring-system.js';

// Caching schemas
const CacheConfigSchema = z.object({
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
    keyPrefix: z.string().default('mcp:'),
    connectTimeout: z.number().default(5000),
    commandTimeout: z.number().default(5000),
    retryDelayOnFailover: z.number().default(100),
    maxRetriesPerRequest: z.number().default(3),
  }),
  defaultTTL: z.number().default(3600), // 1 hour
  maxMemory: z.string().default('256mb'),
  evictionPolicy: z.enum(['allkeys-lru', 'allkeys-lfu', 'volatile-lru', 'volatile-lfu', 'allkeys-random', 'volatile-random', 'volatile-ttl']).default('allkeys-lru'),
  compression: z.boolean().default(true),
  encryption: z.boolean().default(false),
  enableCluster: z.boolean().default(false),
  clusterNodes: z.array(z.string()).default([]),
});

const CacheEntrySchema = z.object({
  key: z.string(),
  value: z.any(),
  ttl: z.number(),
  createdAt: z.date(),
  expiresAt: z.date(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

const CacheStatsSchema = z.object({
  hits: z.number(),
  misses: z.number(),
  sets: z.number(),
  deletes: z.number(),
  evictions: z.number(),
  memoryUsage: z.number(),
  keyCount: z.number(),
  hitRate: z.number(),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CacheStats = z.infer<typeof CacheStatsSchema>;

export interface CacheContext {
  userId?: string;
  sessionId?: string;
  workflowId?: string;
  executionId?: string;
  agentId?: string;
  source?: string;
}

export interface CacheInvalidationRule {
  pattern: string;
  tags?: string[];
  conditions?: Record<string, any>;
}

export interface CacheStrategy {
  name: string;
  ttl: number;
  tags: string[];
  compression: boolean;
  encryption: boolean;
  invalidationRules: CacheInvalidationRule[];
}

export class CacheManager extends EventEmitter {
  private config: CacheConfig;
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private monitoringSystem: MonitoringSystem;
  private redis: any; // Redis client
  private strategies: Map<string, CacheStrategy> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    memoryUsage: 0,
    keyCount: 0,
    hitRate: 0,
  };
  private isRunning: boolean = false;

  constructor(
    config: CacheConfig,
    configManager: ConfigManager,
    securityManager: SecurityManager,
    monitoringSystem: MonitoringSystem,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.config = CacheConfigSchema.parse(config);
    this.configManager = configManager;
    this.securityManager = securityManager;
    this.monitoringSystem = monitoringSystem;
    this.logger = logger;
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      // Dynamic import for Redis client
      const Redis = await import('ioredis');
      
      if (this.config.enableCluster && this.config.clusterNodes.length > 0) {
        this.redis = new Redis.Cluster(this.config.clusterNodes, {
          redisOptions: {
            password: this.config.redis.password,
            db: this.config.redis.db,
            connectTimeout: this.config.redis.connectTimeout,
            commandTimeout: this.config.redis.commandTimeout,
            retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
            maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
          },
        });
      } else {
        this.redis = new Redis({
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password,
          db: this.config.redis.db,
          keyPrefix: this.config.redis.keyPrefix,
          connectTimeout: this.config.redis.connectTimeout,
          commandTimeout: this.config.redis.commandTimeout,
          retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
          maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
        });
      }

      // Set up event handlers
      this.redis.on('connect', () => {
        this.logger.info('Redis connected');
        this.emit('redis:connected');
      });

      this.redis.on('error', (error: Error) => {
        this.logger.error({ error }, 'Redis connection error');
        this.emit('redis:error', { error });
      });

      this.redis.on('close', () => {
        this.logger.warn('Redis connection closed');
        this.emit('redis:closed');
      });

      // Configure Redis
      await this.configureRedis();

      this.logger.info({
        host: this.config.redis.host,
        port: this.config.redis.port,
        db: this.config.redis.db,
        cluster: this.config.enableCluster,
      }, 'Redis initialized');

    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Redis');
      throw error;
    }
  }

  /**
   * Configure Redis settings
   */
  private async configureRedis(): Promise<void> {
    try {
      // Set memory policy
      await this.redis.config('SET', 'maxmemory', this.config.maxMemory);
      await this.redis.config('SET', 'maxmemory-policy', this.config.evictionPolicy);

      this.logger.info({
        maxMemory: this.config.maxMemory,
        evictionPolicy: this.config.evictionPolicy,
      }, 'Redis configured');

    } catch (error) {
      this.logger.error({ error }, 'Failed to configure Redis');
    }
  }

  /**
   * Set cache entry
   */
  async set(
    key: string,
    value: any,
    options: {
      ttl?: number;
      tags?: string[];
      strategy?: string;
      context?: CacheContext;
    } = {}
  ): Promise<void> {
    try {
      const strategy = options.strategy ? this.strategies.get(options.strategy) : undefined;
      const ttl = options.ttl || strategy?.ttl || this.config.defaultTTL;
      const tags = options.tags || strategy?.tags || [];
      const compression = strategy?.compression ?? this.config.compression;
      const encryption = strategy?.encryption ?? this.config.encryption;

      // Serialize value
      let serializedValue = JSON.stringify(value);
      
      // Apply compression if enabled
      if (compression) {
        const zlib = await import('zlib');
        serializedValue = zlib.gzipSync(serializedValue).toString('base64');
      }

      // Apply encryption if enabled
      if (encryption) {
        serializedValue = this.securityManager.encrypt(serializedValue);
      }

      // Create cache entry
      const entry: CacheEntry = {
        key,
        value: serializedValue,
        ttl,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttl * 1000),
        tags,
        metadata: {
          compression,
          encryption,
          strategy: options.strategy,
          context: options.context,
        },
      };

      // Store in Redis
      await this.redis.setex(key, ttl, JSON.stringify(entry));

      // Update tags index
      await this.updateTagsIndex(key, tags);

      // Update statistics
      this.stats.sets++;
      this.updateHitRate();

      // Record metrics
      this.monitoringSystem.recordMetric(
        'cache_sets',
        1,
        'counter',
        { strategy: options.strategy || 'default', tags: tags.join(',') }
      );

      this.logger.debug({
        key,
        ttl,
        tags,
        strategy: options.strategy,
        compression,
        encryption,
      }, 'Cache entry set');

      this.emit('cache:set', { key, ttl, tags, strategy: options.strategy });

    } catch (error) {
      this.logger.error({
        key,
        error,
      }, 'Failed to set cache entry');

      throw error;
    }
  }

  /**
   * Get cache entry
   */
  async get(
    key: string,
    options: {
      strategy?: string;
      context?: CacheContext;
    } = {}
  ): Promise<any> {
    try {
      const entryData = await this.redis.get(key);
      
      if (!entryData) {
        this.stats.misses++;
        this.updateHitRate();
        
        this.monitoringSystem.recordMetric(
          'cache_misses',
          1,
          'counter',
          { strategy: options.strategy || 'default' }
        );

        this.logger.debug({ key }, 'Cache miss');
        return null;
      }

      const entry: CacheEntry = JSON.parse(entryData);
      
      // Check if expired
      if (entry.expiresAt < new Date()) {
        await this.del(key);
        this.stats.misses++;
        this.updateHitRate();
        
        this.logger.debug({ key }, 'Cache entry expired');
        return null;
      }

      // Deserialize value
      let value = entry.value;
      
      // Apply decryption if enabled
      if (entry.metadata.encryption) {
        value = this.securityManager.decrypt(value);
      }

      // Apply decompression if enabled
      if (entry.metadata.compression) {
        const zlib = await import('zlib');
        const buffer = Buffer.from(value, 'base64');
        value = zlib.gunzipSync(buffer).toString('utf8');
      }

      const deserializedValue = JSON.parse(value);

      // Update statistics
      this.stats.hits++;
      this.updateHitRate();

      // Record metrics
      this.monitoringSystem.recordMetric(
        'cache_hits',
        1,
        'counter',
        { strategy: options.strategy || 'default', tags: entry.tags.join(',') }
      );

      this.logger.debug({
        key,
        ttl: Math.floor((entry.expiresAt.getTime() - Date.now()) / 1000),
        tags: entry.tags,
      }, 'Cache hit');

      this.emit('cache:hit', { key, tags: entry.tags });

      return deserializedValue;

    } catch (error) {
      this.logger.error({
        key,
        error,
      }, 'Failed to get cache entry');

      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      
      // Remove from tags index
      await this.removeFromTagsIndex(key);

      // Update statistics
      this.stats.deletes++;

      this.logger.debug({ key }, 'Cache entry deleted');

      this.emit('cache:delete', { key });

    } catch (error) {
      this.logger.error({
        key,
        error,
      }, 'Failed to delete cache entry');

      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error({ key, error }, 'Failed to check cache key existence');
      return false;
    }
  }

  /**
   * Get multiple keys
   */
  async mget(keys: string[]): Promise<Record<string, any>> {
    try {
      const values = await this.redis.mget(...keys);
      const result: Record<string, any> = {};
      
      for (let i = 0; i < keys.length; i++) {
        if (values[i]) {
          result[keys[i]] = await this.get(keys[i]);
        }
      }

      return result;
    } catch (error) {
      this.logger.error({ keys, error }, 'Failed to get multiple cache entries');
      return {};
    }
  }

  /**
   * Set multiple keys
   */
  async mset(entries: Record<string, any>, options: {
    ttl?: number;
    tags?: string[];
    strategy?: string;
  } = {}): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of Object.entries(entries)) {
        await this.set(key, value, options);
      }

      await pipeline.exec();
    } catch (error) {
      this.logger.error({ entries, error }, 'Failed to set multiple cache entries');
      throw error;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let totalInvalidated = 0;
      
      for (const tag of tags) {
        const keys = await this.getKeysByTag(tag);
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
          totalInvalidated += keys.length;
          
          // Remove from tags index
          await this.removeTagFromIndex(tag);
        }
      }

      this.logger.info({
        tags,
        invalidatedKeys: totalInvalidated,
      }, 'Cache invalidated by tags');

      this.emit('cache:invalidate', { tags, count: totalInvalidated });

      return totalInvalidated;
    } catch (error) {
      this.logger.error({ tags, error }, 'Failed to invalidate cache by tags');
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      this.logger.info({
        pattern,
        invalidatedKeys: keys.length,
      }, 'Cache invalidated by pattern');

      this.emit('cache:invalidate', { pattern, count: keys.length });

      return keys.length;
    } catch (error) {
      this.logger.error({ pattern, error }, 'Failed to invalidate cache by pattern');
      throw error;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      
      // Clear tags index
      await this.redis.del('cache:tags:*');

      this.logger.info('Cache cleared');

      this.emit('cache:clear');

    } catch (error) {
      this.logger.error({ error }, 'Failed to clear cache');
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const memoryUsage = this.parseMemoryUsage(info);
      
      const keyCount = await this.redis.dbsize();
      
      this.stats.memoryUsage = memoryUsage;
      this.stats.keyCount = keyCount;

      return { ...this.stats };
    } catch (error) {
      this.logger.error({ error }, 'Failed to get cache statistics');
      return this.stats;
    }
  }

  /**
   * Register cache strategy
   */
  registerStrategy(strategy: CacheStrategy): void {
    this.strategies.set(strategy.name, strategy);
    
    this.logger.info({
      strategy: strategy.name,
      ttl: strategy.ttl,
      tags: strategy.tags,
      compression: strategy.compression,
      encryption: strategy.encryption,
    }, 'Cache strategy registered');

    this.emit('strategy:registered', { strategy });
  }

  /**
   * Get cache strategy
   */
  getStrategy(name: string): CacheStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Update tags index
   */
  private async updateTagsIndex(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        await this.redis.sadd(`cache:tags:${tag}`, key);
      }
    } catch (error) {
      this.logger.error({ key, tags, error }, 'Failed to update tags index');
    }
  }

  /**
   * Remove from tags index
   */
  private async removeFromTagsIndex(key: string): Promise<void> {
    try {
      // Get all tags for this key
      const tagKeys = await this.redis.keys('cache:tags:*');
      
      for (const tagKey of tagKeys) {
        await this.redis.srem(tagKey, key);
      }
    } catch (error) {
      this.logger.error({ key, error }, 'Failed to remove from tags index');
    }
  }

  /**
   * Remove tag from index
   */
  private async removeTagFromIndex(tag: string): Promise<void> {
    try {
      await this.redis.del(`cache:tags:${tag}`);
    } catch (error) {
      this.logger.error({ tag, error }, 'Failed to remove tag from index');
    }
  }

  /**
   * Get keys by tag
   */
  private async getKeysByTag(tag: string): Promise<string[]> {
    try {
      return await this.redis.smembers(`cache:tags:${tag}`);
    } catch (error) {
      this.logger.error({ tag, error }, 'Failed to get keys by tag');
      return [];
    }
  }

  /**
   * Parse memory usage from Redis info
   */
  private parseMemoryUsage(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Start the cache manager
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    await this.initializeRedis();
    
    // Register default strategies
    this.registerDefaultStrategies();
    
    this.logger.info('Cache manager started');
  }

  /**
   * Register default strategies
   */
  private registerDefaultStrategies(): void {
    // Short-term cache for API responses
    this.registerStrategy({
      name: 'api',
      ttl: 300, // 5 minutes
      tags: ['api', 'response'],
      compression: true,
      encryption: false,
      invalidationRules: [
        { pattern: 'api:*', tags: ['api'] },
      ],
    });

    // Long-term cache for static data
    this.registerStrategy({
      name: 'static',
      ttl: 86400, // 24 hours
      tags: ['static', 'data'],
      compression: true,
      encryption: false,
      invalidationRules: [
        { pattern: 'static:*', tags: ['static'] },
      ],
    });

    // Secure cache for sensitive data
    this.registerStrategy({
      name: 'secure',
      ttl: 1800, // 30 minutes
      tags: ['secure', 'sensitive'],
      compression: false,
      encryption: true,
      invalidationRules: [
        { pattern: 'secure:*', tags: ['secure'] },
      ],
    });

    // Session cache
    this.registerStrategy({
      name: 'session',
      ttl: 3600, // 1 hour
      tags: ['session', 'user'],
      compression: false,
      encryption: true,
      invalidationRules: [
        { pattern: 'session:*', tags: ['session'] },
      ],
    });
  }

  /**
   * Stop the cache manager
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    if (this.redis) {
      await this.redis.quit();
    }
    
    this.logger.info('Cache manager stopped');
  }
}