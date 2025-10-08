import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { MonitoringSystem } from './monitoring-system.js';
import { CacheManager } from './cache-manager.js';

// API call management schemas
const APICallConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  retryDelay: z.number().default(1000),
  retryBackoff: z.enum(['linear', 'exponential', 'fixed']).default('exponential'),
  maxRetryDelay: z.number().default(30000),
  rateLimit: z.object({
    requests: z.number(),
    window: z.number(), // seconds
    burst: z.number().optional(),
  }).optional(),
  circuitBreaker: z.object({
    enabled: z.boolean().default(true),
    failureThreshold: z.number().default(5),
    recoveryTimeout: z.number().default(60000),
    halfOpenMaxCalls: z.number().default(3),
  }).optional(),
  headers: z.record(z.string()).default({}),
  auth: z.object({
    type: z.enum(['bearer', 'basic', 'api_key', 'oauth2']),
    token: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apiKey: z.string().optional(),
    apiKeyHeader: z.string().default('X-API-Key'),
  }).optional(),
  cache: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().default(300),
    key: z.string().optional(),
  }).optional(),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    trackMetrics: z.boolean().default(true),
    trackTraces: z.boolean().default(true),
  }).optional(),
});

const APICallResultSchema = z.object({
  id: z.string(),
  configId: z.string(),
  method: z.string(),
  url: z.string(),
  statusCode: z.number(),
  success: z.boolean(),
  responseTime: z.number(),
  retryCount: z.number(),
  error: z.string().optional(),
  response: z.any().optional(),
  headers: z.record(z.string()).optional(),
  timestamp: z.date(),
  metadata: z.record(z.any()).default({}),
});

const CircuitBreakerStateSchema = z.object({
  id: z.string(),
  state: z.enum(['closed', 'open', 'half-open']),
  failures: z.number(),
  lastFailure: z.date().optional(),
  nextAttempt: z.date().optional(),
  successCount: z.number().default(0),
  failureCount: z.number().default(0),
});

const RateLimiterStateSchema = z.object({
  id: z.string(),
  requests: z.number(),
  windowStart: z.date(),
  burstTokens: z.number().default(0),
  maxBurstTokens: z.number().default(0),
});

export type APICallConfig = z.infer<typeof APICallConfigSchema>;
export type APICallResult = z.infer<typeof APICallResultSchema>;
export type CircuitBreakerState = z.infer<typeof CircuitBreakerStateSchema>;
export type RateLimiterState = z.infer<typeof RateLimiterStateSchema>;

export interface APICallContext {
  configManager: ConfigManager;
  securityManager: SecurityManager;
  monitoringSystem: MonitoringSystem;
  cacheManager: CacheManager;
  logger: ReturnType<typeof createLogger>;
}

export interface APICallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
  context?: Record<string, any>;
}

export class APICallManager extends EventEmitter {
  private apiConfigs: Map<string, APICallConfig> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private rateLimiters: Map<string, RateLimiterState> = new Map();
  private callResults: Map<string, APICallResult[]> = new Map(); // configId -> results history
  private context: APICallContext;
  private logger: ReturnType<typeof createLogger>;
  private isRunning: boolean = false;

  constructor(
    context: APICallContext,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.context = context;
    this.logger = logger;
  }

  /**
   * Register an API configuration
   */
  async registerAPIConfig(config: APICallConfig): Promise<void> {
    try {
      const validatedConfig = APICallConfigSchema.parse(config);
      
      this.apiConfigs.set(validatedConfig.id, validatedConfig);
      
      // Initialize circuit breaker
      if (validatedConfig.circuitBreaker?.enabled) {
        this.circuitBreakers.set(validatedConfig.id, {
          id: validatedConfig.id,
          state: 'closed',
          failures: 0,
          successCount: 0,
          failureCount: 0,
        });
      }
      
      // Initialize rate limiter
      if (validatedConfig.rateLimit) {
        this.rateLimiters.set(validatedConfig.id, {
          id: validatedConfig.id,
          requests: 0,
          windowStart: new Date(),
          burstTokens: validatedConfig.rateLimit.burst || 0,
          maxBurstTokens: validatedConfig.rateLimit.burst || 0,
        });
      }
      
      // Initialize results history
      this.callResults.set(validatedConfig.id, []);

      this.logger.info({
        configId: validatedConfig.id,
        name: validatedConfig.name,
        baseUrl: validatedConfig.baseUrl,
        rateLimit: validatedConfig.rateLimit?.requests || 'none',
        circuitBreaker: validatedConfig.circuitBreaker?.enabled || false,
        cache: validatedConfig.cache?.enabled || false,
      }, 'API configuration registered');

      this.emit('api_config:registered', { config: validatedConfig });

    } catch (error) {
      this.logger.error({ error, config }, 'Failed to register API configuration');
      throw error;
    }
  }

  /**
   * Start the API call manager
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    // Register default API configurations
    await this.registerDefaultAPIConfigs();
    
    this.logger.info('API call manager started');
  }

  /**
   * Stop the API call manager
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('API call manager stopped');
  }

  /**
   * Register default API configurations
   */
  private async registerDefaultAPIConfigs(): Promise<void> {
    const defaultConfigs: APICallConfig[] = [
      {
        id: 'openrouter',
        name: 'OpenRouter API',
        baseUrl: 'https://openrouter.ai/api/v1',
        timeout: 30000,
        retries: 3,
        rateLimit: { requests: 100, window: 60 },
        circuitBreaker: { enabled: true, failureThreshold: 5, recoveryTimeout: 60000 },
        cache: { enabled: true, ttl: 300 },
        auth: { type: 'bearer', token: process.env.OPENROUTER_API_KEY },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-Orchestrator/1.0',
        },
      },
      {
        id: 'elevenlabs',
        name: 'ElevenLabs API',
        baseUrl: 'https://api.elevenlabs.io/v1',
        timeout: 60000,
        retries: 2,
        rateLimit: { requests: 50, window: 60 },
        circuitBreaker: { enabled: true, failureThreshold: 3, recoveryTimeout: 120000 },
        cache: { enabled: false },
        auth: { type: 'api_key', apiKey: process.env.ELEVENLABS_API_KEY },
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        id: 'gemini',
        name: 'Google Gemini API',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        timeout: 30000,
        retries: 3,
        rateLimit: { requests: 200, window: 60 },
        circuitBreaker: { enabled: true, failureThreshold: 5, recoveryTimeout: 60000 },
        cache: { enabled: true, ttl: 600 },
        auth: { type: 'api_key', apiKey: process.env.GEMINI_API_KEY },
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        id: 'deepseek',
        name: 'DeepSeek API',
        baseUrl: 'https://api.deepseek.com/v1',
        timeout: 30000,
        retries: 3,
        rateLimit: { requests: 150, window: 60 },
        circuitBreaker: { enabled: true, failureThreshold: 5, recoveryTimeout: 60000 },
        cache: { enabled: true, ttl: 300 },
        auth: { type: 'bearer', token: process.env.DEEPSEEK_API_KEY },
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        id: 'minimax',
        name: 'MiniMax API',
        baseUrl: 'https://api.minimax.chat/v1',
        timeout: 30000,
        retries: 3,
        rateLimit: { requests: 100, window: 60 },
        circuitBreaker: { enabled: true, failureThreshold: 5, recoveryTimeout: 60000 },
        cache: { enabled: true, ttl: 300 },
        auth: { type: 'bearer', token: process.env.MINIMAX_API_KEY },
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        id: 'qwen',
        name: 'Qwen API',
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
        timeout: 30000,
        retries: 3,
        rateLimit: { requests: 100, window: 60 },
        circuitBreaker: { enabled: true, failureThreshold: 5, recoveryTimeout: 60000 },
        cache: { enabled: true, ttl: 300 },
        auth: { type: 'bearer', token: process.env.QWEN_API_KEY },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ];

    for (const config of defaultConfigs) {
      await this.registerAPIConfig(config);
    }
  }

  /**
   * Make an API call
   */
  async makeAPICall(
    configId: string,
    options: APICallOptions = {}
  ): Promise<APICallResult> {
    const config = this.apiConfigs.get(configId);
    if (!config) {
      throw new Error(`API configuration ${configId} not found`);
    }

    const startTime = Date.now();
    const callId = `api_call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Check circuit breaker
      if (config.circuitBreaker?.enabled) {
        const circuitBreaker = this.circuitBreakers.get(configId);
        if (circuitBreaker && !this.isCircuitBreakerOpen(circuitBreaker)) {
          throw new Error(`Circuit breaker is open for ${configId}`);
        }
      }

      // Check rate limit
      if (config.rateLimit) {
        const rateLimiter = this.rateLimiters.get(configId);
        if (rateLimiter && !this.checkRateLimit(rateLimiter, config.rateLimit)) {
          throw new Error(`Rate limit exceeded for ${configId}`);
        }
      }

      // Check cache
      if (config.cache?.enabled && options.cache !== false) {
        const cacheKey = options.cacheKey || this.generateCacheKey(configId, options);
        const cached = await this.context.cacheManager.get(cacheKey, { strategy: 'api' });
        if (cached) {
          return {
            id: callId,
            configId,
            method: options.method || 'GET',
            url: this.buildURL(config, options),
            statusCode: 200,
            success: true,
            responseTime: Date.now() - startTime,
            retryCount: 0,
            response: cached,
            timestamp: new Date(),
            metadata: { cached: true, cacheKey },
          };
        }
      }

      // Make the actual API call
      const result = await this.executeAPICall(config, options, callId, startTime);

      // Update circuit breaker on success
      if (config.circuitBreaker?.enabled) {
        this.updateCircuitBreakerOnSuccess(configId);
      }

      // Update rate limiter
      if (config.rateLimit) {
        this.updateRateLimiter(configId);
      }

      // Cache successful response
      if (config.cache?.enabled && result.success && options.cache !== false) {
        const cacheKey = options.cacheKey || this.generateCacheKey(configId, options);
        await this.context.cacheManager.set(cacheKey, result.response, {
          ttl: options.cacheTTL || config.cache.ttl,
          strategy: 'api',
        });
      }

      // Store result
      this.storeAPICallResult(configId, result);

      // Record metrics
      if (config.monitoring?.enabled !== false) {
        this.context.monitoringSystem.recordMetric(
          'api_call_duration',
          result.responseTime,
          'histogram',
          { configId, method: result.method, status: result.statusCode.toString() }
        );

        this.context.monitoringSystem.recordMetric(
          'api_call_success',
          result.success ? 1 : 0,
          'gauge',
          { configId, method: result.method }
        );
      }

      this.logger.info({
        callId,
        configId,
        method: result.method,
        url: result.url,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        retryCount: result.retryCount,
        success: result.success,
      }, 'API call completed');

      this.emit('api_call:completed', { result });

      return result;

    } catch (error) {
      // Update circuit breaker on failure
      if (config.circuitBreaker?.enabled) {
        this.updateCircuitBreakerOnFailure(configId);
      }

      const result: APICallResult = {
        id: callId,
        configId,
        method: options.method || 'GET',
        url: this.buildURL(config, options),
        statusCode: 0,
        success: false,
        responseTime: Date.now() - startTime,
        retryCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        metadata: { error: error instanceof Error ? error.stack : String(error) },
      };

      this.storeAPICallResult(configId, result);

      this.logger.error({
        callId,
        configId,
        error,
        responseTime: result.responseTime,
      }, 'API call failed');

      this.emit('api_call:failed', { result, error });

      throw error;
    }
  }

  /**
   * Execute API call with retry logic
   */
  private async executeAPICall(
    config: APICallConfig,
    options: APICallOptions,
    callId: string,
    startTime: number
  ): Promise<APICallResult> {
    const maxRetries = options.retries || config.retries;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = this.buildURL(config, options);
        const headers = this.buildHeaders(config, options);
        const timeout = options.timeout || config.timeout;
        
        const response = await this.makeHTTPRequest(
          options.method || 'GET',
          url,
          headers,
          options.body,
          timeout
        );

        return {
          id: callId,
          configId: config.id,
          method: options.method || 'GET',
          url,
          statusCode: response.status,
          success: response.ok,
          responseTime: Date.now() - startTime,
          retryCount: attempt,
          response: response.data,
          headers: response.headers,
          timestamp: new Date(),
          metadata: { attempt, maxRetries },
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          const delay = this.calculateRetryDelay(attempt, config);
          this.logger.debug({
            callId,
            configId: config.id,
            attempt,
            maxRetries,
            delay,
            error: lastError.message,
          }, 'Retrying API call');
          
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('API call failed after all retries');
  }

  /**
   * Make HTTP request
   */
  private async makeHTTPRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body: any,
    timeout: number
  ): Promise<{ status: number; ok: boolean; data: any; headers: Record<string, string> }> {
    // This is a simplified implementation
    // In production, you would use a proper HTTP client like axios or fetch
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json().catch(() => null);
      
      return {
        status: response.status,
        ok: response.ok,
        data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Build URL from config and options
   */
  private buildURL(config: APICallConfig, options: APICallOptions): string {
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const path = options.path || '';
    return `${baseUrl}${path}`;
  }

  /**
   * Build headers from config and options
   */
  private buildHeaders(config: APICallConfig, options: APICallOptions): Record<string, string> {
    const headers = { ...config.headers, ...options.headers };
    
    // Add authentication
    if (config.auth) {
      switch (config.auth.type) {
        case 'bearer':
          if (config.auth.token) {
            headers['Authorization'] = `Bearer ${config.auth.token}`;
          }
          break;
        case 'basic':
          if (config.auth.username && config.auth.password) {
            const credentials = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'api_key':
          if (config.auth.apiKey) {
            headers[config.auth.apiKeyHeader] = config.auth.apiKey;
          }
          break;
      }
    }
    
    return headers;
  }

  /**
   * Calculate retry delay
   */
  private calculateRetryDelay(attempt: number, config: APICallConfig): number {
    const baseDelay = config.retryDelay;
    const maxDelay = config.maxRetryDelay;
    
    switch (config.retryBackoff) {
      case 'exponential':
        return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      case 'linear':
        return Math.min(baseDelay * (attempt + 1), maxDelay);
      case 'fixed':
        return baseDelay;
      default:
        return baseDelay;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(configId: string, options: APICallOptions): string {
    const method = options.method || 'GET';
    const path = options.path || '';
    const bodyHash = options.body ? JSON.stringify(options.body) : '';
    return `api:${configId}:${method}:${path}:${Buffer.from(bodyHash).toString('base64')}`;
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(circuitBreaker: CircuitBreakerState): boolean {
    if (circuitBreaker.state === 'closed') return false;
    
    if (circuitBreaker.state === 'open') {
      if (circuitBreaker.nextAttempt && new Date() >= circuitBreaker.nextAttempt) {
        circuitBreaker.state = 'half-open';
        circuitBreaker.successCount = 0;
        return false;
      }
      return true;
    }
    
    // half-open state
    return false;
  }

  /**
   * Update circuit breaker on success
   */
  private updateCircuitBreakerOnSuccess(configId: string): void {
    const circuitBreaker = this.circuitBreakers.get(configId);
    if (!circuitBreaker) return;
    
    circuitBreaker.successCount++;
    circuitBreaker.failures = 0;
    
    if (circuitBreaker.state === 'half-open' && circuitBreaker.successCount >= 3) {
      circuitBreaker.state = 'closed';
      circuitBreaker.nextAttempt = undefined;
    }
  }

  /**
   * Update circuit breaker on failure
   */
  private updateCircuitBreakerOnFailure(configId: string): void {
    const circuitBreaker = this.circuitBreakers.get(configId);
    if (!circuitBreaker) return;
    
    circuitBreaker.failures++;
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailure = new Date();
    
    const config = this.apiConfigs.get(configId);
    if (config?.circuitBreaker && circuitBreaker.failures >= config.circuitBreaker.failureThreshold) {
      circuitBreaker.state = 'open';
      circuitBreaker.nextAttempt = new Date(Date.now() + config.circuitBreaker.recoveryTimeout);
    }
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(rateLimiter: RateLimiterState, rateLimit: any): boolean {
    const now = new Date();
    const windowMs = rateLimit.window * 1000;
    
    // Reset window if needed
    if (now.getTime() - rateLimiter.windowStart.getTime() >= windowMs) {
      rateLimiter.requests = 0;
      rateLimiter.windowStart = now;
      rateLimiter.burstTokens = rateLimiter.maxBurstTokens;
    }
    
    // Check burst tokens first
    if (rateLimiter.burstTokens > 0) {
      rateLimiter.burstTokens--;
      return true;
    }
    
    // Check regular rate limit
    if (rateLimiter.requests < rateLimit.requests) {
      rateLimiter.requests++;
      return true;
    }
    
    return false;
  }

  /**
   * Update rate limiter
   */
  private updateRateLimiter(configId: string): void {
    const rateLimiter = this.rateLimiters.get(configId);
    if (!rateLimiter) return;
    
    // Rate limiter is updated in checkRateLimit
  }

  /**
   * Store API call result
   */
  private storeAPICallResult(configId: string, result: APICallResult): void {
    const results = this.callResults.get(configId) || [];
    results.push(result);
    
    // Keep only last 1000 results
    if (results.length > 1000) {
      results.splice(0, results.length - 1000);
    }
    
    this.callResults.set(configId, results);
  }

  /**
   * Get API call results history
   */
  getAPICallResults(configId: string): APICallResult[] {
    return this.callResults.get(configId) || [];
  }

  /**
   * Get all API configurations
   */
  getAllAPIConfigs(): APICallConfig[] {
    return Array.from(this.apiConfigs.values());
  }

  /**
   * Get API configuration
   */
  getAPIConfig(configId: string): APICallConfig | undefined {
    return this.apiConfigs.get(configId);
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(configId: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(configId);
  }

  /**
   * Get rate limiter state
   */
  getRateLimiterState(configId: string): RateLimiterState | undefined {
    return this.rateLimiters.get(configId);
  }

  /**
   * Get API call statistics
   */
  getAPICallStatistics(configId?: string): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
    successRate: number;
    circuitBreakerStates: Record<string, string>;
    rateLimiterStates: Record<string, any>;
  } {
    const configs = configId ? [this.apiConfigs.get(configId)].filter(Boolean) : Array.from(this.apiConfigs.values());
    
    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    let totalResponseTime = 0;
    
    const circuitBreakerStates: Record<string, string> = {};
    const rateLimiterStates: Record<string, any> = {};
    
    for (const config of configs) {
      const results = this.callResults.get(config.id) || [];
      
      totalCalls += results.length;
      successfulCalls += results.filter(r => r.success).length;
      failedCalls += results.filter(r => !r.success).length;
      totalResponseTime += results.reduce((sum, r) => sum + r.responseTime, 0);
      
      const circuitBreaker = this.circuitBreakers.get(config.id);
      if (circuitBreaker) {
        circuitBreakerStates[config.id] = circuitBreaker.state;
      }
      
      const rateLimiter = this.rateLimiters.get(config.id);
      if (rateLimiter) {
        rateLimiterStates[config.id] = {
          requests: rateLimiter.requests,
          burstTokens: rateLimiter.burstTokens,
        };
      }
    }
    
    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime: totalCalls > 0 ? totalResponseTime / totalCalls : 0,
      successRate: totalCalls > 0 ? successfulCalls / totalCalls : 0,
      circuitBreakerStates,
      rateLimiterStates,
    };
  }

  /**
   * Reset circuit breaker
   */
  async resetCircuitBreaker(configId: string): Promise<void> {
    const circuitBreaker = this.circuitBreakers.get(configId);
    if (circuitBreaker) {
      circuitBreaker.state = 'closed';
      circuitBreaker.failures = 0;
      circuitBreaker.successCount = 0;
      circuitBreaker.failureCount = 0;
      circuitBreaker.lastFailure = undefined;
      circuitBreaker.nextAttempt = undefined;
      
      this.logger.info({ configId }, 'Circuit breaker reset');
    }
  }

  /**
   * Reset rate limiter
   */
  async resetRateLimiter(configId: string): Promise<void> {
    const rateLimiter = this.rateLimiters.get(configId);
    if (rateLimiter) {
      rateLimiter.requests = 0;
      rateLimiter.windowStart = new Date();
      rateLimiter.burstTokens = rateLimiter.maxBurstTokens;
      
      this.logger.info({ configId }, 'Rate limiter reset');
    }
  }
}