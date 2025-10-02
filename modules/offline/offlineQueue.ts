import { storageHelpers, STORAGE_KEYS } from '@/lib/storage';
import { offlineManager } from './index';

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  attempts: number;
  nextAttemptAt: number;
  priority: 'low' | 'normal' | 'high';
}

const QUEUE_STORAGE_KEY = STORAGE_KEYS.OFFLINE_QUEUE;
const MAX_ATTEMPTS = 5;
const BASE_DELAY = 1000;
const MAX_DELAY = 300000;
const JITTER_RANGE = 0.2;

class OfflineQueue {
  private queue: QueuedAction[] = [];
  private isProcessing: boolean = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  async initialize() {
    console.log('[OfflineQueue] Initializing queue');
    try {
      const stored = await storageHelpers.getObject<QueuedAction[]>(QUEUE_STORAGE_KEY);
      if (stored && Array.isArray(stored)) {
        this.queue = stored;
        console.log('[OfflineQueue] Loaded', this.queue.length, 'queued actions');
        offlineManager.setUnsyncedCount(this.queue.length);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
    }
  }

  async enqueue(type: string, payload: unknown, priority: 'low' | 'normal' | 'high' = 'normal') {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      attempts: 0,
      nextAttemptAt: Date.now(),
      priority,
    };

    console.log('[OfflineQueue] Enqueuing action:', { type, priority, id: action.id });

    this.queue.push(action);
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    await this.persist();
    offlineManager.incrementUnsyncedCount();

    if (!offlineManager.currentStatus.isOffline) {
      this.scheduleFlush();
    }
  }

  async dequeue(actionId: string) {
    console.log('[OfflineQueue] Dequeuing action:', actionId);
    this.queue = this.queue.filter(action => action.id !== actionId);
    await this.persist();
    offlineManager.decrementUnsyncedCount();
  }

  async updateAction(actionId: string, updates: Partial<QueuedAction>) {
    const action = this.queue.find(a => a.id === actionId);
    if (action) {
      Object.assign(action, updates);
      await this.persist();
    }
  }

  private async persist() {
    try {
      await storageHelpers.setObject(QUEUE_STORAGE_KEY, this.queue);
    } catch (error) {
      console.error('[OfflineQueue] Failed to persist queue:', error);
    }
  }

  private calculateBackoff(attempts: number): number {
    const exponentialDelay = Math.min(BASE_DELAY * Math.pow(2, attempts), MAX_DELAY);
    const jitter = exponentialDelay * JITTER_RANGE * (Math.random() * 2 - 1);
    return Math.floor(exponentialDelay + jitter);
  }

  scheduleFlush(immediate: boolean = false) {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    const delay = immediate ? 0 : 1000;
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, delay) as ReturnType<typeof setTimeout>;
  }

  async flush() {
    if (this.isProcessing) {
      console.log('[OfflineQueue] Already processing, skipping flush');
      return;
    }

    if (offlineManager.currentStatus.isOffline) {
      console.log('[OfflineQueue] Offline, skipping flush');
      return;
    }

    if (this.queue.length === 0) {
      console.log('[OfflineQueue] Queue empty, nothing to flush');
      return;
    }

    this.isProcessing = true;
    console.log('[OfflineQueue] Starting flush of', this.queue.length, 'actions');

    const now = Date.now();
    const actionsToProcess = this.queue.filter(action => action.nextAttemptAt <= now);

    console.log('[OfflineQueue] Processing', actionsToProcess.length, 'ready actions');

    for (const action of actionsToProcess) {
      try {
        console.log('[OfflineQueue] Processing action:', {
          id: action.id,
          type: action.type,
          attempts: action.attempts,
        });

        await this.processAction(action);
        await this.dequeue(action.id);
        
        console.log('[OfflineQueue] Action processed successfully:', action.id);
      } catch (error) {
        console.error('[OfflineQueue] Action failed:', action.id, error);

        action.attempts += 1;

        if (action.attempts >= MAX_ATTEMPTS) {
          console.error('[OfflineQueue] Max attempts reached, removing action:', action.id);
          await this.dequeue(action.id);
        } else {
          const backoffDelay = this.calculateBackoff(action.attempts);
          action.nextAttemptAt = Date.now() + backoffDelay;
          await this.updateAction(action.id, {
            attempts: action.attempts,
            nextAttemptAt: action.nextAttemptAt,
          });
          console.log('[OfflineQueue] Scheduled retry in', backoffDelay, 'ms');
        }
      }
    }

    this.isProcessing = false;

    if (this.queue.length > 0) {
      const nextAction = this.queue.reduce((earliest, action) => 
        action.nextAttemptAt < earliest.nextAttemptAt ? action : earliest
      );
      const delayUntilNext = Math.max(0, nextAction.nextAttemptAt - Date.now());
      console.log('[OfflineQueue] Scheduling next flush in', delayUntilNext, 'ms');
      this.scheduleFlush();
    } else {
      console.log('[OfflineQueue] Queue empty after flush');
      offlineManager.setLastSync(new Date());
    }
  }

  private async processAction(action: QueuedAction): Promise<void> {
    console.log('[OfflineQueue] Processing action type:', action.type);
    
    switch (action.type) {
      case 'UPDATE_PROGRESS':
      case 'COMPLETE_LESSON':
      case 'UPDATE_VOCABULARY':
      case 'SAVE_CHAT_MESSAGE':
        console.log('[OfflineQueue] Simulating sync for:', action.type);
        await new Promise(resolve => setTimeout(resolve, 500));
        break;
      
      default:
        console.warn('[OfflineQueue] Unknown action type:', action.type);
    }
  }

  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  async clear() {
    console.log('[OfflineQueue] Clearing queue');
    this.queue = [];
    await this.persist();
    offlineManager.setUnsyncedCount(0);
  }
}

export const offlineQueue = new OfflineQueue();
