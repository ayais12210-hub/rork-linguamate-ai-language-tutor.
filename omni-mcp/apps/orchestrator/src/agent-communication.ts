import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';

// Agent communication schemas
const AgentMessageSchema = z.object({
  id: z.string(),
  type: z.enum(['request', 'response', 'notification', 'broadcast']),
  from: z.string(),
  to: z.string().optional(), // undefined for broadcast
  subject: z.string(),
  payload: z.record(z.any()),
  timestamp: z.date(),
  ttl: z.number().default(300000), // 5 minutes default TTL
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  correlationId: z.string().optional(),
  replyTo: z.string().optional(),
});

const AgentCapabilitySchema = z.object({
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
  capabilities: z.array(z.string()).default([]),
});

const AgentStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['online', 'busy', 'offline', 'error']),
  capabilities: z.array(AgentCapabilitySchema),
  lastSeen: z.date(),
  metadata: z.record(z.any()).default({}),
});

const TaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  assignedTo: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).default('pending'),
  input: z.record(z.any()).optional(),
  output: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deadline: z.date().optional(),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type Task = z.infer<typeof TaskSchema>;

export interface AgentCommunicationContext {
  agentId: string;
  sessionId?: string;
  userId?: string;
  workflowId?: string;
  executionId?: string;
  metadata: Record<string, any>;
}

export interface MessageHandler {
  (message: AgentMessage, context: AgentCommunicationContext): Promise<AgentMessage | void>;
}

export interface TaskHandler {
  (task: Task, context: AgentCommunicationContext): Promise<Task>;
}

export class AgentCommunicationProtocol extends EventEmitter {
  private agents: Map<string, AgentStatus> = new Map();
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private taskHandlers: Map<string, TaskHandler> = new Map();
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  private tasks: Map<string, Task> = new Map();
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private isRunning: boolean = false;

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
   * Register an agent
   */
  async registerAgent(
    agentId: string,
    name: string,
    capabilities: AgentCapability[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const agentStatus: AgentStatus = {
      id: agentId,
      name,
      status: 'online',
      capabilities,
      lastSeen: new Date(),
      metadata,
    };

    this.agents.set(agentId, agentStatus);
    this.messageQueue.set(agentId, []);

    this.logger.info({
      agentId,
      name,
      capabilities: capabilities.length,
    }, 'Agent registered');

    this.emit('agent:registered', { agentId, name, capabilities });
  }

  /**
   * Unregister an agent
   */
  async unregisterAgent(agentId: string): Promise<void> {
    this.agents.delete(agentId);
    this.messageQueue.delete(agentId);

    // Cancel all tasks assigned to this agent
    for (const [taskId, task] of this.tasks) {
      if (task.assignedTo === agentId && task.status === 'in_progress') {
        task.status = 'cancelled';
        task.updatedAt = new Date();
        this.emit('task:cancelled', { taskId, reason: 'agent_unregistered' });
      }
    }

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

    agent.status = status;
    agent.lastSeen = new Date();
    agent.metadata = { ...agent.metadata, ...metadata };

    this.logger.info({ agentId, status }, 'Agent status updated');
    this.emit('agent:status_updated', { agentId, status, metadata });
  }

  /**
   * Send a message to an agent
   */
  async sendMessage(
    from: string,
    to: string,
    subject: string,
    payload: Record<string, any>,
    options: {
      priority?: AgentMessage['priority'];
      ttl?: number;
      correlationId?: string;
      replyTo?: string;
    } = {}
  ): Promise<string> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      type: 'request',
      from,
      to,
      subject,
      payload,
      timestamp: new Date(),
      ttl: options.ttl || 300000,
      priority: options.priority || 'normal',
      correlationId: options.correlationId,
      replyTo: options.replyTo,
    };

    // Validate message
    AgentMessageSchema.parse(message);

    // Check if target agent exists
    if (!this.agents.has(to)) {
      throw new Error(`Target agent ${to} not found`);
    }

    // Add to message queue
    const queue = this.messageQueue.get(to);
    if (queue) {
      queue.push(message);
      // Sort by priority
      queue.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
    }

    this.logger.info({
      messageId: message.id,
      from,
      to,
      subject,
      priority: message.priority,
    }, 'Message sent');

    this.emit('message:sent', { message });
    return message.id;
  }

  /**
   * Send a broadcast message to all agents
   */
  async broadcastMessage(
    from: string,
    subject: string,
    payload: Record<string, any>,
    options: {
      priority?: AgentMessage['priority'];
      ttl?: number;
      excludeAgents?: string[];
    } = {}
  ): Promise<string[]> {
    const messageIds: string[] = [];
    const excludeAgents = options.excludeAgents || [];

    for (const [agentId] of this.agents) {
      if (!excludeAgents.includes(agentId)) {
        try {
          const messageId = await this.sendMessage(from, agentId, subject, payload, options);
          messageIds.push(messageId);
        } catch (error) {
          this.logger.warn({ agentId, error }, 'Failed to send broadcast message to agent');
        }
      }
    }

    this.logger.info({
      from,
      subject,
      recipients: messageIds.length,
    }, 'Broadcast message sent');

    return messageIds;
  }

  /**
   * Get messages for an agent
   */
  async getMessages(agentId: string, limit: number = 10): Promise<AgentMessage[]> {
    const queue = this.messageQueue.get(agentId);
    if (!queue) {
      return [];
    }

    // Filter expired messages
    const now = new Date();
    const validMessages = queue.filter(msg => 
      now.getTime() - msg.timestamp.getTime() < msg.ttl
    );

    // Update queue with valid messages
    this.messageQueue.set(agentId, validMessages);

    // Return up to limit messages
    return validMessages.slice(0, limit);
  }

  /**
   * Acknowledge a message (remove from queue)
   */
  async acknowledgeMessage(agentId: string, messageId: string): Promise<void> {
    const queue = this.messageQueue.get(agentId);
    if (queue) {
      const index = queue.findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        queue.splice(index, 1);
        this.logger.info({ agentId, messageId }, 'Message acknowledged');
      }
    }
  }

  /**
   * Send a response message
   */
  async sendResponse(
    originalMessageId: string,
    from: string,
    to: string,
    payload: Record<string, any>,
    options: {
      priority?: AgentMessage['priority'];
      ttl?: number;
    } = {}
  ): Promise<string> {
    const response: AgentMessage = {
      id: this.generateMessageId(),
      type: 'response',
      from,
      to,
      subject: 'response',
      payload,
      timestamp: new Date(),
      ttl: options.ttl || 300000,
      priority: options.priority || 'normal',
      correlationId: originalMessageId,
    };

    // Add to message queue
    const queue = this.messageQueue.get(to);
    if (queue) {
      queue.push(response);
      queue.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
    }

    this.logger.info({
      responseId: response.id,
      originalMessageId,
      from,
      to,
    }, 'Response sent');

    this.emit('message:response_sent', { response, originalMessageId });
    return response.id;
  }

  /**
   * Register a message handler
   */
  registerMessageHandler(subject: string, handler: MessageHandler): void {
    this.messageHandlers.set(subject, handler);
    this.logger.info({ subject }, 'Message handler registered');
  }

  /**
   * Register a task handler
   */
  registerTaskHandler(taskType: string, handler: TaskHandler): void {
    this.taskHandlers.set(taskType, handler);
    this.logger.info({ taskType }, 'Task handler registered');
  }

  /**
   * Create a task
   */
  async createTask(
    type: string,
    description: string,
    input: Record<string, any> = {},
    options: {
      priority?: Task['priority'];
      deadline?: Date;
      maxRetries?: number;
      assignedTo?: string;
    } = {}
  ): Promise<string> {
    const task: Task = {
      id: this.generateTaskId(),
      type,
      description,
      priority: options.priority || 'normal',
      status: 'pending',
      input,
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: options.deadline,
      maxRetries: options.maxRetries || 3,
      assignedTo: options.assignedTo,
    };

    this.tasks.set(task.id, task);

    this.logger.info({
      taskId: task.id,
      type,
      description,
      priority: task.priority,
      assignedTo: task.assignedTo,
    }, 'Task created');

    this.emit('task:created', { task });

    // Auto-assign if no specific agent assigned
    if (!task.assignedTo) {
      await this.autoAssignTask(task.id);
    }

    return task.id;
  }

  /**
   * Auto-assign a task to the best available agent
   */
  async autoAssignTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return;
    }

    // Find agents that can handle this task type
    const capableAgents = Array.from(this.agents.values()).filter(agent => 
      agent.status === 'online' && 
      agent.capabilities.some(cap => cap.name === task.type)
    );

    if (capableAgents.length === 0) {
      this.logger.warn({ taskId, type: task.type }, 'No capable agents available for task');
      return;
    }

    // Assign to the least busy agent
    const assignedAgent = capableAgents.reduce((best, current) => {
      const bestTasks = Array.from(this.tasks.values()).filter(t => 
        t.assignedTo === best.id && t.status === 'in_progress'
      ).length;
      const currentTasks = Array.from(this.tasks.values()).filter(t => 
        t.assignedTo === current.id && t.status === 'in_progress'
      ).length;
      
      return currentTasks < bestTasks ? current : best;
    });

    task.assignedTo = assignedAgent.id;
    task.updatedAt = new Date();

    this.logger.info({
      taskId,
      assignedTo: assignedAgent.id,
      agentName: assignedAgent.name,
    }, 'Task auto-assigned');

    this.emit('task:assigned', { taskId, assignedTo: assignedAgent.id });
  }

  /**
   * Get tasks for an agent
   */
  async getTasks(agentId: string, status?: Task['status']): Promise<Task[]> {
    const tasks = Array.from(this.tasks.values()).filter(task => {
      if (task.assignedTo !== agentId) return false;
      if (status && task.status !== status) return false;
      return true;
    });

    // Sort by priority and creation time
    tasks.sort((a, b) => {
      const priorityDiff = this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return tasks;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    status: Task['status'],
    output?: Record<string, any>
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = status;
    task.updatedAt = new Date();
    
    if (output) {
      task.output = output;
    }

    this.logger.info({
      taskId,
      status,
      assignedTo: task.assignedTo,
    }, 'Task status updated');

    this.emit('task:status_updated', { taskId, status, output });
  }

  /**
   * Process messages for an agent
   */
  async processMessages(agentId: string): Promise<void> {
    const messages = await this.getMessages(agentId);
    
    for (const message of messages) {
      try {
        const handler = this.messageHandlers.get(message.subject);
        if (handler) {
          const context: AgentCommunicationContext = {
            agentId,
            metadata: {},
          };

          const response = await handler(message, context);
          
          if (response) {
            await this.sendResponse(message.id, agentId, message.from, response.payload);
          }
        }

        // Acknowledge the message
        await this.acknowledgeMessage(agentId, message.id);

      } catch (error) {
        this.logger.error({
          agentId,
          messageId: message.id,
          subject: message.subject,
          error,
        }, 'Failed to process message');
      }
    }
  }

  /**
   * Process tasks for an agent
   */
  async processTasks(agentId: string): Promise<void> {
    const tasks = await this.getTasks(agentId, 'pending');
    
    for (const task of tasks) {
      try {
        const handler = this.taskHandlers.get(task.type);
        if (handler) {
          // Update task status to in_progress
          await this.updateTaskStatus(task.id, 'in_progress');

          const context: AgentCommunicationContext = {
            agentId,
            metadata: {},
          };

          const result = await handler(task, context);
          
          // Update task with result
          await this.updateTaskStatus(result.id, result.status, result.output);

        } else {
          this.logger.warn({
            agentId,
            taskId: task.id,
            taskType: task.type,
          }, 'No handler found for task type');
        }

      } catch (error) {
        this.logger.error({
          agentId,
          taskId: task.id,
          taskType: task.type,
          error,
        }, 'Failed to process task');

        // Increment retry count
        task.retryCount++;
        
        if (task.retryCount >= task.maxRetries) {
          await this.updateTaskStatus(task.id, 'failed');
        } else {
          await this.updateTaskStatus(task.id, 'pending');
        }
      }
    }
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agent statuses
   */
  getAllAgentStatuses(): AgentStatus[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get priority value for sorting
   */
  private getPriorityValue(priority: AgentMessage['priority']): number {
    const values = { critical: 4, high: 3, normal: 2, low: 1 };
    return values[priority];
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the communication protocol
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    // Start periodic cleanup of expired messages
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 60000); // Every minute

    this.logger.info('Agent communication protocol started');
  }

  /**
   * Stop the communication protocol
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Agent communication protocol stopped');
  }

  /**
   * Cleanup expired messages
   */
  private cleanupExpiredMessages(): void {
    const now = new Date();
    
    for (const [agentId, queue] of this.messageQueue) {
      const validMessages = queue.filter(msg => 
        now.getTime() - msg.timestamp.getTime() < msg.ttl
      );
      
      if (validMessages.length !== queue.length) {
        this.messageQueue.set(agentId, validMessages);
        this.logger.debug({
          agentId,
          removed: queue.length - validMessages.length,
        }, 'Cleaned up expired messages');
      }
    }
  }
}