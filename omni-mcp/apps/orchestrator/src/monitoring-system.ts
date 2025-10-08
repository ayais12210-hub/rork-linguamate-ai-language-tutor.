import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';

// Monitoring schemas
const MetricSchema = z.object({
  name: z.string(),
  type: z.enum(['counter', 'gauge', 'histogram', 'summary']),
  value: z.number(),
  labels: z.record(z.string()).default({}),
  timestamp: z.date(),
  metadata: z.record(z.any()).default({}),
});

const AlertSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  condition: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  enabled: z.boolean().default(true),
  threshold: z.number().optional(),
  duration: z.number().default(0), // seconds
  actions: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

const AlertEventSchema = z.object({
  id: z.string(),
  alertId: z.string(),
  status: z.enum(['firing', 'resolved']),
  value: z.number(),
  threshold: z.number().optional(),
  message: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).default({}),
});

const TraceSchema = z.object({
  id: z.string(),
  operationName: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  status: z.enum(['success', 'error', 'timeout']).default('success'),
  spans: z.array(z.object({
    id: z.string(),
    operationName: z.string(),
    startTime: z.date(),
    endTime: z.date().optional(),
    duration: z.number().optional(),
    tags: z.record(z.string()).default({}),
    logs: z.array(z.object({
      timestamp: z.date(),
      message: z.string(),
      fields: z.record(z.any()).default({}),
    })).default([]),
  })).default([]),
  tags: z.record(z.string()).default({}),
  metadata: z.record(z.any()).default({}),
});

const HealthCheckSchema = z.object({
  name: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  timestamp: z.date(),
  duration: z.number().optional(),
  metadata: z.record(z.any()).default({}),
});

export type Metric = z.infer<typeof MetricSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type AlertEvent = z.infer<typeof AlertEventSchema>;
export type Trace = z.infer<typeof TraceSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;

export interface MonitoringContext {
  userId?: string;
  sessionId?: string;
  workflowId?: string;
  executionId?: string;
  agentId?: string;
  metadata: Record<string, any>;
}

export interface MonitoringConfig {
  metricsRetentionDays: number;
  alertRetentionDays: number;
  traceRetentionDays: number;
  healthCheckInterval: number;
  alertEvaluationInterval: number;
  maxMetricsPerMinute: number;
  maxTracesPerMinute: number;
}

export class MonitoringSystem extends EventEmitter {
  private metrics: Map<string, Metric[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertEvents: AlertEvent[] = [];
  private traces: Map<string, Trace> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private config: MonitoringConfig;
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
    this.config = {
      metricsRetentionDays: 30,
      alertRetentionDays: 90,
      traceRetentionDays: 7,
      healthCheckInterval: 30000, // 30 seconds
      alertEvaluationInterval: 60000, // 1 minute
      maxMetricsPerMinute: 1000,
      maxTracesPerMinute: 100,
    };
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    type: Metric['type'],
    labels: Record<string, string> = {},
    context: MonitoringContext = { metadata: {} }
  ): void {
    const metric: Metric = {
      name,
      type,
      value,
      labels: {
        ...labels,
        userId: context.userId || 'unknown',
        sessionId: context.sessionId || 'unknown',
        workflowId: context.workflowId || 'unknown',
        executionId: context.executionId || 'unknown',
        agentId: context.agentId || 'unknown',
      },
      timestamp: new Date(),
      metadata: context.metadata,
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Emit event
    this.emit('metric:recorded', { metric });

    this.logger.debug({
      metric: name,
      value,
      type,
      labels,
    }, 'Metric recorded');
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(
    name: string,
    labels: Record<string, string> = {},
    context: MonitoringContext = { metadata: {} }
  ): void {
    this.recordMetric(name, 1, 'counter', labels, context);
  }

  /**
   * Set a gauge metric
   */
  setGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    context: MonitoringContext = { metadata: {} }
  ): void {
    this.recordMetric(name, value, 'gauge', labels, context);
  }

  /**
   * Record a histogram metric
   */
  recordHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    context: MonitoringContext = { metadata: {} }
  ): void {
    this.recordMetric(name, value, 'histogram', labels, context);
  }

  /**
   * Record a summary metric
   */
  recordSummary(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    context: MonitoringContext = { metadata: {} }
  ): void {
    this.recordMetric(name, value, 'summary', labels, context);
  }

  /**
   * Create an alert
   */
  createAlert(alert: Alert): void {
    const validatedAlert = AlertSchema.parse(alert);
    this.alerts.set(validatedAlert.id, validatedAlert);

    this.logger.info({
      alertId: validatedAlert.id,
      name: validatedAlert.name,
      severity: validatedAlert.severity,
    }, 'Alert created');

    this.emit('alert:created', { alert: validatedAlert });
  }

  /**
   * Update an alert
   */
  updateAlert(alertId: string, updates: Partial<Alert>): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    const updatedAlert = { ...alert, ...updates };
    this.alerts.set(alertId, updatedAlert);

    this.logger.info({
      alertId,
      updates,
    }, 'Alert updated');

    this.emit('alert:updated', { alertId, alert: updatedAlert });
  }

  /**
   * Delete an alert
   */
  deleteAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      this.alerts.delete(alertId);
      
      this.logger.info({ alertId }, 'Alert deleted');
      this.emit('alert:deleted', { alertId, alert });
    }
  }

  /**
   * Evaluate alerts
   */
  async evaluateAlerts(): Promise<void> {
    for (const [alertId, alert] of this.alerts) {
      if (!alert.enabled) continue;

      try {
        const shouldFire = await this.evaluateAlertCondition(alert);
        const isCurrentlyFiring = this.isAlertFiring(alertId);

        if (shouldFire && !isCurrentlyFiring) {
          await this.fireAlert(alert);
        } else if (!shouldFire && isCurrentlyFiring) {
          await this.resolveAlert(alert);
        }
      } catch (error) {
        this.logger.error({
          alertId,
          error,
        }, 'Failed to evaluate alert');
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private async evaluateAlertCondition(alert: Alert): Promise<boolean> {
    // Simple condition evaluation - can be enhanced with a proper expression parser
    const condition = alert.condition;
    
    // Parse condition like "metric_name > threshold" or "metric_name < threshold"
    const match = condition.match(/^(\w+)\s*([><=!]+)\s*(\d+(?:\.\d+)?)$/);
    if (!match) {
      this.logger.warn({ alertId: alert.id, condition }, 'Invalid alert condition format');
      return false;
    }

    const [, metricName, operator, thresholdStr] = match;
    const threshold = parseFloat(thresholdStr);
    const metricValue = this.getLatestMetricValue(metricName);

    if (metricValue === null) {
      return false;
    }

    switch (operator) {
      case '>':
        return metricValue > threshold;
      case '<':
        return metricValue < threshold;
      case '>=':
        return metricValue >= threshold;
      case '<=':
        return metricValue <= threshold;
      case '==':
        return metricValue === threshold;
      case '!=':
        return metricValue !== threshold;
      default:
        return false;
    }
  }

  /**
   * Get latest metric value
   */
  private getLatestMetricValue(metricName: string): number | null {
    const metrics = this.metrics.get(metricName);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    // Get the latest metric
    const latestMetric = metrics[metrics.length - 1];
    return latestMetric.value;
  }

  /**
   * Fire an alert
   */
  private async fireAlert(alert: Alert): Promise<void> {
    const alertEvent: AlertEvent = {
      id: this.generateEventId(),
      alertId: alert.id,
      status: 'firing',
      value: this.getLatestMetricValue(alert.condition.split(' ')[0]) || 0,
      threshold: alert.threshold,
      message: `${alert.name} is firing: ${alert.condition}`,
      timestamp: new Date(),
      metadata: alert.metadata,
    };

    this.alertEvents.push(alertEvent);

    this.logger.warn({
      alertId: alert.id,
      name: alert.name,
      severity: alert.severity,
      condition: alert.condition,
    }, 'Alert fired');

    this.emit('alert:fired', { alert, event: alertEvent });

    // Execute alert actions
    for (const action of alert.actions) {
      await this.executeAlertAction(action, alert, alertEvent);
    }
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(alert: Alert): Promise<void> {
    const alertEvent: AlertEvent = {
      id: this.generateEventId(),
      alertId: alert.id,
      status: 'resolved',
      value: this.getLatestMetricValue(alert.condition.split(' ')[0]) || 0,
      threshold: alert.threshold,
      message: `${alert.name} has been resolved`,
      timestamp: new Date(),
      metadata: alert.metadata,
    };

    this.alertEvents.push(alertEvent);

    this.logger.info({
      alertId: alert.id,
      name: alert.name,
    }, 'Alert resolved');

    this.emit('alert:resolved', { alert, event: alertEvent });
  }

  /**
   * Check if alert is currently firing
   */
  private isAlertFiring(alertId: string): boolean {
    const recentEvents = this.alertEvents.filter(event => 
      event.alertId === alertId && 
      event.status === 'firing' &&
      Date.now() - event.timestamp.getTime() < 300000 // 5 minutes
    );
    return recentEvents.length > 0;
  }

  /**
   * Execute alert action
   */
  private async executeAlertAction(action: string, alert: Alert, event: AlertEvent): Promise<void> {
    try {
      switch (action) {
        case 'log':
          this.logger.error({
            alertId: alert.id,
            name: alert.name,
            severity: alert.severity,
            condition: alert.condition,
            value: event.value,
            threshold: event.threshold,
          }, 'Alert action: log');
          break;

        case 'notify':
          this.emit('alert:notify', { alert, event });
          break;

        case 'webhook':
          // Webhook action would be implemented here
          this.emit('alert:webhook', { alert, event });
          break;

        default:
          this.logger.warn({ action, alertId: alert.id }, 'Unknown alert action');
      }
    } catch (error) {
      this.logger.error({
        action,
        alertId: alert.id,
        error,
      }, 'Failed to execute alert action');
    }
  }

  /**
   * Start a trace
   */
  startTrace(
    operationName: string,
    context: MonitoringContext = { metadata: {} }
  ): string {
    const traceId = this.generateTraceId();
    const trace: Trace = {
      id: traceId,
      operationName,
      startTime: new Date(),
      status: 'success',
      spans: [],
      tags: {
        userId: context.userId || 'unknown',
        sessionId: context.sessionId || 'unknown',
        workflowId: context.workflowId || 'unknown',
        executionId: context.executionId || 'unknown',
        agentId: context.agentId || 'unknown',
      },
      metadata: context.metadata,
    };

    this.traces.set(traceId, trace);

    this.logger.debug({
      traceId,
      operationName,
    }, 'Trace started');

    this.emit('trace:started', { trace });
    return traceId;
  }

  /**
   * Finish a trace
   */
  finishTrace(
    traceId: string,
    status: Trace['status'] = 'success',
    metadata: Record<string, any> = {}
  ): void {
    const trace = this.traces.get(traceId);
    if (!trace) {
      this.logger.warn({ traceId }, 'Trace not found');
      return;
    }

    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();
    trace.status = status;
    trace.metadata = { ...trace.metadata, ...metadata };

    this.logger.debug({
      traceId,
      operationName: trace.operationName,
      duration: trace.duration,
      status,
    }, 'Trace finished');

    this.emit('trace:finished', { trace });
  }

  /**
   * Add a span to a trace
   */
  addSpan(
    traceId: string,
    operationName: string,
    tags: Record<string, string> = {},
    logs: Array<{ timestamp: Date; message: string; fields: Record<string, any> }> = []
  ): string {
    const trace = this.traces.get(traceId);
    if (!trace) {
      this.logger.warn({ traceId }, 'Trace not found');
      return '';
    }

    const spanId = this.generateSpanId();
    const span = {
      id: spanId,
      operationName,
      startTime: new Date(),
      tags,
      logs,
    };

    trace.spans.push(span);

    this.logger.debug({
      traceId,
      spanId,
      operationName,
    }, 'Span added to trace');

    return spanId;
  }

  /**
   * Finish a span
   */
  finishSpan(traceId: string, spanId: string): void {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return;
    }

    const span = trace.spans.find(s => s.id === spanId);
    if (!span) {
      return;
    }

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();

    this.logger.debug({
      traceId,
      spanId,
      duration: span.duration,
    }, 'Span finished');
  }

  /**
   * Record a health check
   */
  recordHealthCheck(
    name: string,
    status: HealthCheck['status'],
    message?: string,
    duration?: number,
    metadata: Record<string, any> = {}
  ): void {
    const healthCheck: HealthCheck = {
      name,
      status,
      message,
      timestamp: new Date(),
      duration,
      metadata,
    };

    this.healthChecks.set(name, healthCheck);

    this.logger.debug({
      name,
      status,
      message,
      duration,
    }, 'Health check recorded');

    this.emit('health:checked', { healthCheck });
  }

  /**
   * Get metrics
   */
  getMetrics(
    name?: string,
    filters: {
      startTime?: Date;
      endTime?: Date;
      labels?: Record<string, string>;
      limit?: number;
    } = {}
  ): Metric[] {
    let metrics: Metric[] = [];

    if (name) {
      metrics = this.metrics.get(name) || [];
    } else {
      metrics = Array.from(this.metrics.values()).flat();
    }

    // Apply filters
    if (filters.startTime) {
      metrics = metrics.filter(m => m.timestamp >= filters.startTime!);
    }

    if (filters.endTime) {
      metrics = metrics.filter(m => m.timestamp <= filters.endTime!);
    }

    if (filters.labels) {
      metrics = metrics.filter(m => {
        for (const [key, value] of Object.entries(filters.labels!)) {
          if (m.labels[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Sort by timestamp
    metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (filters.limit) {
      metrics = metrics.slice(-filters.limit);
    }

    return metrics;
  }

  /**
   * Get alerts
   */
  getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alert events
   */
  getAlertEvents(filters: {
    alertId?: string;
    status?: AlertEvent['status'];
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}): AlertEvent[] {
    let events = [...this.alertEvents];

    if (filters.alertId) {
      events = events.filter(e => e.alertId === filters.alertId);
    }

    if (filters.status) {
      events = events.filter(e => e.status === filters.status);
    }

    if (filters.startTime) {
      events = events.filter(e => e.timestamp >= filters.startTime!);
    }

    if (filters.endTime) {
      events = events.filter(e => e.timestamp <= filters.endTime!);
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  /**
   * Get traces
   */
  getTraces(filters: {
    operationName?: string;
    status?: Trace['status'];
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}): Trace[] {
    let traces = Array.from(this.traces.values());

    if (filters.operationName) {
      traces = traces.filter(t => t.operationName === filters.operationName);
    }

    if (filters.status) {
      traces = traces.filter(t => t.status === filters.status);
    }

    if (filters.startTime) {
      traces = traces.filter(t => t.startTime >= filters.startTime!);
    }

    if (filters.endTime) {
      traces = traces.filter(t => t.startTime <= filters.endTime!);
    }

    // Sort by start time descending
    traces.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    if (filters.limit) {
      traces = traces.slice(0, filters.limit);
    }

    return traces;
  }

  /**
   * Get health checks
   */
  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData(): {
    metrics: Record<string, { latest: number; trend: number }>;
    alerts: { total: number; firing: number; resolved: number };
    traces: { total: number; successRate: number; averageDuration: number };
    healthChecks: { total: number; healthy: number; degraded: number; unhealthy: number };
  } {
    const metrics: Record<string, { latest: number; trend: number }> = {};
    for (const [name, metricList] of this.metrics) {
      if (metricList.length > 0) {
        const latest = metricList[metricList.length - 1].value;
        const previous = metricList.length > 1 ? metricList[metricList.length - 2].value : latest;
        const trend = latest - previous;
        metrics[name] = { latest, trend };
      }
    }

    const alerts = {
      total: this.alerts.size,
      firing: this.alertEvents.filter(e => e.status === 'firing').length,
      resolved: this.alertEvents.filter(e => e.status === 'resolved').length,
    };

    const traces = Array.from(this.traces.values());
    const tracesData = {
      total: traces.length,
      successRate: traces.length > 0 ? (traces.filter(t => t.status === 'success').length / traces.length) * 100 : 0,
      averageDuration: traces.length > 0 ? traces.reduce((sum, t) => sum + (t.duration || 0), 0) / traces.length : 0,
    };

    const healthChecks = Array.from(this.healthChecks.values());
    const healthData = {
      total: healthChecks.length,
      healthy: healthChecks.filter(h => h.status === 'healthy').length,
      degraded: healthChecks.filter(h => h.status === 'degraded').length,
      unhealthy: healthChecks.filter(h => h.status === 'unhealthy').length,
    };

    return {
      metrics,
      alerts,
      traces: tracesData,
      healthChecks: healthData,
    };
  }

  /**
   * Cleanup old data
   */
  private cleanupOldData(): void {
    const now = new Date();

    // Cleanup old metrics
    for (const [name, metrics] of this.metrics) {
      const cutoff = new Date(now.getTime() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(name, filtered);
    }

    // Cleanup old alert events
    const alertCutoff = new Date(now.getTime() - this.config.alertRetentionDays * 24 * 60 * 60 * 1000);
    this.alertEvents = this.alertEvents.filter(e => e.timestamp > alertCutoff);

    // Cleanup old traces
    const traceCutoff = new Date(now.getTime() - this.config.traceRetentionDays * 24 * 60 * 60 * 1000);
    for (const [traceId, trace] of this.traces) {
      if (trace.startTime < traceCutoff) {
        this.traces.delete(traceId);
      }
    }

    this.logger.debug('Old monitoring data cleaned up');
  }

  /**
   * Generate unique IDs
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start the monitoring system
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Start periodic tasks
    setInterval(() => {
      this.evaluateAlerts();
    }, this.config.alertEvaluationInterval);

    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Daily cleanup

    this.logger.info('Monitoring system started');
  }

  /**
   * Stop the monitoring system
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Monitoring system stopped');
  }
}