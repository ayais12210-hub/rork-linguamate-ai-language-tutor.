#!/usr/bin/env node

import { createLogger } from './observability/logger.js';
import { MCPIntegrationSystem } from './integration-system.js';

async function main() {
  // Create logger
  const logger = createLogger({
    level: 'info',
    format: 'json',
    transports: ['console'],
  });

  logger.info('Starting MCP Integration System Demo...');

  try {
    // Initialize integration system
    const integrationSystem = new MCPIntegrationSystem({
      plugins: {
        directory: './plugins',
        enabled: ['advanced-analytics'],
      },
      eventStore: {
        maxEventsPerSnapshot: 100,
        snapshotRetentionDays: 30,
        eventRetentionDays: 365,
      },
      cache: {
        redis: {
          host: 'localhost',
          port: 6379,
        },
        defaultTTL: 3600,
      },
      messageQueue: {
        queues: [
          { name: 'workflow-events', maxSize: 10000 },
          { name: 'analytics-processing', maxSize: 5000 },
        ],
      },
      apiGateway: {
        routes: [
          { path: '/api/workflows/:name/execute', method: 'POST', target: 'workflow-engine' },
          { path: '/api/analytics/dashboard', method: 'GET', target: 'analytics-plugin' },
        ],
      },
    }, logger);

    // Start the system
    await integrationSystem.start();

    // Demonstrate workflow execution
    logger.info('Demonstrating workflow execution...');
    
    const workflowResult = await integrationSystem.executeWorkflow(
      'bilingual-coach',
      {
        userId: 'user123',
        sessionId: 'session456',
        targetLanguage: 'es',
        sourceLanguage: 'en',
        audioData: 'base64encoded...',
      },
      {
        userId: 'user123',
        sessionId: 'session456',
      }
    );

    logger.info({ result: workflowResult }, 'Workflow executed successfully');

    // Demonstrate analytics
    logger.info('Demonstrating analytics...');
    
    const context = integrationSystem.getContext();
    const analyticsPlugin = context.pluginManager.getLoadedPlugin('advanced-analytics');
    
    if (analyticsPlugin) {
      const dashboardData = await analyticsPlugin.getCapability('analytics.dashboard')?.implementation();
      logger.info({ dashboard: dashboardData }, 'Analytics dashboard data retrieved');
    }

    // Demonstrate caching
    logger.info('Demonstrating caching...');
    
    await context.cacheManager.set('demo:key', { message: 'Hello from cache!' }, {
      ttl: 300,
      tags: ['demo'],
      strategy: 'api',
    });
    
    const cachedValue = await context.cacheManager.get('demo:key', { strategy: 'api' });
    logger.info({ cached: cachedValue }, 'Cached value retrieved');

    // Demonstrate message queue
    logger.info('Demonstrating message queue...');
    
    await context.messageQueueManager.sendMessage(
      'workflow-events',
      'demo:message',
      { test: 'data' },
      { context: { source: 'demo' } }
    );
    
    logger.info('Message sent to queue');

    // Demonstrate event sourcing
    logger.info('Demonstrating event sourcing...');
    
    await context.eventStore.appendEvents(
      'demo:aggregate',
      'demo',
      [{
        type: 'demo:event',
        data: { message: 'Hello from event store!' },
        metadata: { source: 'demo' },
      }],
      0,
      { source: 'demo' }
    );
    
    const events = await context.eventStore.getEvents('demo:aggregate');
    logger.info({ events }, 'Events retrieved from event store');

    // Demonstrate monitoring
    logger.info('Demonstrating monitoring...');
    
    context.monitoringSystem.recordMetric(
      'demo_metric',
      42,
      'gauge',
      { source: 'demo' }
    );
    
    const dashboardData = context.monitoringSystem.getDashboardData();
    logger.info({ dashboard: dashboardData }, 'Monitoring dashboard data');

    // Demonstrate testing
    logger.info('Demonstrating testing framework...');
    
    const testResult = await integrationSystem.runIntegrationTests();
    logger.info({ testResult }, 'Integration tests completed');

    // Get system health
    logger.info('Checking system health...');
    
    const health = await integrationSystem.getSystemHealth();
    logger.info({ health }, 'System health status');

    // Keep system running for demonstration
    logger.info('System is running. Press Ctrl+C to stop.');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await integrationSystem.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await integrationSystem.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error({ error }, 'Demo failed');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the demo
main().catch((error) => {
  console.error('Failed to start demo:', error);
  process.exit(1);
});