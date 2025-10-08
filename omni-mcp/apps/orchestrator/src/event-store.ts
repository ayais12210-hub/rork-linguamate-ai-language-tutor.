import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { MonitoringSystem } from './monitoring-system.js';

// Event sourcing schemas
const EventSchema = z.object({
  id: z.string(),
  type: z.string(),
  aggregateId: z.string(),
  aggregateType: z.string(),
  version: z.number(),
  data: z.record(z.any()),
  metadata: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    workflowId: z.string().optional(),
    executionId: z.string().optional(),
    agentId: z.string().optional(),
    timestamp: z.date(),
    source: z.string().optional(),
    correlationId: z.string().optional(),
    causationId: z.string().optional(),
  }),
  createdAt: z.date(),
});

const SnapshotSchema = z.object({
  id: z.string(),
  aggregateId: z.string(),
  aggregateType: z.string(),
  version: z.number(),
  data: z.record(z.any()),
  metadata: z.object({
    createdAt: z.date(),
    eventCount: z.number(),
    lastEventId: z.string(),
  }),
});

const AggregateSchema = z.object({
  id: z.string(),
  type: z.string(),
  version: z.number(),
  data: z.record(z.any()),
  uncommittedEvents: z.array(EventSchema).default([]),
  metadata: z.record(z.any()).default({}),
});

const EventStoreConfigSchema = z.object({
  maxEventsPerSnapshot: z.number().default(100),
  snapshotRetentionDays: z.number().default(30),
  eventRetentionDays: z.number().default(365),
  batchSize: z.number().default(1000),
  enableCompression: z.boolean().default(true),
  enableEncryption: z.boolean().default(true),
});

export type Event = z.infer<typeof EventSchema>;
export type Snapshot = z.infer<typeof SnapshotSchema>;
export type Aggregate = z.infer<typeof AggregateSchema>;
export type EventStoreConfig = z.infer<typeof EventStoreConfigSchema>;

export interface EventStoreContext {
  userId?: string;
  sessionId?: string;
  workflowId?: string;
  executionId?: string;
  agentId?: string;
  source?: string;
  correlationId?: string;
  causationId?: string;
}

export interface EventHandler {
  (event: Event): Promise<void>;
}

export interface AggregateRepository {
  getById(aggregateId: string, aggregateType: string): Promise<Aggregate | null>;
  save(aggregate: Aggregate): Promise<void>;
  delete(aggregateId: string, aggregateType: string): Promise<void>;
}

export class EventStore extends EventEmitter {
  private events: Map<string, Event[]> = new Map(); // aggregateId -> events
  private snapshots: Map<string, Snapshot[]> = new Map(); // aggregateId -> snapshots
  private aggregates: Map<string, Aggregate> = new Map(); // aggregateId -> aggregate
  private eventHandlers: Map<string, EventHandler[]> = new Map(); // eventType -> handlers
  private config: EventStoreConfig;
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private monitoringSystem: MonitoringSystem;
  private isRunning: boolean = false;

  constructor(
    config: EventStoreConfig,
    configManager: ConfigManager,
    securityManager: SecurityManager,
    monitoringSystem: MonitoringSystem,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.config = EventStoreConfigSchema.parse(config);
    this.configManager = configManager;
    this.securityManager = securityManager;
    this.monitoringSystem = monitoringSystem;
    this.logger = logger;
  }

  /**
   * Append events to an aggregate
   */
  async appendEvents(
    aggregateId: string,
    aggregateType: string,
    events: Omit<Event, 'id' | 'aggregateId' | 'aggregateType' | 'version' | 'createdAt'>[],
    expectedVersion: number,
    context: EventStoreContext = {}
  ): Promise<void> {
    try {
      // Get current aggregate
      const aggregate = await this.getAggregate(aggregateId, aggregateType);
      
      // Check version
      if (aggregate && aggregate.version !== expectedVersion) {
        throw new Error(`Concurrency conflict: expected version ${expectedVersion}, got ${aggregate.version}`);
      }

      // Create events with proper metadata
      const newEvents: Event[] = events.map((event, index) => ({
        ...event,
        id: this.generateEventId(),
        aggregateId,
        aggregateType,
        version: (aggregate?.version || 0) + index + 1,
        metadata: {
          ...event.metadata,
          userId: context.userId,
          sessionId: context.sessionId,
          workflowId: context.workflowId,
          executionId: context.executionId,
          agentId: context.agentId,
          source: context.source,
          correlationId: context.correlationId,
          causationId: context.causationId,
          timestamp: new Date(),
        },
        createdAt: new Date(),
      }));

      // Store events
      if (!this.events.has(aggregateId)) {
        this.events.set(aggregateId, []);
      }
      
      const aggregateEvents = this.events.get(aggregateId)!;
      aggregateEvents.push(...newEvents);

      // Update aggregate
      const updatedAggregate: Aggregate = {
        id: aggregateId,
        type: aggregateType,
        version: newEvents[newEvents.length - 1].version,
        data: aggregate?.data || {},
        uncommittedEvents: [],
        metadata: aggregate?.metadata || {},
      };

      this.aggregates.set(aggregateId, updatedAggregate);

      // Record metrics
      this.monitoringSystem.recordMetric(
        'events_appended',
        newEvents.length,
        'counter',
        { aggregateType, eventTypes: newEvents.map(e => e.type).join(',') }
      );

      this.monitoringSystem.recordMetric(
        'aggregate_version',
        updatedAggregate.version,
        'gauge',
        { aggregateId, aggregateType }
      );

      // Emit events
      for (const event of newEvents) {
        this.emit('event:appended', { event });
        await this.handleEvent(event);
      }

      this.logger.info({
        aggregateId,
        aggregateType,
        eventCount: newEvents.length,
        version: updatedAggregate.version,
      }, 'Events appended successfully');

    } catch (error) {
      this.logger.error({
        aggregateId,
        aggregateType,
        expectedVersion,
        error,
      }, 'Failed to append events');

      throw error;
    }
  }

  /**
   * Get events for an aggregate
   */
  async getEvents(
    aggregateId: string,
    fromVersion: number = 0,
    toVersion?: number
  ): Promise<Event[]> {
    const events = this.events.get(aggregateId) || [];
    
    let filteredEvents = events.filter(event => event.version > fromVersion);
    
    if (toVersion !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.version <= toVersion);
    }

    return filteredEvents.sort((a, b) => a.version - b.version);
  }

  /**
   * Get aggregate by ID
   */
  async getAggregate(aggregateId: string, aggregateType: string): Promise<Aggregate | null> {
    const aggregate = this.aggregates.get(aggregateId);
    
    if (!aggregate || aggregate.type !== aggregateType) {
      return null;
    }

    return { ...aggregate };
  }

  /**
   * Rebuild aggregate from events
   */
  async rebuildAggregate(aggregateId: string, aggregateType: string): Promise<Aggregate | null> {
    try {
      // Get latest snapshot
      const snapshot = await this.getLatestSnapshot(aggregateId);
      
      // Get events after snapshot
      const events = await this.getEvents(
        aggregateId,
        snapshot ? snapshot.version : 0
      );

      // Start with snapshot data or empty aggregate
      let aggregate: Aggregate = snapshot ? {
        id: aggregateId,
        type: aggregateType,
        version: snapshot.version,
        data: snapshot.data,
        uncommittedEvents: [],
        metadata: {},
      } : {
        id: aggregateId,
        type: aggregateType,
        version: 0,
        data: {},
        uncommittedEvents: [],
        metadata: {},
      };

      // Apply events
      for (const event of events) {
        aggregate = await this.applyEvent(aggregate, event);
      }

      // Update aggregate version
      aggregate.version = events.length > 0 ? events[events.length - 1].version : aggregate.version;

      this.logger.info({
        aggregateId,
        aggregateType,
        version: aggregate.version,
        eventCount: events.length,
        fromSnapshot: !!snapshot,
      }, 'Aggregate rebuilt from events');

      return aggregate;

    } catch (error) {
      this.logger.error({
        aggregateId,
        aggregateType,
        error,
      }, 'Failed to rebuild aggregate');

      return null;
    }
  }

  /**
   * Create snapshot for an aggregate
   */
  async createSnapshot(aggregateId: string, aggregateType: string): Promise<void> {
    try {
      const aggregate = await this.getAggregate(aggregateId, aggregateType);
      if (!aggregate) {
        throw new Error(`Aggregate ${aggregateId} not found`);
      }

      const events = this.events.get(aggregateId) || [];
      const lastEvent = events[events.length - 1];

      const snapshot: Snapshot = {
        id: this.generateSnapshotId(),
        aggregateId,
        aggregateType,
        version: aggregate.version,
        data: aggregate.data,
        metadata: {
          createdAt: new Date(),
          eventCount: events.length,
          lastEventId: lastEvent?.id || '',
        },
      };

      // Store snapshot
      if (!this.snapshots.has(aggregateId)) {
        this.snapshots.set(aggregateId, []);
      }
      
      this.snapshots.get(aggregateId)!.push(snapshot);

      // Clean up old snapshots
      await this.cleanupOldSnapshots(aggregateId);

      this.logger.info({
        aggregateId,
        aggregateType,
        version: aggregate.version,
        eventCount: events.length,
      }, 'Snapshot created');

      this.emit('snapshot:created', { snapshot });

    } catch (error) {
      this.logger.error({
        aggregateId,
        aggregateType,
        error,
      }, 'Failed to create snapshot');

      throw error;
    }
  }

  /**
   * Get latest snapshot for an aggregate
   */
  async getLatestSnapshot(aggregateId: string): Promise<Snapshot | null> {
    const snapshots = this.snapshots.get(aggregateId) || [];
    
    if (snapshots.length === 0) {
      return null;
    }

    return snapshots.sort((a, b) => b.version - a.version)[0];
  }

  /**
   * Register event handler
   */
  registerEventHandler(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);

    this.logger.info({ eventType }, 'Event handler registered');
  }

  /**
   * Handle event
   */
  private async handleEvent(event: Event): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error({
          eventId: event.id,
          eventType: event.type,
          aggregateId: event.aggregateId,
          error,
        }, 'Event handler failed');
      }
    }
  }

  /**
   * Apply event to aggregate
   */
  private async applyEvent(aggregate: Aggregate, event: Event): Promise<Aggregate> {
    // This is a placeholder - actual implementation would depend on the aggregate type
    // and the specific event handling logic
    
    const updatedAggregate = { ...aggregate };
    
    // Update version
    updatedAggregate.version = event.version;
    
    // Apply event data to aggregate data
    // This would be implemented based on specific business logic
    updatedAggregate.data = {
      ...updatedAggregate.data,
      ...event.data,
    };

    return updatedAggregate;
  }

  /**
   * Replay events for an aggregate
   */
  async replayEvents(
    aggregateId: string,
    fromVersion: number = 0,
    toVersion?: number,
    eventTypes?: string[]
  ): Promise<Event[]> {
    const events = await this.getEvents(aggregateId, fromVersion, toVersion);
    
    let filteredEvents = events;
    
    if (eventTypes && eventTypes.length > 0) {
      filteredEvents = events.filter(event => eventTypes.includes(event.type));
    }

    this.logger.info({
      aggregateId,
      fromVersion,
      toVersion,
      eventTypes,
      eventCount: filteredEvents.length,
    }, 'Events replayed');

    return filteredEvents;
  }

  /**
   * Get event statistics
   */
  getEventStatistics(): {
    totalEvents: number;
    totalAggregates: number;
    totalSnapshots: number;
    eventsByType: Record<string, number>;
    eventsByAggregateType: Record<string, number>;
  } {
    const totalEvents = Array.from(this.events.values()).reduce((sum, events) => sum + events.length, 0);
    const totalAggregates = this.aggregates.size;
    const totalSnapshots = Array.from(this.snapshots.values()).reduce((sum, snapshots) => sum + snapshots.length, 0);
    
    const eventsByType: Record<string, number> = {};
    const eventsByAggregateType: Record<string, number> = {};
    
    for (const events of this.events.values()) {
      for (const event of events) {
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
        eventsByAggregateType[event.aggregateType] = (eventsByAggregateType[event.aggregateType] || 0) + 1;
      }
    }

    return {
      totalEvents,
      totalAggregates,
      totalSnapshots,
      eventsByType,
      eventsByAggregateType,
    };
  }

  /**
   * Cleanup old snapshots
   */
  private async cleanupOldSnapshots(aggregateId: string): Promise<void> {
    const snapshots = this.snapshots.get(aggregateId) || [];
    
    if (snapshots.length <= 1) {
      return; // Keep at least one snapshot
    }

    // Sort by version descending and keep only the latest
    const sortedSnapshots = snapshots.sort((a, b) => b.version - a.version);
    const snapshotsToKeep = sortedSnapshots.slice(0, 1);
    
    this.snapshots.set(aggregateId, snapshotsToKeep);

    this.logger.debug({
      aggregateId,
      removedSnapshots: snapshots.length - snapshotsToKeep.length,
    }, 'Old snapshots cleaned up');
  }

  /**
   * Cleanup old events
   */
  private async cleanupOldEvents(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.eventRetentionDays);

    let totalRemoved = 0;

    for (const [aggregateId, events] of this.events) {
      const filteredEvents = events.filter(event => event.createdAt > cutoffDate);
      const removed = events.length - filteredEvents.length;
      
      if (removed > 0) {
        this.events.set(aggregateId, filteredEvents);
        totalRemoved += removed;
      }
    }

    if (totalRemoved > 0) {
      this.logger.info({
        removedEvents: totalRemoved,
        retentionDays: this.config.eventRetentionDays,
      }, 'Old events cleaned up');
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the event store
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Start periodic cleanup
    setInterval(() => {
      this.cleanupOldEvents();
    }, 24 * 60 * 60 * 1000); // Daily cleanup

    // Start periodic snapshot creation
    setInterval(async () => {
      for (const [aggregateId, events] of this.events) {
        if (events.length >= this.config.maxEventsPerSnapshot) {
          const aggregate = this.aggregates.get(aggregateId);
          if (aggregate) {
            try {
              await this.createSnapshot(aggregateId, aggregate.type);
            } catch (error) {
              this.logger.error({ aggregateId, error }, 'Failed to create periodic snapshot');
            }
          }
        }
      }
    }, 60 * 60 * 1000); // Hourly snapshot check

    this.logger.info('Event store started');
  }

  /**
   * Stop the event store
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Event store stopped');
  }
}