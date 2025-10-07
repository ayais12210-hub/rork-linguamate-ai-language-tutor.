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