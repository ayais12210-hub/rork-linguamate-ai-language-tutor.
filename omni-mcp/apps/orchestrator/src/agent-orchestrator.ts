import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { AgentCommunicationProtocol, Task, AgentStatus } from './agent-communication.js';

// Agent orchestration schemas
const AgentDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['manager', 'engineer', 'tester', 'docs', 'security']),
  capabilities: z.array(z.string()),
  maxConcurrency: z.number().default(1),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  config: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
});

const TaskAssignmentSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  assignedAt: z.date(),
  deadline: z.date().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  metadata: z.record(z.any()).default({}),
});

const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(z.object({
    name: z.string(),
    agentType: z.string(),
    requirements: z.array(z.string()).default([]),
    dependencies: z.array(z.string()).default([]),
    timeout: z.number().default(300000), // 5 minutes
    retries: z.number().default(3),
    parallel: z.boolean().default(false),
  })),
  metadata: z.record(z.any()).default({}),
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;
export type TaskAssignment = z.infer<typeof TaskAssignmentSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

export interface AgentOrchestrationContext {
  workflowId: string;
  executionId: string;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
}

export interface AgentPerformanceMetrics {
  agentId: string;
  tasksCompleted: number;
  tasksFailed: number;
  averageExecutionTime: number;
  successRate: number;
  lastActivity: Date;
}

export class AgentOrchestrator extends EventEmitter {
  private agents: Map<string, AgentDefinition> = new Map();
  private agentStatuses: Map<string, AgentStatus> = new Map();
  private taskAssignments: Map<string, TaskAssignment> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private performanceMetrics: Map<string, AgentPerformanceMetrics> = new Map();
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private communicationProtocol: AgentCommunicationProtocol;
  private isRunning: boolean = false;

  constructor(
    configManager: ConfigManager,
    securityManager: SecurityManager,
    communicationProtocol: AgentCommunicationProtocol,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.configManager = configManager;
    this.securityManager = securityManager;
    this.communicationProtocol = communicationProtocol;
    this.logger = logger;
  }

  /**
   * Register an agent
   */
  async registerAgent(agentDefinition: AgentDefinition): Promise<void> {
    try {
      const validatedAgent = AgentDefinitionSchema.parse(agentDefinition);
      
      this.agents.set(validatedAgent.id, validatedAgent);
      
      // Initialize performance metrics
      this.performanceMetrics.set(validatedAgent.id, {
        agentId: validatedAgent.id,
        tasksCompleted: 0,
        tasksFailed: 0,
        averageExecutionTime: 0,
        successRate: 100,
        lastActivity: new Date(),
      });

      // Register with communication protocol
      await this.communicationProtocol.registerAgent(
        validatedAgent.id,
        validatedAgent.name,
        validatedAgent.capabilities.map(cap => ({
          name: cap,
          description: `Capability: ${cap}`,
          inputSchema: {},
          outputSchema: {},
          capabilities: [],
        })),
        validatedAgent.metadata
      );

      this.logger.info({
        agentId: validatedAgent.id,
        name: validatedAgent.name,
        type: validatedAgent.type,
        capabilities: validatedAgent.capabilities.length,
      }, 'Agent registered');

      this.emit('agent:registered', { agent: validatedAgent });
    } catch (error) {
      this.logger.error({ error, agent: agentDefinition }, 'Failed to register agent');
      throw error;
    }
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Reassign pending tasks
    await this.reassignAgentTasks(agentId);

    // Remove from all maps
    this.agents.delete(agentId);
    this.agentStatuses.delete(agentId);
    this.performanceMetrics.delete(agentId);

    // Unregister from communication protocol
    await this.communicationProtocol.unregisterAgent(agentId);

    this.logger.info({ agentId }, 'Agent unregistered');
    this.emit('agent:unregistered', { agentId });
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(
    agentId: string,
    status: AgentStatus['status'],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await this.communicationProtocol.updateAgentStatus(agentId, status, metadata);
    
    // Update local status
    const agentStatus = this.agentStatuses.get(agentId);
    if (agentStatus) {
      agentStatus.status = status;
      agentStatus.lastSeen = new Date();
      agentStatus.metadata = { ...agentStatus.metadata, ...metadata };
    }

    this.logger.info({ agentId, status }, 'Agent status updated');
    this.emit('agent:status_updated', { agentId, status, metadata });
  }

  /**
   * Register a workflow
   */
  async registerWorkflow(workflowDefinition: WorkflowDefinition): Promise<void> {
    try {
      const validatedWorkflow = WorkflowDefinitionSchema.parse(workflowDefinition);
      this.workflows.set(validatedWorkflow.id, validatedWorkflow);

      this.logger.info({
        workflowId: validatedWorkflow.id,
        name: validatedWorkflow.name,
        steps: validatedWorkflow.steps.length,
      }, 'Workflow registered');

      this.emit('workflow:registered', { workflow: validatedWorkflow });
    } catch (error) {
      this.logger.error({ error, workflow: workflowDefinition }, 'Failed to register workflow');
      throw error;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    context: AgentOrchestrationContext
  ): Promise<{ executionId: string; tasks: Task[] }> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = this.generateExecutionId();
    const tasks: Task[] = [];

    this.logger.info({
      workflowId,
      executionId,
      userId: context.userId,
      sessionId: context.sessionId,
    }, 'Starting workflow execution');

    try {
      // Create tasks for each workflow step
      for (const step of workflow.steps) {
        const task = await this.communicationProtocol.createTask(
          step.name,
          `Execute ${step.name} for workflow ${workflow.name}`,
          {
            workflowId,
            executionId,
            stepName: step.name,
            agentType: step.agentType,
            requirements: step.requirements,
            dependencies: step.dependencies,
            timeout: step.timeout,
            retries: step.retries,
            parallel: step.parallel,
            ...context.metadata,
          },
          {
            priority: this.mapPriority(step.agentType),
            deadline: step.timeout ? new Date(Date.now() + step.timeout) : undefined,
            maxRetries: step.retries,
          }
        );

        tasks.push(this.communicationProtocol.getTask(task)!);
      }

      // Assign tasks to agents
      await this.assignTasksToAgents(tasks, workflow);

      this.logger.info({
        workflowId,
        executionId,
        tasksCreated: tasks.length,
      }, 'Workflow execution started');

      this.emit('workflow:execution_started', {
        workflowId,
        executionId,
        tasks: tasks.length,
      });

      return { executionId, tasks };

    } catch (error) {
      this.logger.error({
        workflowId,
        executionId,
        error,
      }, 'Workflow execution failed');

      throw error;
    }
  }

  /**
   * Assign tasks to agents
   */
  private async assignTasksToAgents(tasks: Task[], workflow: WorkflowDefinition): Promise<void> {
    const taskDependencies = new Map<string, string[]>();
    const taskAssignments = new Map<string, string>();

    // Build dependency graph
    for (const step of workflow.steps) {
      taskDependencies.set(step.name, step.dependencies);
    }

    // Sort tasks by dependencies (topological sort)
    const sortedTasks = this.topologicalSort(tasks, taskDependencies);

    // Assign tasks to available agents
    for (const task of sortedTasks) {
      const step = workflow.steps.find(s => s.name === task.type);
      if (!step) continue;

      const assignedAgent = await this.findBestAgent(step.agentType, step.requirements);
      if (assignedAgent) {
        task.assignedTo = assignedAgent.id;
        task.status = 'pending';
        task.updatedAt = new Date();

        const assignment: TaskAssignment = {
          taskId: task.id,
          agentId: assignedAgent.id,
          assignedAt: new Date(),
          deadline: task.deadline,
          priority: task.priority,
          metadata: {
            workflowId: workflow.id,
            stepName: step.name,
            agentType: step.agentType,
          },
        };

        this.taskAssignments.set(task.id, assignment);

        this.logger.info({
          taskId: task.id,
          agentId: assignedAgent.id,
          agentType: step.agentType,
          stepName: step.name,
        }, 'Task assigned to agent');

        this.emit('task:assigned', { task, agent: assignedAgent });
      } else {
        this.logger.warn({
          taskId: task.id,
          agentType: step.agentType,
          requirements: step.requirements,
        }, 'No suitable agent found for task');
      }
    }
  }

  /**
   * Find the best agent for a task
   */
  private async findBestAgent(
    agentType: string,
    requirements: string[]
  ): Promise<AgentDefinition | null> {
    const availableAgents = Array.from(this.agents.values()).filter(agent => {
      // Check agent type
      if (agent.type !== agentType) return false;

      // Check if agent is online
      const status = this.agentStatuses.get(agent.id);
      if (!status || status.status !== 'online') return false;

      // Check capabilities
      const hasRequiredCapabilities = requirements.every(req => 
        agent.capabilities.includes(req)
      );
      if (!hasRequiredCapabilities) return false;

      // Check concurrency limits
      const currentTasks = Array.from(this.taskAssignments.values()).filter(
        assignment => assignment.agentId === agent.id
      ).length;
      if (currentTasks >= agent.maxConcurrency) return false;

      return true;
    });

    if (availableAgents.length === 0) {
      return null;
    }

    // Sort by priority and performance metrics
    availableAgents.sort((a, b) => {
      const aMetrics = this.performanceMetrics.get(a.id)!;
      const bMetrics = this.performanceMetrics.get(b.id)!;

      // Priority comparison
      const priorityDiff = this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;

      // Performance comparison (success rate, then average execution time)
      const successRateDiff = bMetrics.successRate - aMetrics.successRate;
      if (successRateDiff !== 0) return successRateDiff;

      return aMetrics.averageExecutionTime - bMetrics.averageExecutionTime;
    });

    return availableAgents[0];
  }

  /**
   * Reassign tasks from an agent
   */
  private async reassignAgentTasks(agentId: string): Promise<void> {
    const agentTasks = Array.from(this.taskAssignments.values()).filter(
      assignment => assignment.agentId === agentId
    );

    for (const assignment of agentTasks) {
      const task = this.communicationProtocol.getTask(assignment.taskId);
      if (task && task.status === 'pending') {
        // Find a new agent
        const workflow = this.workflows.get(assignment.metadata.workflowId);
        if (workflow) {
          const step = workflow.steps.find(s => s.name === task.type);
          if (step) {
            const newAgent = await this.findBestAgent(step.agentType, step.requirements);
            if (newAgent) {
              task.assignedTo = newAgent.id;
              assignment.agentId = newAgent.id;
              assignment.assignedAt = new Date();

              this.logger.info({
                taskId: task.id,
                oldAgentId: agentId,
                newAgentId: newAgent.id,
              }, 'Task reassigned');

              this.emit('task:reassigned', {
                task,
                oldAgentId: agentId,
                newAgentId: newAgent.id,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Update task status and metrics
   */
  async updateTaskStatus(
    taskId: string,
    status: Task['status'],
    output?: Record<string, any>
  ): Promise<void> {
    const assignment = this.taskAssignments.get(taskId);
    if (!assignment) {
      return;
    }

    const agentId = assignment.agentId;
    const metrics = this.performanceMetrics.get(agentId);
    if (!metrics) {
      return;
    }

    // Update metrics
    if (status === 'completed') {
      metrics.tasksCompleted++;
    } else if (status === 'failed') {
      metrics.tasksFailed++;
    }

    metrics.lastActivity = new Date();
    metrics.successRate = metrics.tasksCompleted / (metrics.tasksCompleted + metrics.tasksFailed) * 100;

    // Update task in communication protocol
    await this.communicationProtocol.updateTaskStatus(taskId, status, output);

    this.logger.info({
      taskId,
      agentId,
      status,
      successRate: metrics.successRate,
    }, 'Task status updated');

    this.emit('task:status_updated', {
      taskId,
      agentId,
      status,
      metrics,
    });
  }

  /**
   * Get agent performance metrics
   */
  getAgentMetrics(agentId?: string): AgentPerformanceMetrics[] {
    if (agentId) {
      const metrics = this.performanceMetrics.get(agentId);
      return metrics ? [metrics] : [];
    }

    return Array.from(this.performanceMetrics.values());
  }

  /**
   * Get workflow execution status
   */
  getWorkflowExecutionStatus(executionId: string): {
    workflowId: string;
    executionId: string;
    tasks: Task[];
    progress: number;
    status: 'running' | 'completed' | 'failed';
  } | null {
    const tasks = Array.from(this.taskAssignments.values())
      .filter(assignment => assignment.metadata.executionId === executionId)
      .map(assignment => this.communicationProtocol.getTask(assignment.taskId))
      .filter(Boolean) as Task[];

    if (tasks.length === 0) {
      return null;
    }

    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const failedTasks = tasks.filter(task => task.status === 'failed').length;
    const progress = (completedTasks / tasks.length) * 100;

    let status: 'running' | 'completed' | 'failed';
    if (failedTasks > 0) {
      status = 'failed';
    } else if (completedTasks === tasks.length) {
      status = 'completed';
    } else {
      status = 'running';
    }

    return {
      workflowId: tasks[0].input.workflowId,
      executionId,
      tasks,
      progress,
      status,
    };
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Topological sort for task dependencies
   */
  private topologicalSort(tasks: Task[], dependencies: Map<string, string[]>): Task[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: Task[] = [];

    const visit = (taskName: string) => {
      if (visiting.has(taskName)) {
        throw new Error(`Circular dependency detected: ${taskName}`);
      }
      if (visited.has(taskName)) {
        return;
      }

      visiting.add(taskName);
      const deps = dependencies.get(taskName) || [];
      for (const dep of deps) {
        visit(dep);
      }
      visiting.delete(taskName);
      visited.add(taskName);

      const task = tasks.find(t => t.type === taskName);
      if (task) {
        result.push(task);
      }
    };

    for (const task of tasks) {
      if (!visited.has(task.type)) {
        visit(task.type);
      }
    }

    return result;
  }

  /**
   * Map agent type to priority
   */
  private mapPriority(agentType: string): Task['priority'] {
    const priorityMap: Record<string, Task['priority']> = {
      'manager': 'high',
      'engineer': 'normal',
      'tester': 'normal',
      'docs': 'low',
      'security': 'high',
    };
    return priorityMap[agentType] || 'normal';
  }

  /**
   * Get priority value for sorting
   */
  private getPriorityValue(priority: string): number {
    const values = { critical: 4, high: 3, normal: 2, low: 1 };
    return values[priority as keyof typeof values] || 2;
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the agent orchestrator
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Set up communication protocol event handlers
    this.communicationProtocol.on('task:status_updated', async (data) => {
      await this.updateTaskStatus(data.taskId, data.status, data.output);
    });

    this.logger.info('Agent orchestrator started');
  }

  /**
   * Stop the agent orchestrator
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Agent orchestrator stopped');
  }
}