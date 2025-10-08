#!/usr/bin/env node

import { createLogger } from './observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { MonitoringSystem } from './monitoring-system.js';
import { CacheManager } from './cache-manager.js';
import { MessageQueueManager } from './message-queue-manager.js';
import { APIGateway } from './api-gateway.js';
import { EventStore } from './event-store.js';
import { PluginManager } from './plugin-manager.js';
import { WorkflowEngine } from './workflow-engine.js';
import { ToolRegistry } from './tool-registry.js';
import { AgentOrchestrator } from './agent-orchestrator.js';
import { AgentCommunicationProtocol } from './agent-communication.js';
import { TestingFramework } from './testing-framework.js';
import { HealthMonitoringSystem } from './health-monitoring-system.js';
import { SanityCheckFramework } from './sanity-check-framework.js';
import { HallucinationDetectionSystem } from './hallucination-detection-system.js';
import { APICallManager } from './api-call-manager.js';

async function main() {
  // Create logger
  const logger = createLogger({
    level: 'info',
    format: 'json',
    transports: ['console'],
  });

  logger.info('Starting MCP Advanced System Demo...');

  try {
    // Initialize core components
    const configManager = new ConfigManager('./config.json', logger);
    const securityManager = new SecurityManager(configManager, logger);
    const monitoringSystem = new MonitoringSystem(configManager, securityManager, logger);
    const cacheManager = new CacheManager({
      redis: { host: 'localhost', port: 6379 },
      defaultTTL: 3600,
    }, configManager, securityManager, monitoringSystem, logger);
    const messageQueueManager = new MessageQueueManager({}, configManager, securityManager, monitoringSystem, cacheManager, logger);
    const apiGateway = new APIGateway({}, configManager, securityManager, monitoringSystem, cacheManager, messageQueueManager, logger);
    const eventStore = new EventStore({
      maxEventsPerSnapshot: 100,
      snapshotRetentionDays: 30,
      eventRetentionDays: 365,
    }, configManager, securityManager, monitoringSystem, logger);
    const pluginManager = new PluginManager('./plugins', {
      configManager,
      securityManager,
      toolRegistry: null as any,
      workflowEngine: null as any,
      agentOrchestrator: null as any,
      monitoringSystem,
      logger,
    }, logger);
    const toolRegistry = new ToolRegistry(configManager, securityManager, logger);
    const workflowEngine = new WorkflowEngine(toolRegistry, configManager, securityManager, logger);
    const agentCommunication = new AgentCommunicationProtocol(configManager, securityManager, logger);
    const agentOrchestrator = new AgentOrchestrator(configManager, securityManager, agentCommunication, logger);
    const testingFramework = new TestingFramework({
      workflowEngine,
      toolRegistry,
      agentCommunication,
      configManager,
      securityManager,
      mocks: { tools: new Map(), agents: new Map() },
    }, logger);

    // Initialize advanced components
    const healthMonitoringSystem = new HealthMonitoringSystem({
      configManager,
      securityManager,
      monitoringSystem,
      cacheManager,
      messageQueueManager,
      apiGateway,
      eventStore,
      pluginManager,
      workflowEngine,
      toolRegistry,
      agentOrchestrator,
      agentCommunication,
      logger,
    }, logger);

    const sanityCheckFramework = new SanityCheckFramework({
      configManager,
      securityManager,
      monitoringSystem,
      cacheManager,
      eventStore,
      logger,
    }, logger);

    const hallucinationDetectionSystem = new HallucinationDetectionSystem({
      configManager,
      securityManager,
      monitoringSystem,
      cacheManager,
      logger,
    }, logger);

    const apiCallManager = new APICallManager({
      configManager,
      securityManager,
      monitoringSystem,
      cacheManager,
      logger,
    }, logger);

    // Start all components
    logger.info('Starting core components...');
    await configManager.start();
    await securityManager.start();
    await monitoringSystem.start();
    await cacheManager.start();
    await messageQueueManager.start();
    await apiGateway.start();
    await eventStore.start();
    await toolRegistry.start();
    await workflowEngine.start();
    await agentCommunication.start();
    await agentOrchestrator.start();
    await testingFramework.start();
    await pluginManager.start();

    logger.info('Starting advanced components...');
    await healthMonitoringSystem.start();
    await sanityCheckFramework.start();
    await hallucinationDetectionSystem.start();
    await apiCallManager.start();

    // Demonstrate Health Monitoring
    logger.info('=== Health Monitoring Demo ===');
    
    const systemHealth = await healthMonitoringSystem.getSystemHealth();
    logger.info({ systemHealth }, 'System health status');
    
    // Run all health checks
    const healthResults = await healthMonitoringSystem.runAllHealthChecks();
    logger.info({ healthResults: Array.from(healthResults.entries()) }, 'Health check results');
    
    // Get health check by component
    const configHealth = healthMonitoringSystem.getHealthCheckStatus('config-manager');
    logger.info({ configHealth }, 'Configuration manager health');

    // Demonstrate Sanity Checks
    logger.info('=== Sanity Checks Demo ===');
    
    // Run all sanity checks
    const sanityReport = await sanityCheckFramework.runAllSanityChecks();
    logger.info({ sanityReport }, 'Sanity check report');
    
    // Run specific sanity check
    const workflowValidation = await sanityCheckFramework.runSanityCheck('workflow-data-validation');
    logger.info({ workflowValidation }, 'Workflow data validation result');
    
    // Get sanity checks by type
    const validationChecks = sanityCheckFramework.getSanityChecksByType('data_validation');
    logger.info({ validationChecks }, 'Data validation checks');

    // Demonstrate Hallucination Detection
    logger.info('=== Hallucination Detection Demo ===');
    
    const testInput = {
      prompt: 'Tell me about the Spanish language',
      context: 'language learning',
    };
    
    const testOutput = {
      text: 'Spanish is a Romance language spoken by over 500 million people worldwide. It originated in the Iberian Peninsula and is the official language of Spain and most Latin American countries. Spanish grammar includes features like gendered nouns and verb conjugations.',
      confidence: 0.95,
    };
    
    const hallucinationResult = await hallucinationDetectionSystem.checkHallucinations(testInput, testOutput);
    logger.info({ hallucinationResult }, 'Hallucination detection result');
    
    // Test with potentially hallucinated content
    const hallucinatedOutput = {
      text: 'Spanish is spoken by exactly 1 billion people and was invented in 1492 by Christopher Columbus. All Spanish words end in vowels.',
      confidence: 0.98,
    };
    
    const hallucinationResult2 = await hallucinationDetectionSystem.checkHallucinations(testInput, hallucinatedOutput);
    logger.info({ hallucinationResult2 }, 'Hallucination detection result (with potential hallucinations)');
    
    // Generate hallucination report
    const hallucinationReport = await hallucinationDetectionSystem.generateHallucinationReport();
    logger.info({ hallucinationReport }, 'Hallucination detection report');

    // Demonstrate API Call Management
    logger.info('=== API Call Management Demo ===');
    
    // Make API calls to different services
    try {
      const openrouterCall = await apiCallManager.makeAPICall('openrouter', {
        method: 'POST',
        path: '/chat/completions',
        body: {
          model: 'openrouter/auto',
          messages: [{ role: 'user', content: 'Hello, world!' }],
        },
        cache: true,
      });
      logger.info({ openrouterCall }, 'OpenRouter API call result');
    } catch (error) {
      logger.warn({ error }, 'OpenRouter API call failed (expected if no API key)');
    }
    
    try {
      const geminiCall = await apiCallManager.makeAPICall('gemini', {
        method: 'POST',
        path: '/models/gemini-pro:generateContent',
        body: {
          contents: [{ parts: [{ text: 'Hello, world!' }] }],
        },
        cache: true,
      });
      logger.info({ geminiCall }, 'Gemini API call result');
    } catch (error) {
      logger.warn({ error }, 'Gemini API call failed (expected if no API key)');
    }
    
    // Get API call statistics
    const apiStats = apiCallManager.getAPICallStatistics();
    logger.info({ apiStats }, 'API call statistics');
    
    // Get circuit breaker states
    const circuitBreakerStates = apiCallManager.getAllAPIConfigs().map(config => ({
      configId: config.id,
      state: apiCallManager.getCircuitBreakerState(config.id)?.state || 'unknown',
    }));
    logger.info({ circuitBreakerStates }, 'Circuit breaker states');
    
    // Get rate limiter states
    const rateLimiterStates = apiCallManager.getAllAPIConfigs().map(config => ({
      configId: config.id,
      state: apiCallManager.getRateLimiterState(config.id),
    }));
    logger.info({ rateLimiterStates }, 'Rate limiter states');

    // Demonstrate Integration with Workflow Engine
    logger.info('=== Workflow Integration Demo ===');
    
    // Register a test workflow
    await workflowEngine.registerWorkflow({
      name: 'test-health-workflow',
      steps: [
        {
          name: 'health_check',
          tool: 'health.check',
          provider: 'health-monitoring-system',
          input: { component: 'all' },
        },
        {
          name: 'sanity_check',
          tool: 'sanity.check',
          provider: 'sanity-check-framework',
          input: { type: 'data_validation' },
        },
        {
          name: 'hallucination_check',
          tool: 'hallucination.check',
          provider: 'hallucination-detection-system',
          input: { input: 'test', output: 'test output' },
        },
      ],
    });
    
    // Execute the workflow
    try {
      const workflowResult = await workflowEngine.executeWorkflow('test-health-workflow', {
        userId: 'demo-user',
        sessionId: 'demo-session',
      });
      logger.info({ workflowResult }, 'Health workflow execution result');
    } catch (error) {
      logger.warn({ error }, 'Health workflow execution failed');
    }

    // Demonstrate Event Sourcing Integration
    logger.info('=== Event Sourcing Integration Demo ===');
    
    // Store events from health monitoring
    await eventStore.appendEvents('health:system', 'health', [{
      type: 'health:check_completed',
      data: { overallStatus: 'healthy', components: 12 },
      metadata: { source: 'health-monitoring-system' },
    }], 0, { source: 'demo' });
    
    // Store events from sanity checks
    await eventStore.appendEvents('sanity:system', 'sanity', [{
      type: 'sanity:check_completed',
      data: { totalChecks: 8, passedChecks: 7, failedChecks: 1 },
      metadata: { source: 'sanity-check-framework' },
    }], 0, { source: 'demo' });
    
    // Store events from hallucination detection
    await eventStore.appendEvents('hallucination:system', 'hallucination', [{
      type: 'hallucination:check_completed',
      data: { overallScore: 0.85, riskLevel: 'low', violations: 0 },
      metadata: { source: 'hallucination-detection-system' },
    }], 0, { source: 'demo' });
    
    // Retrieve events
    const healthEvents = await eventStore.getEvents('health:system');
    const sanityEvents = await eventStore.getEvents('sanity:system');
    const hallucinationEvents = await eventStore.getEvents('hallucination:system');
    
    logger.info({
      healthEvents: healthEvents.length,
      sanityEvents: sanityEvents.length,
      hallucinationEvents: hallucinationEvents.length,
    }, 'Event sourcing results');

    // Demonstrate Caching Integration
    logger.info('=== Caching Integration Demo ===');
    
    // Cache health check results
    await cacheManager.set('health:system:overall', systemHealth, {
      ttl: 300,
      tags: ['health', 'system'],
      strategy: 'api',
    });
    
    // Cache sanity check results
    await cacheManager.set('sanity:report:latest', sanityReport, {
      ttl: 600,
      tags: ['sanity', 'report'],
      strategy: 'api',
    });
    
    // Cache hallucination detection results
    await cacheManager.set('hallucination:result:latest', hallucinationResult, {
      ttl: 300,
      tags: ['hallucination', 'result'],
      strategy: 'api',
    });
    
    // Retrieve cached data
    const cachedHealth = await cacheManager.get('health:system:overall', { strategy: 'api' });
    const cachedSanity = await cacheManager.get('sanity:report:latest', { strategy: 'api' });
    const cachedHallucination = await cacheManager.get('hallucination:result:latest', { strategy: 'api' });
    
    logger.info({
      cachedHealth: !!cachedHealth,
      cachedSanity: !!cachedSanity,
      cachedHallucination: !!cachedHallucination,
    }, 'Caching results');
    
    // Get cache statistics
    const cacheStats = await cacheManager.getStats();
    logger.info({ cacheStats }, 'Cache statistics');

    // Demonstrate Message Queue Integration
    logger.info('=== Message Queue Integration Demo ===');
    
    // Create queues for different types of checks
    await messageQueueManager.createQueue({
      name: 'health-checks',
      maxSize: 1000,
      visibilityTimeout: 30000,
    });
    
    await messageQueueManager.createQueue({
      name: 'sanity-checks',
      maxSize: 1000,
      visibilityTimeout: 60000,
    });
    
    await messageQueueManager.createQueue({
      name: 'hallucination-checks',
      maxSize: 1000,
      visibilityTimeout: 30000,
    });
    
    // Send messages to queues
    await messageQueueManager.sendMessage('health-checks', 'health:check:completed', {
      systemHealth,
      timestamp: new Date(),
    });
    
    await messageQueueManager.sendMessage('sanity-checks', 'sanity:check:completed', {
      sanityReport,
      timestamp: new Date(),
    });
    
    await messageQueueManager.sendMessage('hallucination-checks', 'hallucination:check:completed', {
      hallucinationResult,
      timestamp: new Date(),
    });
    
    // Get queue statistics
    const healthQueueStats = await messageQueueManager.getQueueStats('health-checks');
    const sanityQueueStats = await messageQueueManager.getQueueStats('sanity-checks');
    const hallucinationQueueStats = await messageQueueManager.getQueueStats('hallucination-checks');
    
    logger.info({
      healthQueue: healthQueueStats,
      sanityQueue: sanityQueueStats,
      hallucinationQueue: hallucinationQueueStats,
    }, 'Message queue statistics');

    // Demonstrate Monitoring Integration
    logger.info('=== Monitoring Integration Demo ===');
    
    // Record custom metrics
    monitoringSystem.recordMetric('demo_health_checks', healthResults.size, 'counter', { source: 'demo' });
    monitoringSystem.recordMetric('demo_sanity_checks', sanityReport.summary.totalChecks, 'counter', { source: 'demo' });
    monitoringSystem.recordMetric('demo_hallucination_checks', 1, 'counter', { source: 'demo' });
    
    // Record performance metrics
    monitoringSystem.recordHistogram('demo_response_times', 150, { component: 'health' });
    monitoringSystem.recordHistogram('demo_response_times', 200, { component: 'sanity' });
    monitoringSystem.recordHistogram('demo_response_times', 100, { component: 'hallucination' });
    
    // Get monitoring dashboard data
    const dashboardData = monitoringSystem.getDashboardData();
    logger.info({ dashboardData }, 'Monitoring dashboard data');

    // Demonstrate Security Integration
    logger.info('=== Security Integration Demo ===');
    
    // Authenticate a user
    const authResult = await securityManager.authenticate(
      { userId: 'demo-user' },
      { ipAddress: '127.0.0.1', userAgent: 'MCP-Demo/1.0' }
    );
    logger.info({ authResult }, 'Authentication result');
    
    // Check permissions
    const permissionResult = await securityManager.checkPermission(
      'demo-user',
      'health',
      'read',
      { component: 'all' }
    );
    logger.info({ permissionResult }, 'Permission check result');
    
    // Get audit events
    const auditEvents = securityManager.getAuditEvents({
      userId: 'demo-user',
      limit: 10,
    });
    logger.info({ auditEvents }, 'Audit events');

    // Demonstrate Testing Framework Integration
    logger.info('=== Testing Framework Integration Demo ===');
    
    // Create mock tools for testing
    testingFramework.createMockTool({
      name: 'health.check',
      provider: 'health-monitoring-system',
      responses: [{
        input: { component: 'all' },
        output: { status: 'healthy', components: 12 },
        delay: 50,
      }],
    });
    
    testingFramework.createMockTool({
      name: 'sanity.check',
      provider: 'sanity-check-framework',
      responses: [{
        input: { type: 'data_validation' },
        output: { status: 'passed', violations: 0 },
        delay: 100,
      }],
    });
    
    testingFramework.createMockTool({
      name: 'hallucination.check',
      provider: 'hallucination-detection-system',
      responses: [{
        input: { input: 'test', output: 'test output' },
        output: { overallScore: 0.9, passed: true },
        delay: 75,
      }],
    });
    
    // Run test scenario
    const testScenario = {
      name: 'Advanced System Integration Test',
      description: 'Test all advanced components working together',
      setup: [
        'create_mock_tool health.check health-monitoring-system',
        'create_mock_tool sanity.check sanity-check-framework',
        'create_mock_tool hallucination.check hallucination-detection-system',
      ],
      steps: [
        {
          action: 'execute_workflow',
          input: {
            workflowName: 'test-health-workflow',
            payload: { userId: 'test-user' },
          },
          expectedOutput: { status: 'completed' },
        },
        {
          action: 'check_health',
          input: { component: 'all' },
          expectedOutput: { status: 'healthy' },
        },
        {
          action: 'check_sanity',
          input: { type: 'data_validation' },
          expectedOutput: { status: 'passed' },
        },
        {
          action: 'check_hallucination',
          input: { input: 'test', output: 'test output' },
          expectedOutput: { passed: true },
        },
      ],
      teardown: [
        'remove_mock_tool health.check health-monitoring-system',
        'remove_mock_tool sanity.check sanity-check-framework',
        'remove_mock_tool hallucination.check hallucination-detection-system',
      ],
    };
    
    const testResult = await testingFramework.runTestScenario(testScenario);
    logger.info({ testResult }, 'Test scenario result');
    
    // Get test statistics
    const testStats = testingFramework.getTestStatistics();
    logger.info({ testStats }, 'Test statistics');

    // Final System Status
    logger.info('=== Final System Status ===');
    
    const finalHealth = await healthMonitoringSystem.getSystemHealth();
    const finalSanityReport = await sanityCheckFramework.runAllSanityChecks();
    const finalApiStats = apiCallManager.getAPICallStatistics();
    const finalCacheStats = await cacheManager.getStats();
    
    logger.info({
      systemHealth: finalHealth,
      sanityReport: finalSanityReport,
      apiStats: finalApiStats,
      cacheStats: finalCacheStats,
    }, 'Final system status');

    // Keep system running for demonstration
    logger.info('Advanced system is running. Press Ctrl+C to stop.');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      
      await healthMonitoringSystem.stop();
      await sanityCheckFramework.stop();
      await hallucinationDetectionSystem.stop();
      await apiCallManager.stop();
      
      await pluginManager.stop();
      await testingFramework.stop();
      await agentOrchestrator.stop();
      await agentCommunication.stop();
      await workflowEngine.stop();
      await toolRegistry.stop();
      await eventStore.stop();
      await apiGateway.stop();
      await messageQueueManager.stop();
      await cacheManager.stop();
      await monitoringSystem.stop();
      await securityManager.stop();
      await configManager.stop();
      
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      
      await healthMonitoringSystem.stop();
      await sanityCheckFramework.stop();
      await hallucinationDetectionSystem.stop();
      await apiCallManager.stop();
      
      await pluginManager.stop();
      await testingFramework.stop();
      await agentOrchestrator.stop();
      await agentCommunication.stop();
      await workflowEngine.stop();
      await toolRegistry.stop();
      await eventStore.stop();
      await apiGateway.stop();
      await messageQueueManager.stop();
      await cacheManager.stop();
      await monitoringSystem.stop();
      await securityManager.stop();
      await configManager.stop();
      
      process.exit(0);
    });

  } catch (error) {
    logger.error({ error }, 'Advanced system demo failed');
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
  console.error('Failed to start advanced system demo:', error);
  process.exit(1);
});