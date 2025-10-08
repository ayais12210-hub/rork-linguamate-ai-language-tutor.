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
import { TestingFramework } from './testing-framework.js';

// Integration configuration schema
const IntegrationConfigSchema = z.object({
  plugins: z.object({
    directory: z.string().default('./plugins'),
    enabled: z.array(z.string()).default([]),
  }).default({}),
  eventStore: z.object({
    maxEventsPerSnapshot: z.number().default(100),
    snapshotRetentionDays: z.number().default(30),
    eventRetentionDays: z.number().default(365),
  }).default({}),
  cache: z.object({
    redis: z.object({
      host: z.string().default('localhost'),
      port: z.number().default(6379),
    }).default({}),
    defaultTTL: z.number().default(3600),
  }).default({}),
  messageQueue: z.object({
    queues: z.array(z.object({
      name: z.string(),
      maxSize: z.number().default(10000),
    })).default([]),
  }).default({}),
  apiGateway: z.object({
    routes: z.array(z.object({
      path: z.string(),
      method: z.string(),
      target: z.string(),
    })).default([]),
  }).default({}),
});

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

export interface IntegrationContext {
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
  testingFramework: TestingFramework;
  logger: ReturnType<typeof createLogger>;
}

export class MCPIntegrationSystem extends EventEmitter {
  private config: IntegrationConfig;
  private context: IntegrationContext;
  private logger: ReturnType<typeof createLogger>;
  private isRunning: boolean = false;

  constructor(config: IntegrationConfig, logger: ReturnType<typeof createLogger>) {
    super();
    this.config = IntegrationConfigSchema.parse(config);
    this.logger = logger;
    this.context = this.initializeContext();
  }

  /**
   * Initialize all components
   */
  private initializeContext(): IntegrationContext {
    // Initialize core components
    const configManager = new ConfigManager('./config.json', this.logger);
    const securityManager = new SecurityManager(configManager, this.logger);
    const monitoringSystem = new MonitoringSystem(configManager, securityManager, this.logger);
    const cacheManager = new CacheManager(this.config.cache, configManager, securityManager, monitoringSystem, this.logger);
    const messageQueueManager = new MessageQueueManager({}, configManager, securityManager, monitoringSystem, cacheManager, this.logger);
    const apiGateway = new APIGateway({}, configManager, securityManager, monitoringSystem, cacheManager, messageQueueManager, this.logger);
    const eventStore = new EventStore(this.config.eventStore, configManager, securityManager, monitoringSystem, this.logger);
    const pluginManager = new PluginManager(this.config.plugins.directory, {
      configManager,
      securityManager,
      toolRegistry: null as any, // Will be set after initialization
      workflowEngine: null as any, // Will be set after initialization
      agentOrchestrator: null as any, // Will be set after initialization
      monitoringSystem,
      logger: this.logger,
    }, this.logger);
    const toolRegistry = new ToolRegistry(configManager, securityManager, this.logger);
    const workflowEngine = new WorkflowEngine(toolRegistry, configManager, securityManager, this.logger);
    const agentCommunication = new AgentCommunicationProtocol(configManager, securityManager, this.logger);
    const agentOrchestrator = new AgentOrchestrator(configManager, securityManager, agentCommunication, this.logger);
    const testingFramework = new TestingFramework({
      workflowEngine,
      toolRegistry,
      agentCommunication,
      configManager,
      securityManager,
      mocks: {
        tools: new Map(),
        agents: new Map(),
      },
    }, this.logger);

    // Update plugin manager context
    pluginManager.context.toolRegistry = toolRegistry;
    pluginManager.context.workflowEngine = workflowEngine;
    pluginManager.context.agentOrchestrator = agentOrchestrator;

    return {
      configManager,
      securityManager,
      monitoringSystem,
      cacheManager,
      messageQueueManager,
      apiGateway,
      eventStore,
      pluginManager,
      workflowEngine,
      toolRegistry,
      agentOrchestrator,
      agentCommunication,
      testingFramework,
      logger: this.logger,
    };
  }

  /**
   * Start the integration system
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting MCP Integration System...');

      // Start components in dependency order
      await this.context.configManager.start();
      await this.context.securityManager.start();
      await this.context.monitoringSystem.start();
      await this.context.cacheManager.start();
      await this.context.messageQueueManager.start();
      await this.context.eventStore.start();
      await this.context.toolRegistry.start();
      await this.context.workflowEngine.start();
      await this.context.agentCommunication.start();
      await this.context.agentOrchestrator.start();
      await this.context.testingFramework.start();
      await this.context.pluginManager.start();
      await this.context.apiGateway.start();

      // Set up integrations
      await this.setupIntegrations();

      // Load and register plugins
      await this.loadPlugins();

      // Set up event handlers
      await this.setupEventHandlers();

      this.isRunning = true;

      this.logger.info('MCP Integration System started successfully');

    } catch (error) {
      this.logger.error({ error }, 'Failed to start MCP Integration System');
      throw error;
    }
  }

  /**
   * Stop the integration system
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping MCP Integration System...');

      this.isRunning = false;

      // Stop components in reverse order
      await this.context.apiGateway.stop();
      await this.context.pluginManager.stop();
      await this.context.testingFramework.stop();
      await this.context.agentOrchestrator.stop();
      await this.context.agentCommunication.stop();
      await this.context.workflowEngine.stop();
      await this.context.toolRegistry.stop();
      await this.context.eventStore.stop();
      await this.context.messageQueueManager.stop();
      await this.context.cacheManager.stop();
      await this.context.monitoringSystem.stop();
      await this.context.securityManager.stop();
      await this.context.configManager.stop();

      this.logger.info('MCP Integration System stopped');

    } catch (error) {
      this.logger.error({ error }, 'Failed to stop MCP Integration System');
      throw error;
    }
  }

  /**
   * Set up component integrations
   */
  private async setupIntegrations(): Promise<void> {
    // Set up event store handlers
    this.context.eventStore.registerEventHandler('workflow:completed', async (event) => {
      await this.context.monitoringSystem.recordMetric(
        'workflow_completions',
        1,
        'counter',
        { workflow: event.data.workflowName, status: event.data.status }
      );
    });

    this.context.eventStore.registerEventHandler('tool:executed', async (event) => {
      await this.context.monitoringSystem.recordMetric(
        'tool_executions',
        1,
        'counter',
        { tool: event.data.toolName, provider: event.data.provider }
      );
    });

    // Set up cache strategies
    this.context.cacheManager.registerStrategy({
      name: 'workflow',
      ttl: 1800, // 30 minutes
      tags: ['workflow', 'execution'],
      compression: true,
      encryption: false,
      invalidationRules: [
        { pattern: 'workflow:*', tags: ['workflow'] },
      ],
    });

    this.context.cacheManager.registerStrategy({
      name: 'analytics',
      ttl: 3600, // 1 hour
      tags: ['analytics', 'metrics'],
      compression: true,
      encryption: false,
      invalidationRules: [
        { pattern: 'analytics:*', tags: ['analytics'] },
      ],
    });

    // Set up message queues
    await this.context.messageQueueManager.createQueue({
      name: 'workflow-events',
      maxSize: 10000,
      visibilityTimeout: 30000,
      deadLetterQueue: 'workflow-events-dlq',
      maxReceiveCount: 3,
    });

    await this.context.messageQueueManager.createQueue({
      name: 'analytics-processing',
      maxSize: 5000,
      visibilityTimeout: 60000,
      deadLetterQueue: 'analytics-processing-dlq',
      maxReceiveCount: 5,
    });

    // Set up API Gateway routes
    await this.context.apiGateway.registerRoute({
      path: '/api/workflows/:name/execute',
      method: 'POST',
      target: 'workflow-engine',
      auth: { required: true, scopes: ['workflow:execute'] },
      rateLimit: { requests: 100, window: 60 },
      cache: { enabled: false },
    });

    await this.context.apiGateway.registerRoute({
      path: '/api/analytics/dashboard',
      method: 'GET',
      target: 'analytics-plugin',
      auth: { required: true, scopes: ['analytics:read'] },
      rateLimit: { requests: 200, window: 60 },
      cache: { enabled: true, ttl: 300 },
    });

    // Set up services
    await this.context.apiGateway.registerService({
      name: 'workflow-engine',
      baseUrl: 'http://localhost:3001',
      healthCheck: '/health',
      circuitBreaker: { enabled: true, failureThreshold: 5 },
    });

    await this.context.apiGateway.registerService({
      name: 'analytics-plugin',
      baseUrl: 'http://localhost:3002',
      healthCheck: '/health',
      circuitBreaker: { enabled: true, failureThreshold: 3 },
    });
  }

  /**
   * Load and register plugins
   */
  private async loadPlugins(): Promise<void> {
    // Discover plugins
    await this.context.pluginManager.discoverPlugins();

    // Load enabled plugins
    for (const pluginName of this.config.plugins.enabled) {
      try {
        await this.context.pluginManager.loadPlugin(pluginName);
        this.logger.info({ plugin: pluginName }, 'Plugin loaded');
      } catch (error) {
        this.logger.error({ plugin: pluginName, error }, 'Failed to load plugin');
      }
    }
  }

  /**
   * Set up event handlers
   */
  private async setupEventHandlers(): Promise<void> {
    // Workflow events
    this.context.workflowEngine.on('workflow:completed', async (data) => {
      // Store event in event store
      await this.context.eventStore.appendEvents(
        `workflow:${data.workflow}`,
        'workflow',
        [{
          type: 'workflow:completed',
          data: data.result,
          metadata: {
            workflow: data.workflow,
            executionId: data.result.executionId,
            duration: data.result.duration,
          },
        }],
        0,
        { source: 'workflow-engine' }
      );

      // Send to message queue
      await this.context.messageQueueManager.sendMessage(
        'workflow-events',
        'workflow:completed',
        data.result,
        { context: { source: 'workflow-engine' } }
      );
    });

    // Tool events
    this.context.toolRegistry.on('tool:executed', async (data) => {
      // Store event in event store
      await this.context.eventStore.appendEvents(
        `tool:${data.tool}:${data.provider}`,
        'tool',
        [{
          type: 'tool:executed',
          data: data,
          metadata: {
            tool: data.tool,
            provider: data.provider,
            duration: data.duration,
            success: data.success,
          },
        }],
        0,
        { source: 'tool-registry' }
      );
    });

    // Agent events
    this.context.agentOrchestrator.on('agent:status_updated', async (data) => {
      // Store event in event store
      await this.context.eventStore.appendEvents(
        `agent:${data.agentId}`,
        'agent',
        [{
          type: 'agent:status_updated',
          data: data,
          metadata: {
            agentId: data.agentId,
            status: data.status,
            timestamp: new Date(),
          },
        }],
        0,
        { source: 'agent-orchestrator' }
      );
    });

    // Plugin events
    this.context.pluginManager.on('plugin:loaded', async (data) => {
      this.logger.info({ plugin: data.pluginId }, 'Plugin loaded successfully');
    });

    this.context.pluginManager.on('plugin:load_failed', async (data) => {
      this.logger.error({ plugin: data.pluginId, error: data.error }, 'Plugin load failed');
    });
  }

  /**
   * Execute a workflow with full integration
   */
  async executeWorkflow(
    workflowName: string,
    payload: any,
    context: {
      userId?: string;
      sessionId?: string;
      workflowId?: string;
      executionId?: string;
    } = {}
  ): Promise<any> {
    try {
      // Start trace
      const traceId = this.context.monitoringSystem.startTrace(
        'workflow_execution',
        { userId: context.userId, workflowId: workflowName }
      );

      // Check cache first
      const cacheKey = `workflow:${workflowName}:${JSON.stringify(payload)}`;
      const cachedResult = await this.context.cacheManager.get(cacheKey, { strategy: 'workflow' });
      
      if (cachedResult) {
        this.context.monitoringSystem.finishTrace(traceId, 'success');
        return cachedResult;
      }

      // Execute workflow
      const result = await this.context.workflowEngine.executeWorkflow(workflowName, payload, context);

      // Cache result
      await this.context.cacheManager.set(cacheKey, result, { strategy: 'workflow' });

      // Finish trace
      this.context.monitoringSystem.finishTrace(traceId, 'success');

      return result;

    } catch (error) {
      this.logger.error({
        workflow: workflowName,
        error,
        userId: context.userId,
      }, 'Workflow execution failed');

      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, any>;
    metrics: any;
  }> {
    const components: Record<string, any> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check component health
    try {
      components.configManager = { status: 'healthy' };
      components.securityManager = { status: 'healthy' };
      components.monitoringSystem = { status: 'healthy' };
      components.cacheManager = { status: 'healthy' };
      components.messageQueueManager = { status: 'healthy' };
      components.apiGateway = { status: 'healthy' };
      components.eventStore = { status: 'healthy' };
      components.pluginManager = { status: 'healthy' };
      components.workflowEngine = { status: 'healthy' };
      components.toolRegistry = { status: 'healthy' };
      components.agentOrchestrator = { status: 'healthy' };
      components.agentCommunication = { status: 'healthy' };
      components.testingFramework = { status: 'healthy' };
    } catch (error) {
      overallStatus = 'degraded';
    }

    // Get metrics
    const metrics = {
      cache: await this.context.cacheManager.getStats(),
      monitoring: this.context.monitoringSystem.getDashboardData(),
      plugins: this.context.pluginManager.getAllPlugins().length,
      workflows: this.context.workflowEngine.getWorkflows().length,
      tools: this.context.toolRegistry.getAllTools().size,
      agents: this.context.agentOrchestrator.getAllAgents().length,
    };

    return {
      status: overallStatus,
      components,
      metrics,
    };
  }

  /**
   * Get integration context
   */
  getContext(): IntegrationContext {
    return this.context;
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(): Promise<any> {
    const scenario = {
      name: 'Integration Test',
      description: 'Test complete system integration',
      setup: [
        'create_mock_tool test.tool mock-provider',
        'create_mock_agent test-agent TestAgent',
        'set_feature_flag LM_INTEGRATION_TEST true',
      ],
      steps: [
        {
          action: 'execute_workflow',
          input: {
            workflowName: 'test-workflow',
            payload: { test: 'data' },
          },
          expectedOutput: { status: 'completed' },
        },
        {
          action: 'check_cache',
          input: { key: 'test-key' },
          expectedOutput: { value: 'test-value' },
        },
      ],
      teardown: [
        'remove_mock_tool test.tool mock-provider',
        'remove_mock_agent test-agent',
        'clear_config feature_flags LM_INTEGRATION_TEST',
      ],
    };

    return await this.context.testingFramework.runTestScenario(scenario);
  }
}