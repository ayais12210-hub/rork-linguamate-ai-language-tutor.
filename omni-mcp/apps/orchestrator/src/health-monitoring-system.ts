import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { MonitoringSystem } from './monitoring-system.js';
import { CacheManager } from './cache-manager.js';
import { MessageQueueManager } from './message-queue-manager.js';
import { APIGateway } from './api-gateway.js';
import { EventStore } from './event-store.js';
import { PluginManager } from './plugin-manager.js';
import { WorkflowEngine } from './workflow-engine.js';
import { ToolRegistry } from './tool-registry.js';
import { AgentOrchestrator } from './agent-orchestrator.js';
import { AgentCommunicationProtocol } from './agent-communication.js';

// Health monitoring schemas
const HealthCheckSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['http', 'tcp', 'database', 'cache', 'queue', 'custom']),
  target: z.string(),
  timeout: z.number().default(5000),
  interval: z.number().default(30000),
  retries: z.number().default(3),
  critical: z.boolean().default(false),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

const HealthStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
  message: z.string().optional(),
  responseTime: z.number().optional(),
  lastChecked: z.date(),
  consecutiveFailures: z.number().default(0),
  lastSuccess: z.date().optional(),
  metadata: z.record(z.any()).default({}),
});

const SystemHealthSchema = z.object({
  overall: z.enum(['healthy', 'degraded', 'critical']),
  components: z.record(z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
    message: z.string().optional(),
    lastChecked: z.date(),
    dependencies: z.array(z.string()).default([]),
  })),
  metrics: z.object({
    uptime: z.number(),
    totalChecks: z.number(),
    healthyChecks: z.number(),
    degradedChecks: z.number(),
    unhealthyChecks: z.number(),
    averageResponseTime: z.number(),
  }),
  alerts: z.array(z.object({
    id: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    component: z.string(),
    timestamp: z.date(),
  })),
  timestamp: z.date(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;
export type SystemHealth = z.infer<typeof SystemHealthSchema>;

export interface HealthCheckContext {
  configManager: ConfigManager;
  securityManager: SecurityManager;
  monitoringSystem: MonitoringSystem;
  cacheManager: CacheManager;
  messageQueueManager: MessageQueueManager;
  apiGateway: APIGateway;
  eventStore: EventStore;
  pluginManager: PluginManager;
  workflowEngine: WorkflowEngine;
  toolRegistry: ToolRegistry;
  agentOrchestrator: AgentOrchestrator;
  agentCommunication: AgentCommunicationProtocol;
  logger: ReturnType<typeof createLogger>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export class HealthMonitoringSystem extends EventEmitter {
  private healthChecks: Map<string, HealthCheck> = new Map();
  private healthStatuses: Map<string, HealthStatus> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private context: HealthCheckContext;
  private logger: ReturnType<typeof createLogger>;
  private isRunning: boolean = false;
  private systemStartTime: Date = new Date();

  constructor(
    context: HealthCheckContext,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.context = context;
    this.logger = logger;
  }

  /**
   * Register a health check
   */
  async registerHealthCheck(check: HealthCheck): Promise<void> {
    try {
      const validatedCheck = HealthCheckSchema.parse(check);
      
      this.healthChecks.set(validatedCheck.id, validatedCheck);
      
      // Initialize status
      this.healthStatuses.set(validatedCheck.id, {
        id: validatedCheck.id,
        status: 'unknown',
        lastChecked: new Date(),
        consecutiveFailures: 0,
        metadata: {},
      });

      this.logger.info({
        checkId: validatedCheck.id,
        name: validatedCheck.name,
        type: validatedCheck.type,
        target: validatedCheck.target,
        critical: validatedCheck.critical,
      }, 'Health check registered');

      this.emit('health_check:registered', { check: validatedCheck });

    } catch (error) {
      this.logger.error({ error, check }, 'Failed to register health check');
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    // Register default health checks
    await this.registerDefaultHealthChecks();
    
    // Start periodic checks
    await this.startPeriodicChecks();
    
    this.logger.info('Health monitoring system started');
  }

  /**
   * Stop health monitoring
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Stop all periodic checks
    for (const interval of this.checkIntervals.values()) {
      clearInterval(interval);
    }
    this.checkIntervals.clear();
    
    this.logger.info('Health monitoring system stopped');
  }

  /**
   * Register default health checks
   */
  private async registerDefaultHealthChecks(): Promise<void> {
    const defaultChecks: HealthCheck[] = [
      {
        id: 'config-manager',
        name: 'Configuration Manager',
        type: 'custom',
        target: 'config-manager',
        critical: true,
        tags: ['core', 'configuration'],
      },
      {
        id: 'security-manager',
        name: 'Security Manager',
        type: 'custom',
        target: 'security-manager',
        critical: true,
        tags: ['core', 'security'],
      },
      {
        id: 'monitoring-system',
        name: 'Monitoring System',
        type: 'custom',
        target: 'monitoring-system',
        critical: true,
        tags: ['core', 'monitoring'],
      },
      {
        id: 'cache-manager',
        name: 'Cache Manager',
        type: 'cache',
        target: 'redis://localhost:6379',
        critical: false,
        tags: ['infrastructure', 'cache'],
      },
      {
        id: 'message-queue',
        name: 'Message Queue',
        type: 'custom',
        target: 'message-queue-manager',
        critical: false,
        tags: ['infrastructure', 'queue'],
      },
      {
        id: 'api-gateway',
        name: 'API Gateway',
        type: 'http',
        target: 'http://localhost:3000/healthz',
        critical: true,
        tags: ['core', 'api'],
      },
      {
        id: 'event-store',
        name: 'Event Store',
        type: 'custom',
        target: 'event-store',
        critical: false,
        tags: ['infrastructure', 'events'],
      },
      {
        id: 'plugin-manager',
        name: 'Plugin Manager',
        type: 'custom',
        target: 'plugin-manager',
        critical: false,
        tags: ['core', 'plugins'],
      },
      {
        id: 'workflow-engine',
        name: 'Workflow Engine',
        type: 'custom',
        target: 'workflow-engine',
        critical: true,
        tags: ['core', 'workflows'],
      },
      {
        id: 'tool-registry',
        name: 'Tool Registry',
        type: 'custom',
        target: 'tool-registry',
        critical: true,
        tags: ['core', 'tools'],
      },
      {
        id: 'agent-orchestrator',
        name: 'Agent Orchestrator',
        type: 'custom',
        target: 'agent-orchestrator',
        critical: true,
        tags: ['core', 'agents'],
      },
      {
        id: 'agent-communication',
        name: 'Agent Communication',
        type: 'custom',
        target: 'agent-communication',
        critical: true,
        tags: ['core', 'communication'],
      },
    ];

    for (const check of defaultChecks) {
      await this.registerHealthCheck(check);
    }
  }

  /**
   * Start periodic health checks
   */
  private async startPeriodicChecks(): Promise<void> {
    for (const [checkId, check] of this.healthChecks) {
      if (check.enabled) {
        const interval = setInterval(async () => {
          try {
            await this.runHealthCheck(checkId);
          } catch (error) {
            this.logger.error({ checkId, error }, 'Health check execution failed');
          }
        }, check.interval);

        this.checkIntervals.set(checkId, interval);
      }
    }
  }

  /**
   * Run a specific health check
   */
  async runHealthCheck(checkId: string): Promise<HealthCheckResult> {
    const check = this.healthChecks.get(checkId);
    if (!check) {
      throw new Error(`Health check ${checkId} not found`);
    }

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      result = await this.executeHealthCheck(check);
      
      // Update status
      const status = this.healthStatuses.get(checkId)!;
      status.status = result.status;
      status.message = result.message;
      status.responseTime = result.responseTime;
      status.lastChecked = new Date();
      status.metadata = result.metadata || {};
      
      if (result.status === 'healthy') {
        status.consecutiveFailures = 0;
        status.lastSuccess = new Date();
      } else {
        status.consecutiveFailures++;
      }

      this.healthStatuses.set(checkId, status);

      // Emit event
      this.emit('health_check:completed', { checkId, result, status });

      // Record metrics
      this.context.monitoringSystem.recordMetric(
        'health_check_duration',
        result.responseTime || 0,
        'histogram',
        { checkId, status: result.status }
      );

      this.context.monitoringSystem.recordMetric(
        'health_check_status',
        result.status === 'healthy' ? 1 : 0,
        'gauge',
        { checkId }
      );

      this.logger.debug({
        checkId,
        status: result.status,
        responseTime: result.responseTime,
        consecutiveFailures: status.consecutiveFailures,
      }, 'Health check completed');

      return result;

    } catch (error) {
      const errorResult: HealthCheckResult = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.stack : String(error) },
      };

      // Update status
      const status = this.healthStatuses.get(checkId)!;
      status.status = errorResult.status;
      status.message = errorResult.message;
      status.responseTime = errorResult.responseTime;
      status.lastChecked = new Date();
      status.consecutiveFailures++;
      status.metadata = errorResult.metadata || {};

      this.healthStatuses.set(checkId, status);

      this.logger.error({
        checkId,
        error,
        consecutiveFailures: status.consecutiveFailures,
      }, 'Health check failed');

      this.emit('health_check:failed', { checkId, error, status });

      return errorResult;
    }
  }

  /**
   * Execute a health check based on its type
   */
  private async executeHealthCheck(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();

    switch (check.type) {
      case 'http':
        return await this.checkHttpEndpoint(check);
      
      case 'tcp':
        return await this.checkTcpEndpoint(check);
      
      case 'database':
        return await this.checkDatabase(check);
      
      case 'cache':
        return await this.checkCache(check);
      
      case 'queue':
        return await this.checkQueue(check);
      
      case 'custom':
        return await this.checkCustomComponent(check);
      
      default:
        throw new Error(`Unsupported health check type: ${check.type}`);
    }
  }

  /**
   * Check HTTP endpoint
   */
  private async checkHttpEndpoint(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(check.target, {
        method: 'GET',
        timeout: check.timeout,
        headers: {
          'User-Agent': 'MCP-Health-Checker/1.0',
        },
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'healthy',
          message: `HTTP ${response.status} OK`,
          responseTime,
          metadata: {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
          },
        };
      } else {
        return {
          status: 'degraded',
          message: `HTTP ${response.status} ${response.statusText}`,
          responseTime,
          metadata: {
            statusCode: response.status,
            statusText: response.statusText,
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'HTTP check failed',
        responseTime: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check TCP endpoint
   */
  private async checkTcpEndpoint(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const [host, port] = check.target.split(':');
      const net = await import('net');
      
      return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
          socket.destroy();
          resolve({
            status: 'unhealthy',
            message: 'Connection timeout',
            responseTime: Date.now() - startTime,
          });
        }, check.timeout);

        socket.connect(parseInt(port), host, () => {
          clearTimeout(timeout);
          socket.destroy();
          resolve({
            status: 'healthy',
            message: 'TCP connection successful',
            responseTime: Date.now() - startTime,
          });
        });

        socket.on('error', (error) => {
          clearTimeout(timeout);
          resolve({
            status: 'unhealthy',
            message: error.message,
            responseTime: Date.now() - startTime,
            metadata: { error: error.message },
          });
        });
      });
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'TCP check failed',
        responseTime: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabase(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // This would be implemented based on the specific database
      // For now, we'll simulate a database check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime: Date.now() - startTime,
        metadata: { database: 'simulated' },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database check failed',
        responseTime: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check cache system
   */
  private async checkCache(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test cache operations
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'health_check_test';
      
      await this.context.cacheManager.set(testKey, testValue, { ttl: 60 });
      const retrieved = await this.context.cacheManager.get(testKey);
      await this.context.cacheManager.del(testKey);
      
      if (retrieved === testValue) {
        return {
          status: 'healthy',
          message: 'Cache operations successful',
          responseTime: Date.now() - startTime,
          metadata: { testKey, testValue },
        };
      } else {
        return {
          status: 'degraded',
          message: 'Cache operations inconsistent',
          responseTime: Date.now() - startTime,
          metadata: { expected: testValue, actual: retrieved },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Cache check failed',
        responseTime: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check message queue
   */
  private async checkQueue(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Test queue operations
      const testQueue = 'health_check_test';
      const testMessage = { test: 'health_check', timestamp: Date.now() };
      
      await this.context.messageQueueManager.createQueue({
        name: testQueue,
        maxSize: 10,
      });
      
      await this.context.messageQueueManager.sendMessage(
        testQueue,
        'test',
        testMessage
      );
      
      const messages = await this.context.messageQueueManager.receiveMessages(
        testQueue,
        { maxMessages: 1 }
      );
      
      if (messages.length > 0) {
        await this.context.messageQueueManager.acknowledgeMessage(
          testQueue,
          messages[0].id
        );
      }
      
      await this.context.messageQueueManager.deleteQueue(testQueue);
      
      return {
        status: 'healthy',
        message: 'Queue operations successful',
        responseTime: Date.now() - startTime,
        metadata: { testQueue, messageCount: messages.length },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Queue check failed',
        responseTime: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Check custom component
   */
  private async checkCustomComponent(check: HealthCheck): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      let component: any;
      
      switch (check.target) {
        case 'config-manager':
          component = this.context.configManager;
          break;
        case 'security-manager':
          component = this.context.securityManager;
          break;
        case 'monitoring-system':
          component = this.context.monitoringSystem;
          break;
        case 'message-queue-manager':
          component = this.context.messageQueueManager;
          break;
        case 'api-gateway':
          component = this.context.apiGateway;
          break;
        case 'event-store':
          component = this.context.eventStore;
          break;
        case 'plugin-manager':
          component = this.context.pluginManager;
          break;
        case 'workflow-engine':
          component = this.context.workflowEngine;
          break;
        case 'tool-registry':
          component = this.context.toolRegistry;
          break;
        case 'agent-orchestrator':
          component = this.context.agentOrchestrator;
          break;
        case 'agent-communication':
          component = this.context.agentCommunication;
          break;
        default:
          throw new Error(`Unknown component: ${check.target}`);
      }

      // Check if component has health check method
      if (typeof component.getHealthStatus === 'function') {
        const healthStatus = component.getHealthStatus();
        return {
          status: healthStatus.status || 'healthy',
          message: healthStatus.message,
          responseTime: Date.now() - startTime,
          metadata: healthStatus.metadata || {},
        };
      }

      // Default health check - just verify component exists
      return {
        status: 'healthy',
        message: `${check.target} component is running`,
        responseTime: Date.now() - startTime,
        metadata: { component: check.target },
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Custom component check failed',
        responseTime: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Get system health overview
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const components: Record<string, any> = {};
    const alerts: Array<{ id: string; severity: string; message: string; component: string; timestamp: Date }> = [];
    
    let totalChecks = 0;
    let healthyChecks = 0;
    let degradedChecks = 0;
    let unhealthyChecks = 0;
    let totalResponseTime = 0;

    for (const [checkId, status] of this.healthStatuses) {
      const check = this.healthChecks.get(checkId);
      if (!check) continue;

      components[checkId] = {
        status: status.status,
        message: status.message,
        lastChecked: status.lastChecked,
        dependencies: check.tags,
      };

      totalChecks++;
      if (status.responseTime) {
        totalResponseTime += status.responseTime;
      }

      switch (status.status) {
        case 'healthy':
          healthyChecks++;
          break;
        case 'degraded':
          degradedChecks++;
          if (check.critical) {
            alerts.push({
              id: `degraded_${checkId}`,
              severity: 'medium',
              message: `Critical component ${check.name} is degraded: ${status.message}`,
              component: checkId,
              timestamp: status.lastChecked,
            });
          }
          break;
        case 'unhealthy':
          unhealthyChecks++;
          alerts.push({
            id: `unhealthy_${checkId}`,
            severity: check.critical ? 'critical' : 'high',
            message: `${check.critical ? 'Critical' : 'Component'} ${check.name} is unhealthy: ${status.message}`,
            component: checkId,
            timestamp: status.lastChecked,
          });
          break;
      }
    }

    // Determine overall system health
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (unhealthyChecks > 0) {
      // Check if any critical components are unhealthy
      const criticalUnhealthy = Array.from(this.healthChecks.values())
        .filter(check => check.critical)
        .some(check => {
          const status = this.healthStatuses.get(check.id);
          return status?.status === 'unhealthy';
        });
      
      overall = criticalUnhealthy ? 'critical' : 'degraded';
    } else if (degradedChecks > 0) {
      overall = 'degraded';
    }

    const uptime = Date.now() - this.systemStartTime.getTime();
    const averageResponseTime = totalChecks > 0 ? totalResponseTime / totalChecks : 0;

    return {
      overall,
      components,
      metrics: {
        uptime,
        totalChecks,
        healthyChecks,
        degradedChecks,
        unhealthyChecks,
        averageResponseTime,
      },
      alerts,
      timestamp: new Date(),
    };
  }

  /**
   * Get health check status
   */
  getHealthCheckStatus(checkId: string): HealthStatus | undefined {
    return this.healthStatuses.get(checkId);
  }

  /**
   * Get all health check statuses
   */
  getAllHealthCheckStatuses(): HealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  /**
   * Get health checks by tag
   */
  getHealthChecksByTag(tag: string): HealthCheck[] {
    return Array.from(this.healthChecks.values()).filter(check => check.tags.includes(tag));
  }

  /**
   * Enable/disable health check
   */
  async toggleHealthCheck(checkId: string, enabled: boolean): Promise<void> {
    const check = this.healthChecks.get(checkId);
    if (!check) {
      throw new Error(`Health check ${checkId} not found`);
    }

    check.enabled = enabled;

    if (enabled) {
      // Start periodic check
      const interval = setInterval(async () => {
        try {
          await this.runHealthCheck(checkId);
        } catch (error) {
          this.logger.error({ checkId, error }, 'Health check execution failed');
        }
      }, check.interval);

      this.checkIntervals.set(checkId, interval);
    } else {
      // Stop periodic check
      const interval = this.checkIntervals.get(checkId);
      if (interval) {
        clearInterval(interval);
        this.checkIntervals.delete(checkId);
      }
    }

    this.logger.info({ checkId, enabled }, 'Health check toggled');
  }

  /**
   * Run all health checks
   */
  async runAllHealthChecks(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();

    for (const checkId of this.healthChecks.keys()) {
      try {
        const result = await this.runHealthCheck(checkId);
        results.set(checkId, result);
      } catch (error) {
        this.logger.error({ checkId, error }, 'Health check failed');
        results.set(checkId, {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}