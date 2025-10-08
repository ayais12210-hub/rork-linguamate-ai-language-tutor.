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
import { logServerSpawn, logServerExit, logServerRestart } from './observability/audit.js';
import { EgressController } from './security/egress.js';
import { validateEnv } from './config/envSchemas.js';
import { WorkflowEngine } from './workflow-engine.js';
import { ToolRegistry } from './tool-registry.js';
import { AgentCommunicationProtocol } from './agent-communication.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { AgentOrchestrator } from './agent-orchestrator.js';
import { TestingFramework } from './testing-framework.js';
import { MonitoringSystem } from './monitoring-system.js';

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
  
  // New components
  private configManager: ConfigManager;
  private securityManager: SecurityManager;
  private toolRegistry: ToolRegistry;
  private workflowEngine: WorkflowEngine;
  private agentCommunication: AgentCommunicationProtocol;
  private agentOrchestrator: AgentOrchestrator;
  private testingFramework: TestingFramework;
  private monitoringSystem: MonitoringSystem;

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
    
    // Initialize new components
    this.configManager = new ConfigManager('./config.json', this.logger);
    this.securityManager = new SecurityManager(this.configManager, this.logger);
    this.toolRegistry = new ToolRegistry(this.configManager, this.securityManager, this.logger);
    this.workflowEngine = new WorkflowEngine(this.toolRegistry, this.configManager, this.securityManager, this.logger);
    this.agentCommunication = new AgentCommunicationProtocol(this.configManager, this.securityManager, this.logger);
    this.agentOrchestrator = new AgentOrchestrator(this.configManager, this.securityManager, this.agentCommunication, this.logger);
    this.monitoringSystem = new MonitoringSystem(this.configManager, this.securityManager, this.logger);
    this.testingFramework = new TestingFramework({
      workflowEngine: this.workflowEngine,
      toolRegistry: this.toolRegistry,
      agentCommunication: this.agentCommunication,
      configManager: this.configManager,
      securityManager: this.securityManager,
      mocks: {
        tools: new Map(),
        agents: new Map(),
      },
    }, this.logger);
    
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
      this.otelSdk = initializeOpenTelemetry(this.config.observability);
      
      // Start new components
      await this.configManager.start();
      await this.securityManager.start();
      await this.toolRegistry.start();
      await this.workflowEngine.start();
      await this.agentCommunication.start();
      await this.agentOrchestrator.start();
      await this.monitoringSystem.start();
      await this.testingFramework.start();
      
      // Start health checking
      const enabledServers = this.registry.getEnabledServers();
      const serverMap = new Map(enabledServers);
      this.healthChecker.startPeriodicHealthChecks(serverMap);
      
      // Start servers
      await this.startServers();
      
      // Load and register workflows
      await this.loadWorkflows();
      
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
          errors: envValidation.errors,
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
    
    // Stop new components
    await this.testingFramework.stop();
    await this.monitoringSystem.stop();
    await this.agentOrchestrator.stop();
    await this.agentCommunication.stop();
    await this.workflowEngine.stop();
    await this.toolRegistry.stop();
    await this.securityManager.stop();
    await this.configManager.stop();
    
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

  // New component accessors
  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  getAgentOrchestrator(): AgentOrchestrator {
    return this.agentOrchestrator;
  }

  getAgentCommunication(): AgentCommunicationProtocol {
    return this.agentCommunication;
  }

  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  getSecurityManager(): SecurityManager {
    return this.securityManager;
  }

  getTestingFramework(): TestingFramework {
    return this.testingFramework;
  }

  getMonitoringSystem(): MonitoringSystem {
    return this.monitoringSystem;
  }

  // Load workflows from files
  private async loadWorkflows(): Promise<void> {
    try {
      // This would load workflow definitions from the workflows directory
      // For now, we'll just log that workflows would be loaded here
      this.logger.info('Loading workflows...');
      
      // Example workflow loading logic would go here
      // const workflowFiles = await globby('workflows/*.yaml');
      // for (const file of workflowFiles) {
      //   const workflowDef = yaml.load(readFileSync(file, 'utf8'));
      //   await this.workflowEngine.registerWorkflow(workflowDef);
      // }
      
      this.logger.info('Workflows loaded successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to load workflows');
    }
  }
}