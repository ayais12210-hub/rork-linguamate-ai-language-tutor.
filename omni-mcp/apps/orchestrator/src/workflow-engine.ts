import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ToolRegistry } from './tool-registry.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';

// Workflow execution schemas
const WorkflowStepSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  tool: z.string(),
  provider: z.string().optional(),
  config: z.record(z.any()).optional(),
  input: z.record(z.any()).optional(),
  output: z.record(z.any()).optional(),
  retry: z.object({
    attempts: z.number().default(3),
    backoff: z.enum(['linear', 'exponential']).default('exponential'),
    maxDelay: z.number().default(30000),
  }).optional(),
  timeout: z.number().default(30000),
  condition: z.string().optional(),
  parallel: z.boolean().default(false),
});

const WorkflowTriggerSchema = z.object({
  event: z.string(),
  payload: z.record(z.any()).optional(),
  schedule: z.string().optional(), // cron expression
  webhook: z.object({
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('POST'),
    auth: z.boolean().default(false),
  }).optional(),
});

const WorkflowGuardsSchema = z.object({
  budget: z.object({
    maxMs: z.number().default(300000),
    maxTokens: z.number().default(10000),
    maxCost: z.number().default(1.00),
  }).optional(),
  security: z.object({
    piiRedaction: z.boolean().default(true),
    dataRetention: z.string().default('90d'),
    encryption: z.boolean().default(true),
  }).optional(),
  fallbacks: z.record(z.string()).optional(),
});

const WorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  trigger: WorkflowTriggerSchema,
  steps: z.array(WorkflowStepSchema),
  guards: WorkflowGuardsSchema.optional(),
  errorHandling: z.object({
    onError: z.object({
      action: z.enum(['retry', 'fallback', 'fail', 'notify']),
      fallback: z.string().optional(),
      notification: z.string().optional(),
      retry: z.object({
        attempts: z.number().default(2),
        backoff: z.enum(['linear', 'exponential']).default('exponential'),
        maxDelay: z.number().default(10000),
      }).optional(),
    }).optional(),
  }).optional(),
  monitoring: z.object({
    metrics: z.array(z.object({
      name: z.string(),
      type: z.enum(['counter', 'gauge', 'histogram']),
      labels: z.array(z.string()).optional(),
      description: z.string().optional(),
    })).optional(),
    alerts: z.array(z.object({
      name: z.string(),
      condition: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
    })).optional(),
  }).optional(),
  outputs: z.array(z.string()).optional(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type WorkflowTrigger = z.infer<typeof WorkflowTriggerSchema>;

export interface WorkflowExecutionContext {
  workflowId: string;
  executionId: string;
  userId?: string;
  sessionId?: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: Map<string, WorkflowStepExecution>;
  variables: Map<string, any>;
  metrics: Map<string, number>;
  errors: Array<{ step: string; error: Error; timestamp: Date }>;
}

export interface WorkflowStepExecution {
  stepName: string;
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input?: any;
  output?: any;
  error?: Error;
  retryCount: number;
  duration?: number;
}

export interface WorkflowExecutionResult {
  executionId: string;
  status: 'completed' | 'failed' | 'cancelled';
  duration: number;
  steps: WorkflowStepExecution[];
  outputs: Record<string, any>;
  metrics: Record<string, number>;
  errors: Array<{ step: string; error: Error; timestamp: Date }>;
}

export class WorkflowEngine extends EventEmitter {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecutionContext> = new Map();
  private logger: ReturnType<typeof createLogger>;
  private toolRegistry: ToolRegistry;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private isRunning: boolean = false;

  constructor(
    toolRegistry: ToolRegistry,
    configManager: ConfigManager,
    securityManager: SecurityManager,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.toolRegistry = toolRegistry;
    this.configManager = configManager;
    this.securityManager = securityManager;
    this.logger = logger;
  }

  /**
   * Register a workflow definition
   */
  async registerWorkflow(workflowDefinition: any): Promise<void> {
    try {
      const workflow = WorkflowSchema.parse(workflowDefinition);
      this.workflows.set(workflow.name, workflow);
      
      this.logger.info({
        workflow: workflow.name,
        version: workflow.version,
        steps: workflow.steps.length,
      }, 'Workflow registered');

      // Set up trigger listeners
      await this.setupTrigger(workflow);
      
      this.emit('workflow:registered', { workflow });
    } catch (error) {
      this.logger.error({ error, workflow: workflowDefinition.name }, 'Failed to register workflow');
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowName: string,
    triggerPayload: any,
    context: { userId?: string; sessionId?: string } = {}
  ): Promise<WorkflowExecutionResult> {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`);
    }

    const executionId = this.generateExecutionId();
    const executionContext: WorkflowExecutionContext = {
      workflowId: workflowName,
      executionId,
      userId: context.userId,
      sessionId: context.sessionId,
      startTime: new Date(),
      status: 'running',
      steps: new Map(),
      variables: new Map(),
      metrics: new Map(),
      errors: [],
    };

    this.executions.set(executionId, executionContext);

    this.logger.info({
      workflow: workflowName,
      executionId,
      userId: context.userId,
      sessionId: context.sessionId,
    }, 'Starting workflow execution');

    try {
      // Initialize variables with trigger payload
      this.initializeVariables(executionContext, triggerPayload);

      // Execute steps
      const outputs = await this.executeSteps(workflow, executionContext);

      // Complete execution
      executionContext.status = 'completed';
      executionContext.endTime = new Date();

      const result: WorkflowExecutionResult = {
        executionId,
        status: 'completed',
        duration: executionContext.endTime.getTime() - executionContext.startTime.getTime(),
        steps: Array.from(executionContext.steps.values()),
        outputs,
        metrics: Object.fromEntries(executionContext.metrics),
        errors: executionContext.errors,
      };

      this.logger.info({
        workflow: workflowName,
        executionId,
        duration: result.duration,
        stepsCompleted: result.steps.length,
      }, 'Workflow execution completed');

      this.emit('workflow:completed', { workflow: workflowName, result });
      return result;

    } catch (error) {
      executionContext.status = 'failed';
      executionContext.endTime = new Date();
      executionContext.errors.push({
        step: 'workflow',
        error: error as Error,
        timestamp: new Date(),
      });

      const result: WorkflowExecutionResult = {
        executionId,
        status: 'failed',
        duration: executionContext.endTime.getTime() - executionContext.startTime.getTime(),
        steps: Array.from(executionContext.steps.values()),
        outputs: {},
        metrics: Object.fromEntries(executionContext.metrics),
        errors: executionContext.errors,
      };

      this.logger.error({
        workflow: workflowName,
        executionId,
        error,
        duration: result.duration,
      }, 'Workflow execution failed');

      this.emit('workflow:failed', { workflow: workflowName, result });
      throw error;
    }
  }

  /**
   * Execute workflow steps
   */
  private async executeSteps(
    workflow: Workflow,
    context: WorkflowExecutionContext
  ): Promise<Record<string, any>> {
    const outputs: Record<string, any> = {};
    const parallelSteps: WorkflowStep[] = [];
    const sequentialSteps: WorkflowStep[] = [];

    // Separate parallel and sequential steps
    for (const step of workflow.steps) {
      if (step.parallel) {
        parallelSteps.push(step);
      } else {
        // Execute any pending parallel steps first
        if (parallelSteps.length > 0) {
          await this.executeParallelSteps(parallelSteps, context);
          parallelSteps.length = 0;
        }
        sequentialSteps.push(step);
      }
    }

    // Execute remaining parallel steps
    if (parallelSteps.length > 0) {
      await this.executeParallelSteps(parallelSteps, context);
    }

    // Execute sequential steps
    for (const step of sequentialSteps) {
      const stepOutput = await this.executeStep(step, context);
      outputs[step.name] = stepOutput;
    }

    return outputs;
  }

  /**
   * Execute parallel steps
   */
  private async executeParallelSteps(
    steps: WorkflowStep[],
    context: WorkflowExecutionContext
  ): Promise<void> {
    const promises = steps.map(step => this.executeStep(step, context));
    await Promise.allSettled(promises);
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<any> {
    const stepExecution: WorkflowStepExecution = {
      stepName: step.name,
      startTime: new Date(),
      status: 'running',
      retryCount: 0,
    };

    context.steps.set(step.name, stepExecution);

    this.logger.info({
      workflow: context.workflowId,
      executionId: context.executionId,
      step: step.name,
    }, 'Executing workflow step');

    try {
      // Check step condition
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        stepExecution.status = 'skipped';
        stepExecution.endTime = new Date();
        this.logger.info({ step: step.name }, 'Step skipped due to condition');
        return null;
      }

      // Resolve step input
      const resolvedInput = this.resolveVariables(step.input || {}, context);

      // Execute step with retry logic
      const output = await this.executeStepWithRetry(step, resolvedInput, context);

      stepExecution.status = 'completed';
      stepExecution.endTime = new Date();
      stepExecution.output = output;
      stepExecution.duration = stepExecution.endTime.getTime() - stepExecution.startTime.getTime();

      // Store step output in context variables
      if (step.output) {
        for (const [key, value] of Object.entries(step.output)) {
          context.variables.set(key, this.resolveVariables({ [key]: value }, context)[key]);
        }
      }

      this.logger.info({
        workflow: context.workflowId,
        executionId: context.executionId,
        step: step.name,
        duration: stepExecution.duration,
      }, 'Workflow step completed');

      return output;

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.endTime = new Date();
      stepExecution.error = error as Error;
      stepExecution.duration = stepExecution.endTime.getTime() - stepExecution.startTime.getTime();

      context.errors.push({
        step: step.name,
        error: error as Error,
        timestamp: new Date(),
      });

      this.logger.error({
        workflow: context.workflowId,
        executionId: context.executionId,
        step: step.name,
        error,
        duration: stepExecution.duration,
      }, 'Workflow step failed');

      throw error;
    }
  }

  /**
   * Execute step with retry logic
   */
  private async executeStepWithRetry(
    step: WorkflowStep,
    input: any,
    context: WorkflowExecutionContext
  ): Promise<any> {
    const retryConfig = step.retry || { attempts: 3, backoff: 'exponential', maxDelay: 30000 };
    let lastError: Error;

    for (let attempt = 0; attempt < retryConfig.attempts; attempt++) {
      try {
        const stepExecution = context.steps.get(step.name);
        if (stepExecution) {
          stepExecution.retryCount = attempt;
        }

        // Get tool from registry
        const tool = this.toolRegistry.getTool(step.tool, step.provider);
        if (!tool) {
          throw new Error(`Tool ${step.tool} not found for provider ${step.provider}`);
        }

        // Execute tool with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Step timeout')), step.timeout);
        });

        const executionPromise = tool.execute(input, {
          workflow: context.workflowId,
          executionId: context.executionId,
          step: step.name,
          userId: context.userId,
          sessionId: context.sessionId,
        });

        return await Promise.race([executionPromise, timeoutPromise]);

      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryConfig.attempts - 1) {
          throw lastError;
        }

        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(attempt, retryConfig);
        this.logger.warn({
          step: step.name,
          attempt: attempt + 1,
          maxAttempts: retryConfig.attempts,
          delay,
          error: lastError.message,
        }, 'Step execution failed, retrying');

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoffDelay(attempt: number, config: any): number {
    const baseDelay = 1000;
    const maxDelay = config.maxDelay || 30000;

    if (config.backoff === 'exponential') {
      return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    } else {
      return Math.min(baseDelay * (attempt + 1), maxDelay);
    }
  }

  /**
   * Initialize variables from trigger payload
   */
  private initializeVariables(context: WorkflowExecutionContext, payload: any): void {
    context.variables.set('trigger', payload);
    
    // Flatten payload into variables
    for (const [key, value] of Object.entries(payload)) {
      context.variables.set(key, value);
    }
  }

  /**
   * Resolve variables in a template
   */
  private resolveVariables(template: any, context: WorkflowExecutionContext): any {
    if (typeof template === 'string') {
      return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
        const value = this.getVariableValue(path, context);
        return value !== undefined ? String(value) : match;
      });
    } else if (Array.isArray(template)) {
      return template.map(item => this.resolveVariables(item, context));
    } else if (typeof template === 'object' && template !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(template)) {
        resolved[key] = this.resolveVariables(value, context);
      }
      return resolved;
    }
    return template;
  }

  /**
   * Get variable value from context
   */
  private getVariableValue(path: string, context: WorkflowExecutionContext): any {
    const parts = path.split('.');
    let current: any = context.variables;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current.get ? current.get(part) : current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Evaluate step condition
   */
  private evaluateCondition(condition: string, context: WorkflowExecutionContext): boolean {
    try {
      // Simple condition evaluation - can be enhanced with a proper expression parser
      const resolvedCondition = this.resolveVariables(condition, context);
      return Boolean(resolvedCondition);
    } catch (error) {
      this.logger.warn({ condition, error }, 'Failed to evaluate step condition');
      return false;
    }
  }

  /**
   * Set up workflow trigger
   */
  private async setupTrigger(workflow: Workflow): Promise<void> {
    const { trigger } = workflow;

    if (trigger.event) {
      this.on(`trigger:${trigger.event}`, async (payload) => {
        try {
          await this.executeWorkflow(workflow.name, payload);
        } catch (error) {
          this.logger.error({
            workflow: workflow.name,
            trigger: trigger.event,
            error,
          }, 'Failed to execute workflow from trigger');
        }
      });
    }

    if (trigger.webhook) {
      // Webhook setup would be handled by the HTTP server
      this.emit('webhook:register', {
        workflow: workflow.name,
        webhook: trigger.webhook,
      });
    }

    if (trigger.schedule) {
      // Schedule setup would be handled by a scheduler
      this.emit('schedule:register', {
        workflow: workflow.name,
        schedule: trigger.schedule,
      });
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get workflow execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecutionContext | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const context = this.executions.get(executionId);
    if (context && context.status === 'running') {
      context.status = 'cancelled';
      context.endTime = new Date();
      
      this.logger.info({
        executionId,
        workflow: context.workflowId,
      }, 'Workflow execution cancelled');

      this.emit('workflow:cancelled', { executionId, workflow: context.workflowId });
    }
  }

  /**
   * Get all registered workflows
   */
  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by name
   */
  getWorkflow(name: string): Workflow | undefined {
    return this.workflows.get(name);
  }

  /**
   * Start the workflow engine
   */
  async start(): Promise<void> {
    this.isRunning = true;
    this.logger.info('Workflow engine started');
  }

  /**
   * Stop the workflow engine
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Cancel all running executions
    for (const [executionId, context] of this.executions) {
      if (context.status === 'running') {
        await this.cancelExecution(executionId);
      }
    }

    this.logger.info('Workflow engine stopped');
  }
}