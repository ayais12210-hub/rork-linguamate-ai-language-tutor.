import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { MonitoringSystem } from './monitoring-system.js';
import { CacheManager } from './cache-manager.js';

// Message queue schemas
const MessageSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.record(z.any()),
  headers: z.record(z.string()).default({}),
  metadata: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    workflowId: z.string().optional(),
    executionId: z.string().optional(),
    agentId: z.string().optional(),
    source: z.string().optional(),
    correlationId: z.string().optional(),
    causationId: z.string().optional(),
    timestamp: z.date(),
    retryCount: z.number().default(0),
    maxRetries: z.number().default(3),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    ttl: z.number().default(3600000), // 1 hour
  }),
  createdAt: z.date(),
  scheduledAt: z.date().optional(),
});

const QueueConfigSchema = z.object({
  name: z.string(),
  maxSize: z.number().default(10000),
  visibilityTimeout: z.number().default(30000), // 30 seconds
  messageRetentionPeriod: z.number().default(1209600), // 14 days
  deadLetterQueue: z.string().optional(),
  maxReceiveCount: z.number().default(3),
  delaySeconds: z.number().default(0),
  fifo: z.boolean().default(false),
  contentBasedDeduplication: z.boolean().default(false),
});

const ConsumerConfigSchema = z.object({
  queueName: z.string(),
  handler: z.string(),
  batchSize: z.number().default(1),
  waitTimeSeconds: z.number().default(20),
  maxConcurrency: z.number().default(1),
  autoAck: z.boolean().default(false),
  retryPolicy: z.object({
    maxRetries: z.number().default(3),
    backoffMultiplier: z.number().default(2),
    maxBackoffMs: z.number().default(300000), // 5 minutes
  }).default({}),
});

export type Message = z.infer<typeof MessageSchema>;
export type QueueConfig = z.infer<typeof QueueConfigSchema>;
export type ConsumerConfig = z.infer<typeof ConsumerConfigSchema>;

export interface MessageContext {
  userId?: string;
  sessionId?: string;
  workflowId?: string;
  executionId?: string;
  agentId?: string;
  source?: string;
  correlationId?: string;
  causationId?: string;
}

export interface MessageHandler {
  (message: Message, context: MessageContext): Promise<void>;
}

export interface QueueStats {
  name: string;
  messageCount: number;
  visibleMessageCount: number;
  invisibleMessageCount: number;
  delayedMessageCount: number;
  deadLetterMessageCount: number;
  oldestMessageAge: number;
  throughput: number;
}

export class MessageQueueManager extends EventEmitter {
  private queues: Map<string, QueueConfig> = new Map();
  private consumers: Map<string, ConsumerConfig> = new Map();
  private handlers: Map<string, MessageHandler> = new Map();
  private messages: Map<string, Message[]> = new Map(); // queueName -> messages
  private processingMessages: Map<string, Set<string>> = new Map(); // queueName -> processing message IDs
  private deadLetterQueues: Map<string, Message[]> = new Map(); // queueName -> dead letter messages
  private config: any;
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private monitoringSystem: MonitoringSystem;
  private cacheManager: CacheManager;
  private isRunning: boolean = false;
  private processingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: any,
    configManager: ConfigManager,
    securityManager: SecurityManager,
    monitoringSystem: MonitoringSystem,
    cacheManager: CacheManager,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.config = config;
    this.configManager = configManager;
    this.securityManager = securityManager;
    this.monitoringSystem = monitoringSystem;
    this.cacheManager = cacheManager;
    this.logger = logger;
  }

  /**
   * Create a queue
   */
  async createQueue(config: QueueConfig): Promise<void> {
    try {
      const validatedConfig = QueueConfigSchema.parse(config);
      
      this.queues.set(validatedConfig.name, validatedConfig);
      
      // Initialize message storage
      this.messages.set(validatedConfig.name, []);
      this.processingMessages.set(validatedConfig.name, new Set());
      
      // Create dead letter queue if specified
      if (validatedConfig.deadLetterQueue) {
        this.deadLetterQueues.set(validatedConfig.deadLetterQueue, []);
      }

      this.logger.info({
        queueName: validatedConfig.name,
        maxSize: validatedConfig.maxSize,
        visibilityTimeout: validatedConfig.visibilityTimeout,
        deadLetterQueue: validatedConfig.deadLetterQueue,
      }, 'Queue created');

      this.emit('queue:created', { queue: validatedConfig });

    } catch (error) {
      this.logger.error({ error, config }, 'Failed to create queue');
      throw error;
    }
  }

  /**
   * Delete a queue
   */
  async deleteQueue(queueName: string): Promise<void> {
    try {
      if (!this.queues.has(queueName)) {
        throw new Error(`Queue ${queueName} not found`);
      }

      // Stop processing
      this.stopProcessing(queueName);

      // Remove from maps
      this.queues.delete(queueName);
      this.messages.delete(queueName);
      this.processingMessages.delete(queueName);
      this.deadLetterQueues.delete(queueName);

      this.logger.info({ queueName }, 'Queue deleted');

      this.emit('queue:deleted', { queueName });

    } catch (error) {
      this.logger.error({ error, queueName }, 'Failed to delete queue');
      throw error;
    }
  }

  /**
   * Send a message to a queue
   */
  async sendMessage(
    queueName: string,
    messageType: string,
    payload: any,
    options: {
      headers?: Record<string, string>;
      context?: MessageContext;
      priority?: Message['metadata']['priority'];
      ttl?: number;
      delaySeconds?: number;
      deduplicationId?: string;
    } = {}
  ): Promise<string> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      // Check queue size
      const messages = this.messages.get(queueName) || [];
      if (messages.length >= queue.maxSize) {
        throw new Error(`Queue ${queueName} is full`);
      }

      // Check for duplicate messages
      if (queue.contentBasedDeduplication && options.deduplicationId) {
        const existingMessage = messages.find(m => 
          m.headers['deduplicationId'] === options.deduplicationId
        );
        if (existingMessage) {
          this.logger.debug({ queueName, deduplicationId: options.deduplicationId }, 'Duplicate message ignored');
          return existingMessage.id;
        }
      }

      const messageId = this.generateMessageId();
      const now = new Date();
      const scheduledAt = options.delaySeconds ? 
        new Date(now.getTime() + options.delaySeconds * 1000) : 
        undefined;

      const message: Message = {
        id: messageId,
        type: messageType,
        payload,
        headers: {
          ...options.headers,
          deduplicationId: options.deduplicationId,
        },
        metadata: {
          userId: options.context?.userId,
          sessionId: options.context?.sessionId,
          workflowId: options.context?.workflowId,
          executionId: options.context?.executionId,
          agentId: options.context?.agentId,
          source: options.context?.source,
          correlationId: options.context?.correlationId,
          causationId: options.context?.causationId,
          timestamp: now,
          retryCount: 0,
          maxRetries: 3,
          priority: options.priority || 'normal',
          ttl: options.ttl || 3600000,
        },
        createdAt: now,
        scheduledAt,
      };

      // Add to queue
      messages.push(message);

      // Sort by priority and creation time
      messages.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        const aPriority = priorityOrder[a.metadata.priority];
        const bPriority = priorityOrder[b.metadata.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      // Record metrics
      this.monitoringSystem.recordMetric(
        'messages_sent',
        1,
        'counter',
        { queue: queueName, type: messageType, priority: message.metadata.priority }
      );

      this.logger.info({
        queueName,
        messageId,
        messageType,
        priority: message.metadata.priority,
        scheduledAt: scheduledAt?.toISOString(),
      }, 'Message sent');

      this.emit('message:sent', { queueName, message });

      return messageId;

    } catch (error) {
      this.logger.error({
        queueName,
        messageType,
        error,
      }, 'Failed to send message');

      throw error;
    }
  }

  /**
   * Receive messages from a queue
   */
  async receiveMessages(
    queueName: string,
    options: {
      maxMessages?: number;
      waitTimeSeconds?: number;
      visibilityTimeout?: number;
    } = {}
  ): Promise<Message[]> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const maxMessages = options.maxMessages || 1;
      const visibilityTimeout = options.visibilityTimeout || queue.visibilityTimeout;
      const messages = this.messages.get(queueName) || [];
      const processingMessages = this.processingMessages.get(queueName) || new Set();

      const now = new Date();
      const visibleMessages: Message[] = [];

      // Find visible messages
      for (const message of messages) {
        if (visibleMessages.length >= maxMessages) break;
        
        // Skip if already processing
        if (processingMessages.has(message.id)) continue;
        
        // Skip if scheduled for future
        if (message.scheduledAt && message.scheduledAt > now) continue;
        
        // Skip if expired
        if (message.createdAt.getTime() + message.metadata.ttl < now.getTime()) {
          await this.moveToDeadLetterQueue(queueName, message, 'TTL_EXPIRED');
          continue;
        }

        visibleMessages.push(message);
        processingMessages.add(message.id);
      }

      // Record metrics
      this.monitoringSystem.recordMetric(
        'messages_received',
        visibleMessages.length,
        'counter',
        { queue: queueName }
      );

      this.logger.debug({
        queueName,
        messageCount: visibleMessages.length,
        maxMessages,
      }, 'Messages received');

      this.emit('messages:received', { queueName, messages: visibleMessages });

      return visibleMessages;

    } catch (error) {
      this.logger.error({
        queueName,
        error,
      }, 'Failed to receive messages');

      throw error;
    }
  }

  /**
   * Acknowledge a message
   */
  async acknowledgeMessage(queueName: string, messageId: string): Promise<void> {
    try {
      const messages = this.messages.get(queueName) || [];
      const processingMessages = this.processingMessages.get(queueName) || new Set();

      // Remove from processing
      processingMessages.delete(messageId);

      // Remove from queue
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        messages.splice(messageIndex, 1);
      }

      this.logger.debug({ queueName, messageId }, 'Message acknowledged');

      this.emit('message:acknowledged', { queueName, messageId });

    } catch (error) {
      this.logger.error({
        queueName,
        messageId,
        error,
      }, 'Failed to acknowledge message');

      throw error;
    }
  }

  /**
   * Reject a message
   */
  async rejectMessage(
    queueName: string,
    messageId: string,
    reason: string = 'REJECTED'
  ): Promise<void> {
    try {
      const messages = this.messages.get(queueName) || [];
      const processingMessages = this.processingMessages.get(queueName) || new Set();

      // Find message
      const message = messages.find(m => m.id === messageId);
      if (!message) {
        throw new Error(`Message ${messageId} not found`);
      }

      // Remove from processing
      processingMessages.delete(messageId);

      // Increment retry count
      message.metadata.retryCount++;

      const queue = this.queues.get(queueName);
      if (queue && message.metadata.retryCount >= queue.maxReceiveCount) {
        // Move to dead letter queue
        await this.moveToDeadLetterQueue(queueName, message, reason);
      } else {
        // Put back in queue for retry
        const retryDelay = this.calculateRetryDelay(message.metadata.retryCount);
        message.scheduledAt = new Date(Date.now() + retryDelay);
      }

      this.logger.info({
        queueName,
        messageId,
        retryCount: message.metadata.retryCount,
        reason,
      }, 'Message rejected');

      this.emit('message:rejected', { queueName, messageId, reason });

    } catch (error) {
      this.logger.error({
        queueName,
        messageId,
        error,
      }, 'Failed to reject message');

      throw error;
    }
  }

  /**
   * Register a message handler
   */
  registerHandler(queueName: string, handler: MessageHandler): void {
    const handlerKey = `${queueName}:handler`;
    this.handlers.set(handlerKey, handler);

    this.logger.info({ queueName }, 'Message handler registered');

    this.emit('handler:registered', { queueName });
  }

  /**
   * Start consuming messages from a queue
   */
  async startConsuming(config: ConsumerConfig): Promise<void> {
    try {
      const validatedConfig = ConsumerConfigSchema.parse(config);
      
      this.consumers.set(validatedConfig.queueName, validatedConfig);

      // Start processing interval
      this.startProcessing(validatedConfig.queueName);

      this.logger.info({
        queueName: validatedConfig.queueName,
        batchSize: validatedConfig.batchSize,
        maxConcurrency: validatedConfig.maxConcurrency,
      }, 'Started consuming messages');

      this.emit('consuming:started', { config: validatedConfig });

    } catch (error) {
      this.logger.error({ error, config }, 'Failed to start consuming');
      throw error;
    }
  }

  /**
   * Stop consuming messages from a queue
   */
  async stopConsuming(queueName: string): Promise<void> {
    try {
      this.stopProcessing(queueName);
      this.consumers.delete(queueName);

      this.logger.info({ queueName }, 'Stopped consuming messages');

      this.emit('consuming:stopped', { queueName });

    } catch (error) {
      this.logger.error({ error, queueName }, 'Failed to stop consuming');
      throw error;
    }
  }

  /**
   * Start processing messages for a queue
   */
  private startProcessing(queueName: string): void {
    const consumer = this.consumers.get(queueName);
    if (!consumer) return;

    const interval = setInterval(async () => {
      try {
        await this.processMessages(queueName);
      } catch (error) {
        this.logger.error({ queueName, error }, 'Failed to process messages');
      }
    }, 1000); // Process every second

    this.processingIntervals.set(queueName, interval);
  }

  /**
   * Stop processing messages for a queue
   */
  private stopProcessing(queueName: string): void {
    const interval = this.processingIntervals.get(queueName);
    if (interval) {
      clearInterval(interval);
      this.processingIntervals.delete(queueName);
    }
  }

  /**
   * Process messages for a queue
   */
  private async processMessages(queueName: string): Promise<void> {
    const consumer = this.consumers.get(queueName);
    if (!consumer) return;

    const handlerKey = `${queueName}:handler`;
    const handler = this.handlers.get(handlerKey);
    if (!handler) return;

    try {
      const messages = await this.receiveMessages(queueName, {
        maxMessages: consumer.batchSize,
        waitTimeSeconds: consumer.waitTimeSeconds,
      });

      for (const message of messages) {
        try {
          const context: MessageContext = {
            userId: message.metadata.userId,
            sessionId: message.metadata.sessionId,
            workflowId: message.metadata.workflowId,
            executionId: message.metadata.executionId,
            agentId: message.metadata.agentId,
            source: message.metadata.source,
            correlationId: message.metadata.correlationId,
            causationId: message.metadata.causationId,
          };

          await handler(message, context);

          if (consumer.autoAck) {
            await this.acknowledgeMessage(queueName, message.id);
          }

        } catch (error) {
          this.logger.error({
            queueName,
            messageId: message.id,
            error,
          }, 'Message processing failed');

          await this.rejectMessage(queueName, message.id, 'PROCESSING_FAILED');
        }
      }
    } catch (error) {
      this.logger.error({ queueName, error }, 'Failed to process messages');
    }
  }

  /**
   * Move message to dead letter queue
   */
  private async moveToDeadLetterQueue(
    queueName: string,
    message: Message,
    reason: string
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue?.deadLetterQueue) return;

    const deadLetterMessages = this.deadLetterQueues.get(queue.deadLetterQueue) || [];
    deadLetterMessages.push({
      ...message,
      headers: {
        ...message.headers,
        deadLetterReason: reason,
        originalQueue: queueName,
      },
    });

    this.deadLetterQueues.set(queue.deadLetterQueue, deadLetterMessages);

    // Remove from original queue
    const messages = this.messages.get(queueName) || [];
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex !== -1) {
      messages.splice(messageIndex, 1);
    }

    this.logger.info({
      queueName,
      messageId: message.id,
      deadLetterQueue: queue.deadLetterQueue,
      reason,
    }, 'Message moved to dead letter queue');

    this.emit('message:dead_letter', { queueName, message, reason });
  }

  /**
   * Calculate retry delay
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<QueueStats | null> {
    try {
      const queue = this.queues.get(queueName);
      if (!queue) return null;

      const messages = this.messages.get(queueName) || [];
      const processingMessages = this.processingMessages.get(queueName) || new Set();
      const deadLetterMessages = this.deadLetterQueues.get(queue.deadLetterQueue || '') || [];

      const now = new Date();
      const visibleMessages = messages.filter(m => 
        !processingMessages.has(m.id) && 
        (!m.scheduledAt || m.scheduledAt <= now)
      );
      
      const delayedMessages = messages.filter(m => 
        m.scheduledAt && m.scheduledAt > now
      );

      const oldestMessage = messages.reduce((oldest, current) => 
        current.createdAt < oldest.createdAt ? current : oldest,
        messages[0]
      );

      return {
        name: queueName,
        messageCount: messages.length,
        visibleMessageCount: visibleMessages.length,
        invisibleMessageCount: processingMessages.size,
        delayedMessageCount: delayedMessages.length,
        deadLetterMessageCount: deadLetterMessages.length,
        oldestMessageAge: oldestMessage ? now.getTime() - oldestMessage.createdAt.getTime() : 0,
        throughput: 0, // Would be calculated from metrics
      };
    } catch (error) {
      this.logger.error({ queueName, error }, 'Failed to get queue statistics');
      return null;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the message queue manager
   */
  async start(): Promise<void> {
    this.isRunning = true;
    this.logger.info('Message queue manager started');
  }

  /**
   * Stop the message queue manager
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Stop all processing
    for (const queueName of this.processingIntervals.keys()) {
      this.stopProcessing(queueName);
    }
    
    this.logger.info('Message queue manager stopped');
  }
}