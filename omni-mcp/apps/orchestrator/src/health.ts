import { spawn } from 'node:child_process';
import type { ServerConfig } from './config/schema.js';

export interface HealthStatus {
  healthy: boolean;
  lastCheck: Date;
  error?: string;
  responseTime?: number;
}

export class HealthChecker {
  private statuses: Map<string, HealthStatus> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  async checkServerHealth(serverName: string, config: ServerConfig): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      let healthy = false;
      
      if (config.healthCheck.type === 'stdio') {
        healthy = await this.checkStdioHealth(config);
      } else if (config.healthCheck.type === 'http') {
        healthy = await this.checkHttpHealth(config);
      }

      const responseTime = Date.now() - startTime;
      const status: HealthStatus = {
        healthy,
        lastCheck: new Date(),
        responseTime,
      };

      this.statuses.set(serverName, status);
      return status;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status: HealthStatus = {
        healthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      };

      this.statuses.set(serverName, status);
      return status;
    }
  }

  private async checkStdioHealth(config: ServerConfig): Promise<boolean> {
    return new Promise((resolve) => {
      const command = config.healthCheck.command || config.command;
      const args = config.healthCheck.command ? [] : [...config.args, '--health'];
      
      const child = spawn(command, args, {
        env: { ...process.env, ...config.env },
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: config.healthCheck.timeoutMs,
      });

      child.stdout?.on('data', () => {
        // Output captured but not used in this implementation
      });

      child.stderr?.on('data', () => {
        // Error output captured but not used in this implementation
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });

      child.on('error', () => {
        resolve(false);
      });

      // Timeout fallback
      setTimeout(() => {
        child.kill();
        resolve(false);
      }, config.healthCheck.timeoutMs);
    });
  }

  private async checkHttpHealth(config: ServerConfig): Promise<boolean> {
    if (!config.healthCheck.url) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.healthCheck.timeoutMs);

      const response = await fetch(config.healthCheck.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'omni-mcp-health-checker',
        },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  startPeriodicHealthChecks(servers: Map<string, ServerConfig>, intervalMs: number = 30000): void {
    for (const [serverName, config] of servers) {
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
}