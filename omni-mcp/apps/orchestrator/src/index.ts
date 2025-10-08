import Fastify from 'fastify';
import cors from '@fastify/cors';
import { MCPOrchestrator } from './bootstrap.js';
import { loadConfig } from './config/schema.js';
import { createLogger } from './observability/logger.js';
import { register } from 'prom-client';

async function main() {
  // Load configuration
  const config = loadConfig();
  const logger = createLogger(config);
  
  // Initialize orchestrator
  const orchestrator = new MCPOrchestrator();
  
  // Start orchestrator
  await orchestrator.start();
  
  // Create Fastify server
  const server = Fastify({
    logger: true,
  });
  
  // Register CORS
  await server.register(cors, {
    origin: true,
  });
  
  // Health endpoints
  server.get('/healthz', async (_request, _reply) => {
    const overallHealth = orchestrator.getOverallHealth();
    const serverStatuses = orchestrator.getAllServerStatuses();
    
    return {
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      servers: serverStatuses,
    };
  });
  
  server.get('/readyz', async (_request, reply) => {
    const overallHealth = orchestrator.getOverallHealth();
    
    if (!overallHealth) {
      reply.code(503);
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'One or more servers are unhealthy',
      };
    }
    
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  });
  
  // Metrics endpoint
  server.get('/metrics', async (_request, _reply) => {
    return register.metrics();
  });
  
  // Server status endpoint
  server.get('/servers', async (_request, _reply) => {
    return orchestrator.getAllServerStatuses();
  });

  server.get('/servers/:name', async (request, reply) => {
    const { name } = request.params as { name: string };
    const status = orchestrator.getServerStatus(name);
    
    if (!status) {
      reply.code(404);
      return { error: 'Server not found' };
    }
    
    return status;
  });
  
  // Workflow endpoints
  server.post('/workflows/:name/execute', async (request, reply) => {
    const { name } = request.params as { name: string };
    const { payload, context } = request.body as { payload: any; context?: any };
    
    try {
      const result = await orchestrator.getWorkflowEngine().executeWorkflow(name, payload, context);
      return result;
    } catch (error) {
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  server.get('/workflows', async (_request, _reply) => {
    return orchestrator.getWorkflowEngine().getWorkflows();
  });

  server.get('/workflows/:name', async (request, reply) => {
    const { name } = request.params as { name: string };
    const workflow = orchestrator.getWorkflowEngine().getWorkflow(name);
    
    if (!workflow) {
      reply.code(404);
      return { error: 'Workflow not found' };
    }
    
    return workflow;
  });

  // Tool registry endpoints
  server.get('/tools', async (_request, _reply) => {
    return orchestrator.getToolRegistry().getAllTools();
  });

  server.post('/tools/:name/:provider/execute', async (request, reply) => {
    const { name, provider } = request.params as { name: string; provider: string };
    const { input, context } = request.body as { input: any; context?: any };
    
    try {
      const result = await orchestrator.getToolRegistry().executeTool(name, provider, input, context);
      return result;
    } catch (error) {
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Agent endpoints
  server.get('/agents', async (_request, _reply) => {
    return orchestrator.getAgentOrchestrator().getAllAgents();
  });

  server.get('/agents/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const agent = orchestrator.getAgentOrchestrator().getAgent(id);
    
    if (!agent) {
      reply.code(404);
      return { error: 'Agent not found' };
    }
    
    return agent;
  });

  server.post('/agents/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, metadata } = request.body as { status: string; metadata?: any };
    
    try {
      await orchestrator.getAgentOrchestrator().updateAgentStatus(id, status as any, metadata);
      return { success: true };
    } catch (error) {
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Configuration endpoints
  server.get('/config/feature-flags', async (_request, _reply) => {
    return orchestrator.getConfigManager().getFeatureFlags();
  });

  server.post('/config/feature-flags/:name', async (request, reply) => {
    const { name } = request.params as { name: string };
    const { enabled, options } = request.body as { enabled: boolean; options?: any };
    
    try {
      orchestrator.getConfigManager().setFeatureFlag(name, enabled, options);
      return { success: true };
    } catch (error) {
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  server.get('/config/sections', async (_request, _reply) => {
    return orchestrator.getConfigManager().getConfigSections();
  });

  server.get('/config/sections/:section', async (request, reply) => {
    const { section } = request.params as { section: string };
    const sectionConfig = orchestrator.getConfigManager().getConfigSection(section);
    
    if (!sectionConfig) {
      reply.code(404);
      return { error: 'Section not found' };
    }
    
    return sectionConfig;
  });

  // Monitoring endpoints
  server.get('/monitoring/metrics', async (request, _reply) => {
    const { name, startTime, endTime, labels, limit } = request.query as any;
    return orchestrator.getMonitoringSystem().getMetrics(name, {
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      labels: labels ? JSON.parse(labels) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  });

  server.get('/monitoring/alerts', async (_request, _reply) => {
    return orchestrator.getMonitoringSystem().getAlerts();
  });

  server.get('/monitoring/traces', async (request, _reply) => {
    const { operationName, status, startTime, endTime, limit } = request.query as any;
    return orchestrator.getMonitoringSystem().getTraces({
      operationName,
      status,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  });

  server.get('/monitoring/dashboard', async (_request, _reply) => {
    return orchestrator.getMonitoringSystem().getDashboardData();
  });

  // Testing endpoints
  server.post('/testing/scenarios/:name/run', async (request, reply) => {
    const { name } = request.params as { name: string };
    const scenario = request.body as any;
    
    try {
      const result = await orchestrator.getTestingFramework().runTestScenario(scenario);
      return result;
    } catch (error) {
      reply.code(500);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  server.get('/testing/results', async (_request, _reply) => {
    return orchestrator.getTestingFramework().getTestResults();
  });

  server.get('/testing/statistics', async (_request, _reply) => {
    return orchestrator.getTestingFramework().getTestStatistics();
  });

  server.get('/testing/report', async (_request, _reply) => {
    const report = orchestrator.getTestingFramework().generateTestReport();
    reply.type('text/markdown');
    return report;
  });
  
  // Start HTTP server
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';
  
  try {
    await server.listen({ port, host });
    logger.info(`HTTP server listening on ${host}:${port}`);
  } catch (error) {
    logger.error({ error }, 'Failed to start HTTP server');
    process.exit(1);
  }
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    await server.close();
    await orchestrator.gracefulShutdown();
  });
  
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully');
    await server.close();
    await orchestrator.gracefulShutdown();
  });
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

// Start the application
main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});