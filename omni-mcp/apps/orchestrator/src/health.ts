import type { ServerConfig } from './config/schema.js';
import { stdioProbe } from './probes/stdioProbe.js';
import { httpProbe } from './probes/httpProbe.js';
import { Counter, Histogram, Gauge } from 'prom-client';

export interface HealthStatus {
  healthy: boolean;
  lastCheck: Date;
  error?: string;
  responseTime?: number;
  consecutiveFailures?: number;
}

// Metrics
const probeSuccessTotal = new Counter({
  name: 'mcp_probe_success_total',
  help: 'Total number of successful health probes',
  labelNames: ['server'],
});

const probeFailTotal = new Counter({
  name: 'mcp_probe_fail_total',
  help: 'Total number of failed health probes',
  labelNames: ['server'],
});

const probeLatencyMs = new Histogram({
  name: 'mcp_probe_latency_ms',
  help: 'Health probe latency in milliseconds',
  labelNames: ['server'],
  buckets: [100, 500, 1000, 2000, 5000, 10000],
});

const serverSpawnTotal = new Counter({
  name: 'mcp_server_spawn_total',
  help: 'Total number of server spawns',
  labelNames: ['server'],
});

const serverExitTotal = new Counter({
  name: 'mcp_server_exit_total',
  help: 'Total number of server exits',
  labelNames: ['server', 'code'],
});

const serverRestartTotal = new Counter({
  name: 'mcp_server_restart_total',
  help: 'Total number of server restarts',
  labelNames: ['server'],
});

const serverUptimeGauge = new Gauge({
  name: 'mcp_server_uptime_seconds',
  help: 'Server uptime in seconds',
  labelNames: ['server'],
});

export class HealthChecker {
  private statuses: Map<string, HealthStatus> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private consecutiveFailures: Map<string, number> = new Map();

  async checkServerHealth(serverName: string, config: ServerConfig): Promise<HealthStatus> {
    try {
      let result;
      
      if (config.healthCheck.type === 'stdio') {
        const command = config.healthCheck.command || config.command;
        const args = config.healthCheck.command ? [] : config.args;
        result = await stdioProbe(command, args, config.healthCheck.timeoutMs);
      } else if (config.healthCheck.type === 'http') {
        if (!config.healthCheck.url) {
          throw new Error('HTTP health check requires URL');
        }
        result = await httpProbe(config.healthCheck.url, config.healthCheck.timeoutMs);
      } else {
        throw new Error(`Unsupported health check type: ${config.healthCheck.type}`);
      }

      const status: HealthStatus = {
        healthy: result.ok,
        lastCheck: new Date(),
        responseTime: result.ms,
        error: result.error,
        consecutiveFailures: result.ok ? 0 : (this.consecutiveFailures.get(serverName) || 0) + 1,
      };

      // Update consecutive failures counter
      if (result.ok) {
        this.consecutiveFailures.set(serverName, 0);
        probeSuccessTotal.inc({ server: serverName });
      } else {
        const failures = (this.consecutiveFailures.get(serverName) || 0) + 1;
        this.consecutiveFailures.set(serverName, failures);
        probeFailTotal.inc({ server: serverName });
      }

      // Record latency
      probeLatencyMs.observe({ server: serverName }, result.ms);

      this.statuses.set(serverName, status);
      return status;
    } catch (error) {
      const status: HealthStatus = {
        healthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
        responseTime: 0,
        consecutiveFailures: (this.consecutiveFailures.get(serverName) || 0) + 1,
      };

      const failures = (this.consecutiveFailures.get(serverName) || 0) + 1;
      this.consecutiveFailures.set(serverName, failures);
      probeFailTotal.inc({ server: serverName });

      this.statuses.set(serverName, status);
      return status;
    }
  }

  // Record server spawn event
  recordServerSpawn(serverName: string): void {
    serverSpawnTotal.inc({ server: serverName });
  }

  // Record server exit event
  recordServerExit(serverName: string, code: number | null): void {
    serverExitTotal.inc({ server: serverName, code: code?.toString() || 'null' });
  }

  // Record server restart event
  recordServerRestart(serverName: string): void {
    serverRestartTotal.inc({ server: serverName });
  }

  // Update server uptime
  updateServerUptime(serverName: string, uptimeSeconds: number): void {
    serverUptimeGauge.set({ server: serverName }, uptimeSeconds);
  }

  startPeriodicHealthChecks(servers: Map<string, ServerConfig>): void {
    for (const [serverName, config] of servers) {
      const intervalMs = config.healthCheck.intervalMs || 10000;
      const interval = setInterval(async () => {
        await this.checkServerHealth(serverName, config);
      }, intervalMs);

      this.intervals.set(serverName, interval);
    }
  }

  stopPeriodicHealthChecks(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  getServerStatus(serverName: string): HealthStatus | undefined {
    return this.statuses.get(serverName);
  }

  getAllStatuses(): Map<string, HealthStatus> {
    return new Map(this.statuses);
  }

  getOverallHealth(): boolean {
    const statuses = Array.from(this.statuses.values());
    return statuses.length > 0 && statuses.every(status => status.healthy);
  }

  getUnhealthyServers(): string[] {
    return Array.from(this.statuses.entries())
      .filter(([, status]) => !status.healthy)
      .map(([name]) => name);
  }

  // Get probe statuses for /readyz endpoint
  getProbeStatuses(): Record<string, { enabled: boolean; status: 'ok' | 'degraded' | 'down'; lastProbeAt: Date }> {
    const statuses: Record<string, { enabled: boolean; status: 'ok' | 'degraded' | 'down'; lastProbeAt: Date }> = {};
    
    for (const [serverName, healthStatus] of this.statuses) {
      const enabled = this.intervals.has(serverName);
      let status: 'ok' | 'degraded' | 'down' = 'down';
      
      if (healthStatus.healthy) {
        status = 'ok';
      } else if (healthStatus.consecutiveFailures && healthStatus.consecutiveFailures < 3) {
        status = 'degraded';
      }
      
      statuses[serverName] = {
        enabled,
        status,
        lastProbeAt: healthStatus.lastCheck,
      };
    }
    
    return statuses;
  }

  // Get overall readiness status
  getReadinessStatus(): { ready: boolean; status: 'ok' | 'degraded' | 'down'; details: Record<string, unknown> } {
    const probeStatuses = this.getProbeStatuses();
    const enabledServers = Object.entries(probeStatuses).filter(([, status]) => status.enabled);
    
    if (enabledServers.length === 0) {
      return { ready: true, status: 'ok', details: { message: 'No servers enabled' } };
    }
    
    const healthyServers = enabledServers.filter(([, status]) => status.status === 'ok');
    const degradedServers = enabledServers.filter(([, status]) => status.status === 'degraded');
    const downServers = enabledServers.filter(([, status]) => status.status === 'down');
    
    let overallStatus: 'ok' | 'degraded' | 'down' = 'ok';
    let ready = true;
    
    if (downServers.length > 0) {
      overallStatus = 'down';
      ready = false;
    } else if (degradedServers.length > 0) {
      overallStatus = 'degraded';
    }
    
    return {
      ready,
      status: overallStatus,
      details: {
        total: enabledServers.length,
        healthy: healthyServers.length,
        degraded: degradedServers.length,
        down: downServers.length,
        servers: probeStatuses,
      },
    };
  }
}