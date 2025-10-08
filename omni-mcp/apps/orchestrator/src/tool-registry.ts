import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';

// Tool interface schemas
const ToolInputSchema = z.record(z.any());
const ToolOutputSchema = z.record(z.any());

const ToolMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string().default('1.0.0'),
  provider: z.string(),
  category: z.enum(['ai', 'data', 'communication', 'storage', 'monitoring', 'security', 'utility']),
  tags: z.array(z.string()).default([]),
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
  rateLimits: z.object({
    rps: z.number().default(10),
    burst: z.number().default(20),
  }).optional(),
  timeout: z.number().default(30000),
  retryable: z.boolean().default(true),
  requiresAuth: z.boolean().default(false),
  scopes: z.array(z.string()).default([]),
});

const ToolCapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
  inputTypes: z.array(z.string()),
  outputTypes: z.array(z.string()),
  supportedProviders: z.array(z.string()),
});

export type ToolMetadata = z.infer<typeof ToolMetadataSchema>;
export type ToolCapability = z.infer<typeof ToolCapabilitySchema>;
export type ToolInput = z.infer<typeof ToolInputSchema>;
export type ToolOutput = z.infer<typeof ToolOutputSchema>;

export interface ToolExecutionContext {
  workflowId?: string;
  executionId?: string;
  userId?: string;
  sessionId?: string;
  requestId: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface ToolExecutionResult {
  success: boolean;
  output?: ToolOutput;
  error?: Error;
  duration: number;
  metadata: {
    tool: string;
    provider: string;
    requestId: string;
    timestamp: Date;
    retryCount?: number;
  };
}

export interface Tool {
  metadata: ToolMetadata;
  capabilities: ToolCapability[];
  execute(input: ToolInput, context: ToolExecutionContext): Promise<ToolOutput>;
  healthCheck(): Promise<boolean>;
  validate(input: ToolInput): { valid: boolean; errors: string[] };
}

export interface ToolProvider {
  name: string;
  description: string;
  version: string;
  capabilities: ToolCapability[];
  tools: Map<string, Tool>;
  initialize(config: any): Promise<void>;
  healthCheck(): Promise<boolean>;
  shutdown(): Promise<void>;
}

export class ToolRegistry extends EventEmitter {
  private tools: Map<string, Map<string, Tool>> = new Map(); // toolName -> provider -> Tool
  private providers: Map<string, ToolProvider> = new Map();
  private capabilities: Map<string, ToolCapability[]> = new Map();
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private executionMetrics: Map<string, { count: number; totalDuration: number; errors: number }> = new Map();

  constructor(
    configManager: ConfigManager,
    securityManager: SecurityManager,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.configManager = configManager;
    this.securityManager = securityManager;
    this.logger = logger;
  }

  /**
   * Register a tool provider
   */
  async registerProvider(provider: ToolProvider): Promise<void> {
    try {
      await provider.initialize(this.configManager.getProviderConfig(provider.name));
      
      this.providers.set(provider.name, provider);
      
      // Register all tools from the provider
      for (const [toolName, tool] of provider.tools) {
        await this.registerTool(toolName, provider.name, tool);
      }

      // Register capabilities
      this.capabilities.set(provider.name, provider.capabilities);

      this.logger.info({
        provider: provider.name,
        version: provider.version,
        tools: provider.tools.size,
        capabilities: provider.capabilities.length,
      }, 'Tool provider registered');

      this.emit('provider:registered', { provider: provider.name });
    } catch (error) {
      this.logger.error({ error, provider: provider.name }, 'Failed to register tool provider');
      throw error;
    }
  }

  /**
   * Register a tool
   */
  async registerTool(toolName: string, providerName: string, tool: Tool): Promise<void> {
    try {
      // Validate tool metadata
      const metadata = ToolMetadataSchema.parse(tool.metadata);
      
      // Ensure provider exists
      if (!this.providers.has(providerName)) {
        throw new Error(`Provider ${providerName} not registered`);
      }

      // Initialize tool map for this tool name if it doesn't exist
      if (!this.tools.has(toolName)) {
        this.tools.set(toolName, new Map());
      }

      const toolMap = this.tools.get(toolName)!;
      toolMap.set(providerName, tool);

      // Initialize execution metrics
      const metricKey = `${toolName}:${providerName}`;
      this.executionMetrics.set(metricKey, { count: 0, totalDuration: 0, errors: 0 });

      this.logger.info({
        tool: toolName,
        provider: providerName,
        category: metadata.category,
        capabilities: tool.capabilities.length,
      }, 'Tool registered');

      this.emit('tool:registered', { tool: toolName, provider: providerName });
    } catch (error) {
      this.logger.error({ error, tool: toolName, provider: providerName }, 'Failed to register tool');
      throw error;
    }
  }

  /**
   * Get a tool by name and provider
   */
  getTool(toolName: string, providerName?: string): Tool | null {
    const toolMap = this.tools.get(toolName);
    if (!toolMap) {
      return null;
    }

    if (providerName) {
      return toolMap.get(providerName) || null;
    }

    // Return the first available tool if no provider specified
    return toolMap.values().next().value || null;
  }

  /**
   * Get all tools for a given name
   */
  getTools(toolName: string): Map<string, Tool> {
    return this.tools.get(toolName) || new Map();
  }

  /**
   * Get all available tools
   */
  getAllTools(): Map<string, Map<string, Tool>> {
    return new Map(this.tools);
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolName: string,
    providerName: string,
    input: ToolInput,
    context: Partial<ToolExecutionContext> = {}
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    const executionContext: ToolExecutionContext = {
      requestId,
      timestamp: new Date(),
      metadata: {},
      ...context,
    };

    const tool = this.getTool(toolName, providerName);
    if (!tool) {
      const error = new Error(`Tool ${toolName} not found for provider ${providerName}`);
      return {
        success: false,
        error,
        duration: Date.now() - startTime,
        metadata: {
          tool: toolName,
          provider: providerName,
          requestId,
          timestamp: executionContext.timestamp,
        },
      };
    }

    try {
      // Validate input
      const validation = tool.validate(input);
      if (!validation.valid) {
        const error = new Error(`Invalid input: ${validation.errors.join(', ')}`);
        return {
          success: false,
          error,
          duration: Date.now() - startTime,
          metadata: {
            tool: toolName,
            provider: providerName,
            requestId,
            timestamp: executionContext.timestamp,
          },
        };
      }

      // Check security permissions
      if (tool.metadata.requiresAuth) {
        const hasPermission = await this.securityManager.checkToolPermission(
          toolName,
          providerName,
          executionContext.userId,
          executionContext.sessionId
        );
        
        if (!hasPermission) {
          const error = new Error('Insufficient permissions to execute tool');
          return {
            success: false,
            error,
            duration: Date.now() - startTime,
            metadata: {
              tool: toolName,
              provider: providerName,
              requestId,
              timestamp: executionContext.timestamp,
            },
          };
        }
      }

      // Execute tool
      const output = await tool.execute(input, executionContext);
      const duration = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(toolName, providerName, duration, false);

      this.logger.info({
        tool: toolName,
        provider: providerName,
        requestId,
        duration,
        userId: executionContext.userId,
        sessionId: executionContext.sessionId,
      }, 'Tool executed successfully');

      this.emit('tool:executed', {
        tool: toolName,
        provider: providerName,
        requestId,
        duration,
        success: true,
      });

      return {
        success: true,
        output,
        duration,
        metadata: {
          tool: toolName,
          provider: providerName,
          requestId,
          timestamp: executionContext.timestamp,
        },
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Update metrics
      this.updateMetrics(toolName, providerName, duration, true);

      this.logger.error({
        tool: toolName,
        provider: providerName,
        requestId,
        duration,
        error,
        userId: executionContext.userId,
        sessionId: executionContext.sessionId,
      }, 'Tool execution failed');

      this.emit('tool:executed', {
        tool: toolName,
        provider: providerName,
        requestId,
        duration,
        success: false,
        error,
      });

      return {
        success: false,
        error: error as Error,
        duration,
        metadata: {
          tool: toolName,
          provider: providerName,
          requestId,
          timestamp: executionContext.timestamp,
        },
      };
    }
  }

  /**
   * Find tools by capability
   */
  findToolsByCapability(capabilityName: string): Array<{ tool: string; provider: string; capability: ToolCapability }> {
    const results: Array<{ tool: string; provider: string; capability: ToolCapability }> = [];

    for (const [toolName, toolMap] of this.tools) {
      for (const [providerName, tool] of toolMap) {
        const capability = tool.capabilities.find(cap => cap.name === capabilityName);
        if (capability) {
          results.push({ tool: toolName, provider: providerName, capability });
        }
      }
    }

    return results;
  }

  /**
   * Find tools by category
   */
  findToolsByCategory(category: string): Array<{ tool: string; provider: string; metadata: ToolMetadata }> {
    const results: Array<{ tool: string; provider: string; metadata: ToolMetadata }> = [];

    for (const [toolName, toolMap] of this.tools) {
      for (const [providerName, tool] of toolMap) {
        if (tool.metadata.category === category) {
          results.push({ tool: toolName, provider: providerName, metadata: tool.metadata });
        }
      }
    }

    return results;
  }

  /**
   * Get tool health status
   */
  async getToolHealth(toolName: string, providerName: string): Promise<boolean> {
    const tool = this.getTool(toolName, providerName);
    if (!tool) {
      return false;
    }

    try {
      return await tool.healthCheck();
    } catch (error) {
      this.logger.warn({ tool: toolName, provider: providerName, error }, 'Tool health check failed');
      return false;
    }
  }

  /**
   * Get all tool health statuses
   */
  async getAllToolHealth(): Promise<Record<string, Record<string, boolean>>> {
    const health: Record<string, Record<string, boolean>> = {};

    for (const [toolName, toolMap] of this.tools) {
      health[toolName] = {};
      
      for (const [providerName, tool] of toolMap) {
        try {
          health[toolName][providerName] = await tool.healthCheck();
        } catch (error) {
          health[toolName][providerName] = false;
        }
      }
    }

    return health;
  }

  /**
   * Get execution metrics
   */
  getMetrics(): Record<string, { count: number; avgDuration: number; errorRate: number }> {
    const metrics: Record<string, { count: number; avgDuration: number; errorRate: number }> = {};

    for (const [key, data] of this.executionMetrics) {
      metrics[key] = {
        count: data.count,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
        errorRate: data.count > 0 ? data.errors / data.count : 0,
      };
    }

    return metrics;
  }

  /**
   * Update execution metrics
   */
  private updateMetrics(toolName: string, providerName: string, duration: number, isError: boolean): void {
    const key = `${toolName}:${providerName}`;
    const metrics = this.executionMetrics.get(key);
    
    if (metrics) {
      metrics.count++;
      metrics.totalDuration += duration;
      if (isError) {
        metrics.errors++;
      }
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the tool registry
   */
  async start(): Promise<void> {
    this.logger.info('Tool registry started');
    
    // Initialize built-in providers
    await this.initializeBuiltInProviders();
  }

  /**
   * Stop the tool registry
   */
  async stop(): Promise<void> {
    // Shutdown all providers
    for (const [providerName, provider] of this.providers) {
      try {
        await provider.shutdown();
        this.logger.info({ provider: providerName }, 'Provider shutdown completed');
      } catch (error) {
        this.logger.error({ error, provider: providerName }, 'Provider shutdown failed');
      }
    }

    this.logger.info('Tool registry stopped');
  }

  /**
   * Initialize built-in providers
   */
  private async initializeBuiltInProviders(): Promise<void> {
    // This would initialize built-in providers like HTTP, File, Database, etc.
    // Implementation would depend on the specific built-in providers needed
  }
}