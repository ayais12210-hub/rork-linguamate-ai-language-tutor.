import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppError, createAppError } from '@/lib/errors/AppError';
import { Result, wrapAsync } from '@/lib/errors/result';
import { isNetworkAvailable } from './netStatus';

export interface RetryableAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface RetryQueueConfig {
  maxRetries: number;
  retryDelay: number;
  maxRetryDelay: number;
  backoffMultiplier: number;
  maxQueueSize: number;
  batchSize: number;
}

const DEFAULT_CONFIG: RetryQueueConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  maxRetryDelay: 30000,
  backoffMultiplier: 2,
  maxQueueSize: 100,
  batchSize: 5,
};

const STORAGE_KEY = 'retry_queue';
const PROCESSING_KEY = 'retry_queue_processing';

class RetryQueue {
  private config: RetryQueueConfig;
  private queue: RetryableAction[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private actionHandlers: Map<string, (payload: unknown) => Promise<Result<unknown>>> = new Map();

  constructor(config: Partial<RetryQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<Result<void>> {
    return wrapAsync(async () => {
      // Load existing queue from storage
      const storedQueue = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedQueue) {
        try {
          this.queue = JSON.parse(storedQueue);
        } catch (error) {
          console.warn('Failed to parse stored retry queue:', error);
          this.queue = [];
        }
      }

      // Start processing if we have items and network is available
      if (this.queue.length > 0 && isNetworkAvailable()) {
        this.startProcessing();
      }
    });
  }

  async addAction(
    type: string,
    payload: unknown,
    options: {
      priority?: number;
      maxRetries?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Result<string>> {
    return wrapAsync(async () => {
      if (this.queue.length >= this.config.maxQueueSize) {
        return createAppError(
          'StorageError',
          'Retry queue is full',
          { context: { queueSize: this.queue.length, maxSize: this.config.maxQueueSize } }
        );
      }

      const action: RetryableAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: options.maxRetries ?? this.config.maxRetries,
        priority: options.priority ?? 0,
        metadata: options.metadata,
      };

      this.queue.push(action);
      this.queue.sort((a, b) => b.priority - a.priority);

      await this.persistQueue();

      // Start processing if network is available
      if (isNetworkAvailable() && !this.isProcessing) {
        this.startProcessing();
      }

      return action.id;
    });
  }

  registerActionHandler(
    type: string,
    handler: (payload: unknown) => Promise<Result<unknown>>
  ): void {
    this.actionHandlers.set(type, handler);
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    await AsyncStorage.setItem(PROCESSING_KEY, 'true');

    this.processingInterval = setInterval(async () => {
      await this.processBatch();
    }, this.config.retryDelay);
  }

  private async stopProcessing(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    await AsyncStorage.removeItem(PROCESSING_KEY);
  }

  private async processBatch(): Promise<void> {
    if (!isNetworkAvailable() || this.queue.length === 0) {
      await this.stopProcessing();
      return;
    }

    const batch = this.queue.splice(0, this.config.batchSize);
    const results: Promise<void>[] = [];

    for (const action of batch) {
      results.push(this.processAction(action));
    }

    await Promise.all(results);
    await this.persistQueue();

    // Stop processing if queue is empty
    if (this.queue.length === 0) {
      await this.stopProcessing();
    }
  }

  private async processAction(action: RetryableAction): Promise<void> {
    const handler = this.actionHandlers.get(action.type);
    if (!handler) {
      console.warn(`No handler registered for action type: ${action.type}`);
      return;
    }

    try {
      const result = await handler(action.payload);
      
      if (result.ok) {
        console.log(`Successfully processed action ${action.id}`);
        return;
      }

      // Handle failure
      action.retryCount++;
      
      if (action.retryCount >= action.maxRetries) {
        console.error(`Action ${action.id} failed after ${action.maxRetries} retries`);
        return;
      }

      // Add back to queue with exponential backoff delay
      const delay = Math.min(
        this.config.retryDelay * Math.pow(this.config.backoffMultiplier, action.retryCount - 1),
        this.config.maxRetryDelay
      );

      setTimeout(() => {
        this.queue.push(action);
        this.queue.sort((a, b) => b.priority - a.priority);
      }, delay);

    } catch (error) {
      console.error(`Error processing action ${action.id}:`, error);
      action.retryCount++;
      
      if (action.retryCount < action.maxRetries) {
        this.queue.push(action);
      }
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist retry queue:', error);
    }
  }

  async clear(): Promise<Result<void>> {
    return wrapAsync(async () => {
      this.queue = [];
      await AsyncStorage.removeItem(STORAGE_KEY);
      await this.stopProcessing();
    });
  }

  async getQueueStatus(): Promise<{
    total: number;
    byType: Record<string, number>;
    oldestAction?: RetryableAction;
  }> {
    const byType: Record<string, number> = {};
    let oldestAction: RetryableAction | undefined;

    for (const action of this.queue) {
      byType[action.type] = (byType[action.type] || 0) + 1;
      
      if (!oldestAction || action.timestamp < oldestAction.timestamp) {
        oldestAction = action;
      }
    }

    return {
      total: this.queue.length,
      byType,
      oldestAction,
    };
  }

  // Resume processing when network comes back online
  async resumeOnNetworkAvailable(): Promise<void> {
    if (isNetworkAvailable() && this.queue.length > 0 && !this.isProcessing) {
      await this.startProcessing();
    }
  }
}

// Global retry queue instance
export const retryQueue = new RetryQueue();

// Initialize retry queue on app start
export async function initializeRetryQueue(): Promise<Result<void>> {
  return retryQueue.initialize();
}

// Register common action handlers
export function registerCommonHandlers(): void {
  // Example: Progress sync handler
  retryQueue.registerActionHandler('sync_progress', async (payload) => {
    // This would be implemented based on your actual sync logic
    console.log('Syncing progress:', payload);
    return { ok: true, value: null };
  });

  // Example: Streak save handler
  retryQueue.registerActionHandler('save_streak', async (payload) => {
    // This would be implemented based on your actual streak logic
    console.log('Saving streak:', payload);
    return { ok: true, value: null };
  });
}