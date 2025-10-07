import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import type { ServerConfig, Config } from './config/schema.js';

export class ServerRegistry {
  private servers: Map<string, ServerConfig> = new Map();
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.loadServerConfigs();
  }

  private loadServerConfigs(): void {
    const serversDir = join(process.cwd(), 'servers');
    
    try {
      const files = readdirSync(serversDir).filter(f => f.endsWith('.yaml'));
      
      for (const file of files) {
        const filePath = join(serversDir, file);
        const content = readFileSync(filePath, 'utf8');
        const serverConfig = yaml.load(content) as ServerConfig;
        
        if (serverConfig && serverConfig.name) {
          this.servers.set(serverConfig.name, serverConfig);
        }
      }
    } catch (error) {
      console.warn('Could not load server configs:', error);
    }
  }

  getEnabledServers(): Array<[string, ServerConfig]> {
    const enabled: Array<[string, ServerConfig]> = [];
    
    for (const [name, serverConfig] of this.servers) {
      const featureEnabled = this.config.features[name]?.enabled || false;
      const serverEnabled = serverConfig.enabled || false;
      
      if (featureEnabled || serverEnabled) {
        enabled.push([name, serverConfig]);
      }
    }
    
    return enabled;
  }

  getServer(name: string): ServerConfig | undefined {
    return this.servers.get(name);
  }

  getAllServers(): Map<string, ServerConfig> {
    return new Map(this.servers);
  }

  isServerEnabled(name: string): boolean {
    const featureEnabled = this.config.features[name]?.enabled || false;
    const serverConfig = this.servers.get(name);
    const serverEnabled = serverConfig?.enabled || false;
    
    return featureEnabled || serverEnabled;
  }

  getServerHealthStatus(): Record<string, { enabled: boolean; hasRequiredEnvs: boolean }> {
    const status: Record<string, { enabled: boolean; hasRequiredEnvs: boolean }> = {};
    
    for (const [name, serverConfig] of this.servers) {
      const enabled = this.isServerEnabled(name);
      const hasRequiredEnvs = this.checkRequiredEnvs(serverConfig);
      
      status[name] = { enabled, hasRequiredEnvs };
    }
    
    return status;
  }

  private checkRequiredEnvs(serverConfig: ServerConfig): boolean {
    if (!serverConfig.env) {
      return true;
    }
    
    for (const [key, value] of Object.entries(serverConfig.env)) {
      if (value && !process.env[key]) {
        return false;
      }
    }
    return true;
  }
}