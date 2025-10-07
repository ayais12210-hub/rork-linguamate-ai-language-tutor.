import { spawn, ChildProcess } from 'node:child_process';
import { loadConfig, hasRequiredEnvs, resolveEnv, type Config, type ServerConfig } from './config/schema.js';
import { ServerRegistry } from './registry.js';
import { HealthChecker } from './health.js';
import { RateLimiterGuard } from './guards/rateLimiter.js';
import { CircuitBreakerGuard } from './guards/circuitBreaker.js';
import { TimeoutGuard } from './guards/timeouts.js';
import { AuthScopesGuard } from './guards/authScopes.js';
import { createLogger, logServerEvent, logServerError } from './observability/logger.js';
import { initializeOpenTelemetry, shutdownOpenTelemetry, type NodeSDK } from './observability/otel.js';
import { initOTEL } from './observability/otel.js';
import { initSentry } from './observability/sentry.js';
import { logServerSpawn, logServerExit, logServerRestart } from './observability/audit.js';
import { EgressController } from './security/egress.js';
import { validateEnv } from './config/envSchemas.js';

export interface ServerProcess {
  name: string;
  process: ChildProcess;
  config: ServerConfig;
  startTime: Date;
  restartCount: number;
  lastRestart: Date;
}

export class MCPOrchestrator {
  private config: Config;
  private registry: ServerRegistry;
  private healthChecker: HealthChecker;
  private rateLimiter: RateLimiterGuard;
  private circuitBreaker: CircuitBreakerGuard;
  private timeoutGuard: TimeoutGuard;
  private authScopes: AuthScopesGuard;
  private egressController: EgressController;
  private logger: ReturnType<typeof createLogger>;
  private servers: Map<string, ServerProcess> = new Map();
  private otelSdk: NodeSDK | null = null;
  private shutdownSignal: AbortSignal;

  constructor() {
    this.config = loadConfig();
    this.registry = new ServerRegistry(this.config);
    this.healthChecker = new HealthChecker();
    this.rateLimiter = new RateLimiterGuard();
    this.circuitBreaker = new CircuitBreakerGuard();
    this.timeoutGuard = new TimeoutGuard();
    this.authScopes = new AuthScopesGuard();
    this.egressController = new EgressController(this.config.network);
    this.logger = createLogger(this.config);
    
    // Create shutdown signal
    const controller = new AbortController();
    this.shutdownSignal = controller.signal;
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  async start(): Promise<void> {
    try {
      // Initialize observability
      initOTEL();
      initSentry(process.env.SENTRY_DSN);
      this.otelSdk = initializeOpenTelemetry(this.config.observability);
      
      // Start health checking
      const enabledServers = this.registry.getEnabledServers();
      const serverMap = new Map(enabledServers);
      this.healthChecker.startPeriodicHealthChecks(serverMap, this.config.network.outboundAllowlist);
      
      // Start servers
      await this.startServers();
      
      this.logger.info('MCP Orchestrator started successfully');
    } catch (error) {
      logServerError(this.logger, 'orchestrator', error as Error);
      throw error;
    }
  }

  private async startServers(): Promise<void> {
    const enabledServers = this.registry.getEnabledServers();
    
    for (const [name, serverConfig] of enabledServers) {
      // Validate environment schema
      const envValidation = validateEnv(name, serverConfig.env);
      
      if (!envValidation.ok) {
        this.logger.warn({
          server: name,
          event: 'skipped',
          reason: 'env_validation_failed',
          missing: envValidation.missing,
        });
        continue;
      }
      
      if (hasRequiredEnvs(serverConfig.env)) {
        await this.startServer(name, serverConfig);
      } else {
        this.logger.warn({
          server: name,
          event: 'skipped',
          reason: 'missing_required_envs',
          requiredEnvs: Object.keys(serverConfig.env).filter(key => serverConfig.env[key]),
        });
      }
    }
  }

  private async startServer(name: string, config: ServerConfig): Promise<void> {
    try {
      const resolvedEnv = resolveEnv(config.env);
      const env = { ...process.env, ...resolvedEnv };
      
      const child = spawn(config.command, config.args, {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      // Set up logging
      child.stdout?.on('data', (data) => {
        this.logger.info({
          server: name,
          event: 'stdout',
          message: data.toString().trim(),
        });
      });

      child.stderr?.on('data', (data) => {
        this.logger.warn({
          server: name,
          event: 'stderr',
          message: data.toString().trim(),
        });
      });

      // Handle process events
      child.on('exit', (code, signal) => {
        logServerEvent(this.logger, name, 'exit', { code, signal });
        this.handleServerExit(name, code, signal);
      });

      child.on('error', (error) => {
        logServerError(this.logger, name, error);
        this.handleServerError(name, error);
      });

      // Register guards
      this.rateLimiter.createLimiter(name, config);
      this.circuitBreaker.createBreaker(name, config);
      this.authScopes.registerServer(name, config);

      // Store server process
      const serverProcess: ServerProcess = {
        name,
        process: child,
        config,
        startTime: new Date(),
        restartCount: 0,
        lastRestart: new Date(),
      };

      this.servers.set(name, serverProcess);
      
      // Record metrics and audit events
      this.healthChecker.recordServerSpawn(name);
      logServerSpawn(name, {
        pid: child.pid,
        command: config.command,
        args: config.args,
      });
      
      logServerEvent(this.logger, name, 'started', {
        pid: child.pid,
        command: config.command,
        args: config.args,
      });

    } catch (error) {
      logServerError(this.logger, name, error as Error);
      throw error;
    }
  }

  private handleServerExit(name: string, code: number | null, signal: string | null): void {
    const serverProcess = this.servers.get(name);
    if (!serverProcess) return;

    // Record exit metrics and audit
    this.healthChecker.recordServerExit(name, code);
    logServerExit(name, {
      code,
      signal,
      uptime: Date.now() - serverProcess.startTime.getTime(),
    });

    // Check if this is a graceful shutdown
    if (this.shutdownSignal.aborted) {
      return;
    }

    // Implement restart logic with backoff
    const now = new Date();
    const timeSinceLastRestart = now.getTime() - serverProcess.lastRestart.getTime();
    const backoffMs = Math.min(1000 * Math.pow(2, serverProcess.restartCount), 30000);
    
    if (timeSinceLastRestart < backoffMs) {
      this.logger.warn({
        server: name,
        event: 'restart_throttled',
        backoffMs,
        timeSinceLastRestart,
      });
      return;
    }

    if (serverProcess.restartCount < 5) {
      serverProcess.restartCount++;
      serverProcess.lastRestart = now;
      
      // Record restart metrics and audit
      this.healthChecker.recordServerRestart(name);
      logServerRestart(name, {
        restartCount: serverProcess.restartCount,
        exitCode: code,
        signal,
      });
      
      this.logger.warn({
        server: name,
        event: 'restarting',
        restartCount: serverProcess.restartCount,
        exitCode: code,
        signal,
      });

      setTimeout(async () => {
        try {
          await this.startServer(name, serverProcess.config);
        } catch (error) {
          logServerError(this.logger, name, error as Error);
        }
      }, backoffMs + Math.random() * 1000); // Add jitter
    } else {
      this.logger.error({
        server: name,
        event: 'max_restarts_exceeded',
        restartCount: serverProcess.restartCount,
      });
    }
  }

  private handleServerError(name: string, error: Error): void {
    logServerError(this.logger, name, error);
    // Error handling logic can be extended here
  }

  async gracefulShutdown(): Promise<void> {
    this.logger.info('Starting graceful shutdown...');
    
    // Stop health checks
    this.healthChecker.stopPeriodicHealthChecks();
    
    // Stop all servers
    const shutdownPromises: Promise<void>[] = [];
    
    for (const [name, serverProcess] of this.servers) {
      shutdownPromises.push(this.stopServer(name, serverProcess));
    }
    
    await Promise.allSettled(shutdownPromises);
    
    // Shutdown observability
    await shutdownOpenTelemetry(this.otelSdk);
    
    this.logger.info('Graceful shutdown completed');
    process.exit(0);
  }

  private async stopServer(name: string, serverProcess: ServerProcess): Promise<void> {
    return new Promise((resolve) => {
      const { process: child } = serverProcess;
      
      if (!child || child.killed) {
        resolve();
        return;
      }

      logServerEvent(this.logger, name, 'stopping');
      
      // Send SIGTERM first
      child.kill('SIGTERM');
      
      // Force kill after grace period
      const forceKillTimeout = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
          logServerEvent(this.logger, name, 'force_killed');
        }
      }, 10000);

      child.on('exit', () => {
        clearTimeout(forceKillTimeout);
        logServerEvent(this.logger, name, 'stopped');
        resolve();
      });
    });
  }

  // Public API methods
  getServerStatus(name: string): Record<string, unknown> {
    const serverProcess = this.servers.get(name);
    const healthStatus = this.healthChecker.getServerStatus(name);
    
    return {
      running: serverProcess ? !serverProcess.process.killed : false,
      health: healthStatus,
      restartCount: serverProcess?.restartCount || 0,
      uptime: serverProcess ? Date.now() - serverProcess.startTime.getTime() : 0,
    };
  }

  getAllServerStatuses(): Record<string, Record<string, unknown>> {
    const statuses: Record<string, Record<string, unknown>> = {};
    
    for (const [name] of this.servers) {
      statuses[name] = this.getServerStatus(name);
    }
    
    return statuses;
  }

  getOverallHealth(): boolean {
    return this.healthChecker.getOverallHealth();
  }

  getHealthChecker(): HealthChecker {
    return this.healthChecker;
  }

  // Get readiness status for /readyz endpoint
  getReadinessStatus(): { ready: boolean; status: 'ok' | 'degraded' | 'down'; details: Record<string, unknown> } {
    return this.healthChecker.getReadinessStatus();
  }

  // Get egress controller for security validation
  getEgressController(): EgressController {
    return this.egressController;
  }
}