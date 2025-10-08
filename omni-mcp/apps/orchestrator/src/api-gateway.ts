import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { MonitoringSystem } from './monitoring-system.js';
import { CacheManager } from './cache-manager.js';
import { MessageQueueManager } from './message-queue-manager.js';

// API Gateway schemas
const RouteConfigSchema = z.object({
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']),
  target: z.string(), // Service or URL
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  rateLimit: z.object({
    requests: z.number(),
    window: z.number(), // seconds
    burst: z.number().optional(),
  }).optional(),
  auth: z.object({
    required: z.boolean().default(false),
    scopes: z.array(z.string()).default([]),
    roles: z.array(z.string()).default([]),
  }).optional(),
  middleware: z.array(z.string()).default([]),
  cors: z.object({
    enabled: z.boolean().default(true),
    origins: z.array(z.string()).default(['*']),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE']),
    headers: z.array(z.string()).default(['Content-Type', 'Authorization']),
  }).optional(),
  cache: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().default(300),
    key: z.string().optional(),
    vary: z.array(z.string()).default([]),
  }).optional(),
  transform: z.object({
    request: z.record(z.any()).optional(),
    response: z.record(z.any()).optional(),
  }).optional(),
});

const ServiceConfigSchema = z.object({
  name: z.string(),
  baseUrl: z.string(),
  healthCheck: z.string().optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  circuitBreaker: z.object({
    enabled: z.boolean().default(true),
    failureThreshold: z.number().default(5),
    recoveryTimeout: z.number().default(30000),
    halfOpenMaxCalls: z.number().default(3),
  }).optional(),
  loadBalancer: z.object({
    strategy: z.enum(['round-robin', 'least-connections', 'random', 'weighted']).default('round-robin'),
    weights: z.record(z.number()).optional(),
  }).optional(),
});

const RateLimitConfigSchema = z.object({
  key: z.string(), // IP, user, or custom key
  requests: z.number(),
  window: z.number(),
  burst: z.number().optional(),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
});

export type RouteConfig = z.infer<typeof RouteConfigSchema>;
export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

export interface GatewayContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  startTime: Date;
  route?: RouteConfig;
  service?: ServiceConfig;
}

export interface Middleware {
  name: string;
  execute(context: GatewayContext, next: () => Promise<any>): Promise<any>;
}

export interface LoadBalancer {
  selectService(services: ServiceConfig[]): ServiceConfig;
}

export class APIGateway extends EventEmitter {
  private routes: Map<string, RouteConfig> = new Map(); // method:path -> route
  private services: Map<string, ServiceConfig> = new Map(); // service name -> config
  private middleware: Map<string, Middleware> = new Map();
  private loadBalancers: Map<string, LoadBalancer> = new Map();
  private rateLimiters: Map<string, Map<string, { count: number; resetTime: number }>> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; state: 'closed' | 'open' | 'half-open' }> = new Map();
  private config: any;
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private monitoringSystem: MonitoringSystem;
  private cacheManager: CacheManager;
  private messageQueueManager: MessageQueueManager;
  private isRunning: boolean = false;

  constructor(
    config: any,
    configManager: ConfigManager,
    securityManager: SecurityManager,
    monitoringSystem: MonitoringSystem,
    cacheManager: CacheManager,
    messageQueueManager: MessageQueueManager,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.config = config;
    this.configManager = configManager;
    this.securityManager = securityManager;
    this.monitoringSystem = monitoringSystem;
    this.cacheManager = cacheManager;
    this.messageQueueManager = messageQueueManager;
    this.logger = logger;
  }

  /**
   * Register a route
   */
  async registerRoute(config: RouteConfig): Promise<void> {
    try {
      const validatedConfig = RouteConfigSchema.parse(config);
      const routeKey = `${validatedConfig.method}:${validatedConfig.path}`;
      
      this.routes.set(routeKey, validatedConfig);

      this.logger.info({
        path: validatedConfig.path,
        method: validatedConfig.method,
        target: validatedConfig.target,
        auth: validatedConfig.auth?.required || false,
        rateLimit: validatedConfig.rateLimit?.requests || 'none',
      }, 'Route registered');

      this.emit('route:registered', { route: validatedConfig });

    } catch (error) {
      this.logger.error({ error, config }, 'Failed to register route');
      throw error;
    }
  }

  /**
   * Register a service
   */
  async registerService(config: ServiceConfig): Promise<void> {
    try {
      const validatedConfig = ServiceConfigSchema.parse(config);
      
      this.services.set(validatedConfig.name, validatedConfig);

      // Initialize circuit breaker
      this.circuitBreakers.set(validatedConfig.name, {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
      });

      this.logger.info({
        name: validatedConfig.name,
        baseUrl: validatedConfig.baseUrl,
        circuitBreaker: validatedConfig.circuitBreaker?.enabled || false,
      }, 'Service registered');

      this.emit('service:registered', { service: validatedConfig });

    } catch (error) {
      this.logger.error({ error, config }, 'Failed to register service');
      throw error;
    }
  }

  /**
   * Register middleware
   */
  registerMiddleware(middleware: Middleware): void {
    this.middleware.set(middleware.name, middleware);

    this.logger.info({ name: middleware.name }, 'Middleware registered');

    this.emit('middleware:registered', { middleware });
  }

  /**
   * Process HTTP request
   */
  async processRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body: any,
    query: Record<string, string>,
    context: Partial<GatewayContext> = {}
  ): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: any;
  }> {
    const requestId = this.generateRequestId();
    const startTime = new Date();
    
    const gatewayContext: GatewayContext = {
      ...context,
      requestId,
      startTime,
      ipAddress: headers['x-forwarded-for'] || headers['x-real-ip'],
      userAgent: headers['user-agent'],
    };

    try {
      // Find route
      const route = this.findRoute(method, path);
      if (!route) {
        return this.createErrorResponse(404, 'Route not found');
      }

      gatewayContext.route = route;

      // Check rate limiting
      const rateLimitResult = await this.checkRateLimit(route, gatewayContext);
      if (!rateLimitResult.allowed) {
        return this.createErrorResponse(429, 'Rate limit exceeded', {
          'X-RateLimit-Limit': rateLimitResult.limit?.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString(),
        });
      }

      // Check authentication
      if (route.auth?.required) {
        const authResult = await this.checkAuthentication(route, headers, gatewayContext);
        if (!authResult.authenticated) {
          return this.createErrorResponse(401, 'Authentication required');
        }
        gatewayContext.userId = authResult.userId;
        gatewayContext.sessionId = authResult.sessionId;
      }

      // Check cache
      if (route.cache?.enabled && method === 'GET') {
        const cacheKey = this.generateCacheKey(route, query, headers);
        const cachedResponse = await this.cacheManager.get(cacheKey);
        if (cachedResponse) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              'X-Cache-Key': cacheKey,
            },
            body: cachedResponse,
          };
        }
      }

      // Execute middleware chain
      const response = await this.executeMiddlewareChain(route, gatewayContext, async () => {
        return await this.forwardRequest(route, headers, body, query, gatewayContext);
      });

      // Cache response if enabled
      if (route.cache?.enabled && response.statusCode === 200) {
        const cacheKey = this.generateCacheKey(route, query, headers);
        await this.cacheManager.set(cacheKey, response.body, {
          ttl: route.cache.ttl,
          tags: ['api', 'response'],
        });
      }

      // Record metrics
      this.monitoringSystem.recordMetric(
        'api_requests',
        1,
        'counter',
        {
          method,
          path: route.path,
          status: response.statusCode.toString(),
          service: route.target,
        }
      );

      this.monitoringSystem.recordHistogram(
        'api_response_time',
        Date.now() - startTime.getTime(),
        { method, path: route.path, service: route.target }
      );

      this.logger.info({
        requestId,
        method,
        path,
        statusCode: response.statusCode,
        duration: Date.now() - startTime.getTime(),
        userId: gatewayContext.userId,
      }, 'Request processed');

      return response;

    } catch (error) {
      this.logger.error({
        requestId,
        method,
        path,
        error,
      }, 'Request processing failed');

      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  /**
   * Find route for request
   */
  private findRoute(method: string, path: string): RouteConfig | null {
    const routeKey = `${method}:${path}`;
    return this.routes.get(routeKey) || null;
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(
    route: RouteConfig,
    context: GatewayContext
  ): Promise<{ allowed: boolean; limit?: number; remaining?: number; resetTime?: number }> {
    if (!route.rateLimit) {
      return { allowed: true };
    }

    const key = context.ipAddress || 'unknown';
    const now = Date.now();
    const windowMs = route.rateLimit.window * 1000;

    if (!this.rateLimiters.has(route.path)) {
      this.rateLimiters.set(route.path, new Map());
    }

    const limiter = this.rateLimiters.get(route.path)!;
    const current = limiter.get(key);

    if (!current || now > current.resetTime) {
      // Reset window
      limiter.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        allowed: true,
        limit: route.rateLimit.requests,
        remaining: route.rateLimit.requests - 1,
        resetTime: Math.floor((now + windowMs) / 1000),
      };
    }

    if (current.count >= route.rateLimit.requests) {
      return {
        allowed: false,
        limit: route.rateLimit.requests,
        remaining: 0,
        resetTime: Math.floor(current.resetTime / 1000),
      };
    }

    current.count++;
    return {
      allowed: true,
      limit: route.rateLimit.requests,
      remaining: route.rateLimit.requests - current.count,
      resetTime: Math.floor(current.resetTime / 1000),
    };
  }

  /**
   * Check authentication
   */
  private async checkAuthentication(
    route: RouteConfig,
    headers: Record<string, string>,
    context: GatewayContext
  ): Promise<{ authenticated: boolean; userId?: string; sessionId?: string }> {
    try {
      const authHeader = headers['authorization'];
      if (!authHeader) {
        return { authenticated: false };
      }

      const token = authHeader.replace('Bearer ', '');
      const authResult = await this.securityManager.authenticate(
        { token },
        { ipAddress: context.ipAddress, userAgent: context.userAgent }
      );

      if (!authResult.success || !authResult.user) {
        return { authenticated: false };
      }

      // Check scopes and roles
      if (route.auth?.scopes && route.auth.scopes.length > 0) {
        const hasScope = await this.securityManager.checkPermission(
          authResult.user.id,
          'api',
          'access',
          { scopes: route.auth.scopes }
        );
        if (!hasScope.allowed) {
          return { authenticated: false };
        }
      }

      if (route.auth?.roles && route.auth.roles.length > 0) {
        const userRoles = authResult.user.roles;
        const hasRole = route.auth.roles.some(role => userRoles.includes(role));
        if (!hasRole) {
          return { authenticated: false };
        }
      }

      return {
        authenticated: true,
        userId: authResult.user.id,
        sessionId: authResult.session?.id,
      };

    } catch (error) {
      this.logger.error({ error }, 'Authentication check failed');
      return { authenticated: false };
    }
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddlewareChain(
    route: RouteConfig,
    context: GatewayContext,
    finalHandler: () => Promise<any>
  ): Promise<any> {
    const middlewareNames = route.middleware || [];
    let index = 0;

    const next = async (): Promise<any> => {
      if (index >= middlewareNames.length) {
        return await finalHandler();
      }

      const middlewareName = middlewareNames[index++];
      const middleware = this.middleware.get(middlewareName);
      
      if (!middleware) {
        throw new Error(`Middleware ${middlewareName} not found`);
      }

      return await middleware.execute(context, next);
    };

    return await next();
  }

  /**
   * Forward request to target service
   */
  private async forwardRequest(
    route: RouteConfig,
    headers: Record<string, string>,
    body: any,
    query: Record<string, string>,
    context: GatewayContext
  ): Promise<{ statusCode: number; headers: Record<string, string>; body: any }> {
    try {
      // Find service
      const service = this.services.get(route.target);
      if (!service) {
        throw new Error(`Service ${route.target} not found`);
      }

      context.service = service;

      // Check circuit breaker
      const circuitBreaker = this.circuitBreakers.get(route.target);
      if (circuitBreaker?.state === 'open') {
        const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure;
        if (timeSinceLastFailure < (service.circuitBreaker?.recoveryTimeout || 30000)) {
          throw new Error('Circuit breaker is open');
        }
        circuitBreaker.state = 'half-open';
      }

      // Make request
      const response = await this.makeHttpRequest(service, route, headers, body, query);

      // Reset circuit breaker on success
      if (circuitBreaker) {
        circuitBreaker.failures = 0;
        circuitBreaker.state = 'closed';
      }

      return response;

    } catch (error) {
      // Update circuit breaker on failure
      const circuitBreaker = this.circuitBreakers.get(route.target);
      if (circuitBreaker) {
        circuitBreaker.failures++;
        circuitBreaker.lastFailure = Date.now();
        
        if (circuitBreaker.failures >= (service?.circuitBreaker?.failureThreshold || 5)) {
          circuitBreaker.state = 'open';
        }
      }

      throw error;
    }
  }

  /**
   * Make HTTP request to service
   */
  private async makeHttpRequest(
    service: ServiceConfig,
    route: RouteConfig,
    headers: Record<string, string>,
    body: any,
    query: Record<string, string>
  ): Promise<{ statusCode: number; headers: Record<string, string>; body: any }> {
    // This is a simplified implementation
    // In a real implementation, you would use a proper HTTP client like axios or fetch
    
    const url = new URL(route.path, service.baseUrl);
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const requestOptions = {
      method: route.method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      timeout: route.timeout,
    };

    // Simulate HTTP request
    // In reality, you would make an actual HTTP request here
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: { message: 'Request forwarded successfully' },
    };
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    route: RouteConfig,
    query: Record<string, string>,
    headers: Record<string, string>
  ): string {
    const keyParts = [
      route.path,
      JSON.stringify(query),
      route.cache?.vary?.map(header => headers[header]).join(':') || '',
    ];
    
    return `api:${route.cache?.key || route.path}:${keyParts.join(':')}`;
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    statusCode: number,
    message: string,
    additionalHeaders: Record<string, string> = {}
  ): { statusCode: number; headers: Record<string, string>; body: any } {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...additionalHeaders,
      },
      body: {
        error: {
          code: statusCode,
          message,
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get gateway statistics
   */
  getStatistics(): {
    routes: number;
    services: number;
    middleware: number;
    circuitBreakers: Record<string, any>;
  } {
    const circuitBreakers: Record<string, any> = {};
    for (const [serviceName, breaker] of this.circuitBreakers) {
      circuitBreakers[serviceName] = breaker;
    }

    return {
      routes: this.routes.size,
      services: this.services.size,
      middleware: this.middleware.size,
      circuitBreakers,
    };
  }

  /**
   * Start the API gateway
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    // Register default middleware
    this.registerDefaultMiddleware();
    
    this.logger.info('API Gateway started');
  }

  /**
   * Register default middleware
   */
  private registerDefaultMiddleware(): void {
    // CORS middleware
    this.registerMiddleware({
      name: 'cors',
      execute: async (context, next) => {
        const route = context.route;
        if (route?.cors?.enabled) {
          // Add CORS headers
          // Implementation would add appropriate CORS headers
        }
        return await next();
      },
    });

    // Logging middleware
    this.registerMiddleware({
      name: 'logging',
      execute: async (context, next) => {
        this.logger.info({
          requestId: context.requestId,
          method: context.route?.method,
          path: context.route?.path,
          userId: context.userId,
        }, 'Request started');
        
        const result = await next();
        
        this.logger.info({
          requestId: context.requestId,
          duration: Date.now() - context.startTime.getTime(),
        }, 'Request completed');
        
        return result;
      },
    });
  }

  /**
   * Stop the API gateway
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('API Gateway stopped');
  }
}