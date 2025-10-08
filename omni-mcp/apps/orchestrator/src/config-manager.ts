import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { readFileSync, writeFileSync, watchFile, unwatchFile } from 'fs';
import { join } from 'path';

// Configuration schemas
const FeatureFlagSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  description: z.string().optional(),
  rolloutPercentage: z.number().min(0).max(100).default(100),
  targetUsers: z.array(z.string()).default([]),
  targetSessions: z.array(z.string()).default([]),
  conditions: z.record(z.any()).optional(),
  metadata: z.record(z.any()).default({}),
});

const ConfigValueSchema = z.object({
  key: z.string(),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().optional(),
  validation: z.record(z.any()).optional(),
  metadata: z.record(z.any()).default({}),
});

const ConfigSectionSchema = z.object({
  name: z.string(),
  values: z.array(ConfigValueSchema),
  description: z.string().optional(),
  metadata: z.record(z.any()).default({}),
});

const ConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  environment: z.string().default('development'),
  featureFlags: z.array(FeatureFlagSchema).default([]),
  sections: z.array(ConfigSectionSchema).default([]),
  metadata: z.record(z.any()).default({}),
});

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type ConfigValue = z.infer<typeof ConfigValueSchema>;
export type ConfigSection = z.infer<typeof ConfigSectionSchema>;
export type Config = z.infer<typeof ConfigSchema>;

export interface ConfigChangeEvent {
  type: 'feature_flag' | 'config_value' | 'section' | 'full_reload';
  key?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConfigManager extends EventEmitter {
  private config: Config;
  private configPath: string;
  private logger: ReturnType<typeof createLogger>;
  private watchers: Map<string, any> = new Map();
  private validationRules: Map<string, z.ZodSchema> = new Map();
  private cache: Map<string, { value: any; timestamp: Date; ttl: number }> = new Map();

  constructor(
    configPath: string,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.configPath = configPath;
    this.logger = logger;
    this.config = this.loadConfig();
    this.setupFileWatcher();
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): Config {
    try {
      const configData = readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(configData);
      return ConfigSchema.parse(parsed);
    } catch (error) {
      this.logger.warn({ error, path: this.configPath }, 'Failed to load config, using defaults');
      return ConfigSchema.parse({});
    }
  }

  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    try {
      const configData = JSON.stringify(this.config, null, 2);
      writeFileSync(this.configPath, configData, 'utf8');
      this.logger.info({ path: this.configPath }, 'Configuration saved');
    } catch (error) {
      this.logger.error({ error, path: this.configPath }, 'Failed to save configuration');
      throw error;
    }
  }

  /**
   * Setup file watcher for configuration changes
   */
  private setupFileWatcher(): void {
    watchFile(this.configPath, { interval: 1000 }, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        this.logger.info('Configuration file changed, reloading...');
        this.reloadConfig();
      }
    });
  }

  /**
   * Reload configuration from file
   */
  private reloadConfig(): void {
    const oldConfig = this.config;
    this.config = this.loadConfig();
    
    // Emit change events
    this.emit('config:reloaded', {
      type: 'full_reload',
      timestamp: new Date(),
    });

    // Compare and emit specific changes
    this.compareConfigs(oldConfig, this.config);
    
    // Clear cache
    this.cache.clear();
  }

  /**
   * Compare configurations and emit change events
   */
  private compareConfigs(oldConfig: Config, newConfig: Config): void {
    // Compare feature flags
    const oldFlags = new Map(oldConfig.featureFlags.map(f => [f.name, f]));
    const newFlags = new Map(newConfig.featureFlags.map(f => [f.name, f]));

    for (const [name, newFlag] of newFlags) {
      const oldFlag = oldFlags.get(name);
      if (!oldFlag) {
        this.emit('config:changed', {
          type: 'feature_flag',
          key: name,
          oldValue: undefined,
          newValue: newFlag,
          timestamp: new Date(),
        });
      } else if (oldFlag.enabled !== newFlag.enabled) {
        this.emit('config:changed', {
          type: 'feature_flag',
          key: name,
          oldValue: oldFlag.enabled,
          newValue: newFlag.enabled,
          timestamp: new Date(),
        });
      }
    }

    // Compare config sections
    const oldSections = new Map(oldConfig.sections.map(s => [s.name, s]));
    const newSections = new Map(newConfig.sections.map(s => [s.name, s]));

    for (const [name, newSection] of newSections) {
      const oldSection = oldSections.get(name);
      if (!oldSection) {
        this.emit('config:changed', {
          type: 'section',
          key: name,
          oldValue: undefined,
          newValue: newSection,
          timestamp: new Date(),
        });
      } else {
        this.compareSections(oldSection, newSection);
      }
    }
  }

  /**
   * Compare configuration sections
   */
  private compareSections(oldSection: ConfigSection, newSection: ConfigSection): void {
    const oldValues = new Map(oldSection.values.map(v => [v.key, v]));
    const newValues = new Map(newSection.values.map(v => [v.key, v]));

    for (const [key, newValue] of newValues) {
      const oldValue = oldValues.get(key);
      if (!oldValue) {
        this.emit('config:changed', {
          type: 'config_value',
          key: `${oldSection.name}.${key}`,
          oldValue: undefined,
          newValue: newValue.value,
          timestamp: new Date(),
        });
      } else if (JSON.stringify(oldValue.value) !== JSON.stringify(newValue.value)) {
        this.emit('config:changed', {
          type: 'config_value',
          key: `${oldSection.name}.${key}`,
          oldValue: oldValue.value,
          newValue: newValue.value,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Get a feature flag value
   */
  getFeatureFlag(name: string, context?: { userId?: string; sessionId?: string }): boolean {
    const flag = this.config.featureFlags.find(f => f.name === name);
    if (!flag) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashString(context?.userId || context?.sessionId || 'default');
      const percentage = (hash % 100) + 1;
      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check target users
    if (flag.targetUsers.length > 0 && context?.userId) {
      if (!flag.targetUsers.includes(context.userId)) {
        return false;
      }
    }

    // Check target sessions
    if (flag.targetSessions.length > 0 && context?.sessionId) {
      if (!flag.targetSessions.includes(context.sessionId)) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions && context) {
      for (const [key, value] of Object.entries(flag.conditions)) {
        if (context[key as keyof typeof context] !== value) {
          return false;
        }
      }
    }

    return flag.enabled;
  }

  /**
   * Set a feature flag
   */
  setFeatureFlag(name: string, enabled: boolean, options: {
    description?: string;
    rolloutPercentage?: number;
    targetUsers?: string[];
    targetSessions?: string[];
    conditions?: Record<string, any>;
  } = {}): void {
    const existingIndex = this.config.featureFlags.findIndex(f => f.name === name);
    const flag: FeatureFlag = {
      name,
      enabled,
      description: options.description,
      rolloutPercentage: options.rolloutPercentage || 100,
      targetUsers: options.targetUsers || [],
      targetSessions: options.targetSessions || [],
      conditions: options.conditions,
      metadata: {},
    };

    if (existingIndex >= 0) {
      const oldFlag = this.config.featureFlags[existingIndex];
      this.config.featureFlags[existingIndex] = flag;
      
      this.emit('config:changed', {
        type: 'feature_flag',
        key: name,
        oldValue: oldFlag.enabled,
        newValue: enabled,
        timestamp: new Date(),
      });
    } else {
      this.config.featureFlags.push(flag);
      
      this.emit('config:changed', {
        type: 'feature_flag',
        key: name,
        oldValue: undefined,
        newValue: enabled,
        timestamp: new Date(),
      });
    }

    this.saveConfig();
  }

  /**
   * Get a configuration value
   */
  getConfigValue(section: string, key: string, defaultValue?: any): any {
    const cacheKey = `${section}.${key}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < cached.ttl) {
      return cached.value;
    }

    const sectionConfig = this.config.sections.find(s => s.name === section);
    if (!sectionConfig) {
      return defaultValue;
    }

    const value = sectionConfig.values.find(v => v.key === key);
    const result = value ? value.value : defaultValue;

    // Cache the result
    this.cache.set(cacheKey, {
      value: result,
      timestamp: new Date(),
      ttl: 300000, // 5 minutes
    });

    return result;
  }

  /**
   * Set a configuration value
   */
  setConfigValue(
    section: string,
    key: string,
    value: any,
    options: {
      description?: string;
      validation?: Record<string, any>;
    } = {}
  ): void {
    let sectionConfig = this.config.sections.find(s => s.name === section);
    
    if (!sectionConfig) {
      sectionConfig = {
        name: section,
        values: [],
        metadata: {},
      };
      this.config.sections.push(sectionConfig);
    }

    const existingIndex = sectionConfig.values.findIndex(v => v.key === key);
    const configValue: ConfigValue = {
      key,
      value,
      type: this.getType(value),
      description: options.description,
      validation: options.validation,
      metadata: {},
    };

    if (existingIndex >= 0) {
      const oldValue = sectionConfig.values[existingIndex];
      sectionConfig.values[existingIndex] = configValue;
      
      this.emit('config:changed', {
        type: 'config_value',
        key: `${section}.${key}`,
        oldValue: oldValue.value,
        newValue: value,
        timestamp: new Date(),
      });
    } else {
      sectionConfig.values.push(configValue);
      
      this.emit('config:changed', {
        type: 'config_value',
        key: `${section}.${key}`,
        oldValue: undefined,
        newValue: value,
        timestamp: new Date(),
      });
    }

    // Clear cache for this key
    this.cache.delete(`${section}.${key}`);
    this.saveConfig();
  }

  /**
   * Get all feature flags
   */
  getFeatureFlags(): FeatureFlag[] {
    return [...this.config.featureFlags];
  }

  /**
   * Get all configuration sections
   */
  getConfigSections(): ConfigSection[] {
    return [...this.config.sections];
  }

  /**
   * Get configuration section
   */
  getConfigSection(section: string): ConfigSection | undefined {
    return this.config.sections.find(s => s.name === section);
  }

  /**
   * Validate configuration
   */
  validateConfig(): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      ConfigSchema.parse(this.config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push(`Validation error: ${error}`);
      }
    }

    // Validate feature flags
    for (const flag of this.config.featureFlags) {
      if (flag.rolloutPercentage < 0 || flag.rolloutPercentage > 100) {
        errors.push(`Feature flag ${flag.name}: rolloutPercentage must be between 0 and 100`);
      }
    }

    // Validate config values
    for (const section of this.config.sections) {
      for (const value of section.values) {
        if (value.validation) {
          const validationRule = this.validationRules.get(`${section.name}.${value.key}`);
          if (validationRule) {
            try {
              validationRule.parse(value.value);
            } catch (error) {
              if (error instanceof z.ZodError) {
                errors.push(`Config ${section.name}.${value.key}: ${error.errors.map(e => e.message).join(', ')}`);
              }
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Register validation rule for a config value
   */
  registerValidationRule(section: string, key: string, schema: z.ZodSchema): void {
    this.validationRules.set(`${section}.${key}`, schema);
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerName: string): Record<string, any> {
    return this.getConfigValue('providers', providerName, {});
  }

  /**
   * Set provider configuration
   */
  setProviderConfig(providerName: string, config: Record<string, any>): void {
    this.setConfigValue('providers', providerName, config, {
      description: `Configuration for ${providerName} provider`,
    });
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(): Record<string, any> {
    return this.getConfigValue('environment', this.config.environment, {});
  }

  /**
   * Set environment
   */
  setEnvironment(environment: string): void {
    this.config.environment = environment;
    this.saveConfig();
    
    this.emit('config:changed', {
      type: 'config_value',
      key: 'environment',
      oldValue: this.config.environment,
      newValue: environment,
      timestamp: new Date(),
    });
  }

  /**
   * Export configuration
   */
  exportConfig(): Config {
    return { ...this.config };
  }

  /**
   * Import configuration
   */
  importConfig(config: Config): void {
    const oldConfig = this.config;
    this.config = ConfigSchema.parse(config);
    
    this.emit('config:reloaded', {
      type: 'full_reload',
      timestamp: new Date(),
    });

    this.compareConfigs(oldConfig, this.config);
    this.cache.clear();
    this.saveConfig();
  }

  /**
   * Get configuration metadata
   */
  getMetadata(): Record<string, any> {
    return { ...this.config.metadata };
  }

  /**
   * Set configuration metadata
   */
  setMetadata(metadata: Record<string, any>): void {
    this.config.metadata = { ...this.config.metadata, ...metadata };
    this.saveConfig();
  }

  /**
   * Get type of a value
   */
  private getType(value: any): ConfigValue['type'] {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'string';
  }

  /**
   * Hash string for consistent percentage calculation
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Start the configuration manager
   */
  async start(): Promise<void> {
    this.logger.info('Configuration manager started');
  }

  /**
   * Stop the configuration manager
   */
  async stop(): Promise<void> {
    unwatchFile(this.configPath);
    this.cache.clear();
    this.logger.info('Configuration manager stopped');
  }
}