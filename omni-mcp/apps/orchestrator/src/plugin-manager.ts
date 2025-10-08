import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import { SecurityManager } from './security-manager.js';
import { ToolRegistry } from './tool-registry.js';
import { WorkflowEngine } from './workflow-engine.js';
import { AgentOrchestrator } from './agent-orchestrator.js';
import { MonitoringSystem } from './monitoring-system.js';
import { readFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { join, dirname, basename } from 'path';
import { globby } from 'globby';

// Plugin schemas
const PluginManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  capabilities: z.array(z.object({
    name: z.string(),
    type: z.enum(['tool', 'workflow', 'agent', 'middleware', 'storage', 'ui']),
    description: z.string().optional(),
    config: z.record(z.any()).optional(),
  })).default([]),
  hooks: z.array(z.object({
    event: z.string(),
    handler: z.string(),
    priority: z.number().default(0),
  })).default([]),
  routes: z.array(z.object({
    path: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    handler: z.string(),
    middleware: z.array(z.string()).default([]),
  })).default([]),
  config: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
});

const PluginInstanceSchema = z.object({
  id: z.string(),
  manifest: PluginManifestSchema,
  path: z.string(),
  loaded: z.boolean().default(false),
  enabled: z.boolean().default(true),
  loadedAt: z.date().optional(),
  error: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  dependents: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;
export type PluginInstance = z.infer<typeof PluginInstanceSchema>;

export interface PluginContext {
  configManager: ConfigManager;
  securityManager: SecurityManager;
  toolRegistry: ToolRegistry;
  workflowEngine: WorkflowEngine;
  agentOrchestrator: AgentOrchestrator;
  monitoringSystem: MonitoringSystem;
  logger: ReturnType<typeof createLogger>;
}

export interface PluginCapability {
  name: string;
  type: 'tool' | 'workflow' | 'agent' | 'middleware' | 'storage' | 'ui';
  description?: string;
  config?: Record<string, any>;
  implementation: any;
}

export interface PluginHook {
  event: string;
  handler: string;
  priority: number;
  implementation: (...args: any[]) => Promise<any> | any;
}

export interface PluginRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  middleware: string[];
  implementation: (request: any, reply: any) => Promise<any> | any;
}

export interface Plugin {
  manifest: PluginManifest;
  capabilities: Map<string, PluginCapability>;
  hooks: Map<string, PluginHook>;
  routes: Map<string, PluginRoute>;
  context: PluginContext;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  getCapability(name: string): PluginCapability | undefined;
  getHook(event: string): PluginHook | undefined;
  getRoute(path: string, method: string): PluginRoute | undefined;
}

export class PluginManager extends EventEmitter {
  private plugins: Map<string, PluginInstance> = new Map();
  private loadedPlugins: Map<string, Plugin> = new Map();
  private pluginDirectory: string;
  private context: PluginContext;
  private logger: ReturnType<typeof createLogger>;
  private watchers: Map<string, any> = new Map();
  private isRunning: boolean = false;

  constructor(
    pluginDirectory: string,
    context: PluginContext,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.pluginDirectory = pluginDirectory;
    this.context = context;
    this.logger = logger;
  }

  /**
   * Discover and load all plugins
   */
  async discoverPlugins(): Promise<void> {
    try {
      const pluginPaths = await globby('*/plugin.json', {
        cwd: this.pluginDirectory,
        absolute: true,
      });

      this.logger.info({
        pluginDirectory: this.pluginDirectory,
        discoveredPlugins: pluginPaths.length,
      }, 'Discovering plugins');

      for (const pluginPath of pluginPaths) {
        await this.loadPluginManifest(pluginPath);
      }

      // Resolve dependencies
      await this.resolveDependencies();

      this.logger.info({
        totalPlugins: this.plugins.size,
        enabledPlugins: Array.from(this.plugins.values()).filter(p => p.enabled).length,
      }, 'Plugin discovery completed');

    } catch (error) {
      this.logger.error({ error, pluginDirectory: this.pluginDirectory }, 'Failed to discover plugins');
      throw error;
    }
  }

  /**
   * Load plugin manifest
   */
  private async loadPluginManifest(manifestPath: string): Promise<void> {
    try {
      if (!existsSync(manifestPath)) {
        this.logger.warn({ manifestPath }, 'Plugin manifest not found');
        return;
      }

      const manifestContent = readFileSync(manifestPath, 'utf8');
      const manifest = PluginManifestSchema.parse(JSON.parse(manifestContent));
      
      const pluginPath = dirname(manifestPath);
      const pluginId = basename(pluginPath);

      const pluginInstance: PluginInstance = {
        id: pluginId,
        manifest,
        path: pluginPath,
        loaded: false,
        enabled: true,
        dependencies: manifest.dependencies,
        dependents: [],
        metadata: manifest.metadata,
      };

      this.plugins.set(pluginId, pluginInstance);

      this.logger.info({
        pluginId,
        version: manifest.version,
        capabilities: manifest.capabilities.length,
        hooks: manifest.hooks.length,
        routes: manifest.routes.length,
      }, 'Plugin manifest loaded');

      this.emit('plugin:discovered', { plugin: pluginInstance });

    } catch (error) {
      this.logger.error({ error, manifestPath }, 'Failed to load plugin manifest');
    }
  }

  /**
   * Resolve plugin dependencies
   */
  private async resolveDependencies(): Promise<void> {
    for (const [pluginId, plugin] of this.plugins) {
      for (const dependency of plugin.dependencies) {
        const dependentPlugin = this.plugins.get(dependency);
        if (dependentPlugin) {
          dependentPlugin.dependents.push(pluginId);
        } else {
          this.logger.warn({
            pluginId,
            dependency,
          }, 'Plugin dependency not found');
        }
      }
    }
  }

  /**
   * Load a specific plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    const pluginInstance = this.plugins.get(pluginId);
    if (!pluginInstance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (pluginInstance.loaded) {
      this.logger.warn({ pluginId }, 'Plugin already loaded');
      return;
    }

    try {
      // Check dependencies
      await this.ensureDependenciesLoaded(pluginId);

      // Load plugin module
      const pluginModule = await this.loadPluginModule(pluginInstance.path);
      
      // Create plugin instance
      const plugin: Plugin = {
        manifest: pluginInstance.manifest,
        capabilities: new Map(),
        hooks: new Map(),
        routes: new Map(),
        context: this.context,
        initialize: pluginModule.initialize || (() => Promise.resolve()),
        destroy: pluginModule.destroy || (() => Promise.resolve()),
        getCapability: (name: string) => plugin.capabilities.get(name),
        getHook: (event: string) => plugin.hooks.get(event),
        getRoute: (path: string, method: string) => plugin.routes.get(`${method}:${path}`),
      };

      // Initialize plugin
      await plugin.initialize();

      // Register capabilities
      await this.registerPluginCapabilities(plugin);

      // Register hooks
      await this.registerPluginHooks(plugin);

      // Register routes
      await this.registerPluginRoutes(plugin);

      // Update plugin instance
      pluginInstance.loaded = true;
      pluginInstance.loadedAt = new Date();
      pluginInstance.error = undefined;

      this.loadedPlugins.set(pluginId, plugin);

      this.logger.info({
        pluginId,
        capabilities: plugin.capabilities.size,
        hooks: plugin.hooks.size,
        routes: plugin.routes.size,
      }, 'Plugin loaded successfully');

      this.emit('plugin:loaded', { pluginId, plugin });

    } catch (error) {
      pluginInstance.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error({
        pluginId,
        error,
      }, 'Failed to load plugin');

      this.emit('plugin:load_failed', { pluginId, error });
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const pluginInstance = this.plugins.get(pluginId);
    if (!pluginInstance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!pluginInstance.loaded) {
      this.logger.warn({ pluginId }, 'Plugin not loaded');
      return;
    }

    try {
      // Check dependents
      if (pluginInstance.dependents.length > 0) {
        throw new Error(`Cannot unload plugin ${pluginId}: has dependents: ${pluginInstance.dependents.join(', ')}`);
      }

      const plugin = this.loadedPlugins.get(pluginId);
      if (plugin) {
        // Unregister capabilities
        await this.unregisterPluginCapabilities(plugin);

        // Unregister hooks
        await this.unregisterPluginHooks(plugin);

        // Unregister routes
        await this.unregisterPluginRoutes(plugin);

        // Destroy plugin
        await plugin.destroy();

        this.loadedPlugins.delete(pluginId);
      }

      // Update plugin instance
      pluginInstance.loaded = false;
      pluginInstance.loadedAt = undefined;

      this.logger.info({ pluginId }, 'Plugin unloaded successfully');

      this.emit('plugin:unloaded', { pluginId });

    } catch (error) {
      this.logger.error({
        pluginId,
        error,
      }, 'Failed to unload plugin');

      this.emit('plugin:unload_failed', { pluginId, error });
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const pluginInstance = this.plugins.get(pluginId);
    if (!pluginInstance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (pluginInstance.enabled) {
      this.logger.warn({ pluginId }, 'Plugin already enabled');
      return;
    }

    pluginInstance.enabled = true;

    if (!pluginInstance.loaded) {
      await this.loadPlugin(pluginId);
    }

    this.logger.info({ pluginId }, 'Plugin enabled');
    this.emit('plugin:enabled', { pluginId });
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const pluginInstance = this.plugins.get(pluginId);
    if (!pluginInstance) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!pluginInstance.enabled) {
      this.logger.warn({ pluginId }, 'Plugin already disabled');
      return;
    }

    if (pluginInstance.loaded) {
      await this.unloadPlugin(pluginId);
    }

    pluginInstance.enabled = false;

    this.logger.info({ pluginId }, 'Plugin disabled');
    this.emit('plugin:disabled', { pluginId });
  }

  /**
   * Ensure plugin dependencies are loaded
   */
  private async ensureDependenciesLoaded(pluginId: string): Promise<void> {
    const pluginInstance = this.plugins.get(pluginId);
    if (!pluginInstance) return;

    for (const dependency of pluginInstance.dependencies) {
      const dependentPlugin = this.plugins.get(dependency);
      if (dependentPlugin && dependentPlugin.enabled && !dependentPlugin.loaded) {
        await this.loadPlugin(dependency);
      }
    }
  }

  /**
   * Load plugin module
   */
  private async loadPluginModule(pluginPath: string): Promise<any> {
    const modulePath = join(pluginPath, 'index.js');
    
    if (!existsSync(modulePath)) {
      throw new Error(`Plugin module not found: ${modulePath}`);
    }

    // Dynamic import
    const module = await import(modulePath);
    return module.default || module;
  }

  /**
   * Register plugin capabilities
   */
  private async registerPluginCapabilities(plugin: Plugin): Promise<void> {
    for (const capability of plugin.manifest.capabilities) {
      const capabilityImpl: PluginCapability = {
        name: capability.name,
        type: capability.type,
        description: capability.description,
        config: capability.config,
        implementation: plugin.getCapability(capability.name),
      };

      plugin.capabilities.set(capability.name, capabilityImpl);

      // Register with appropriate system based on type
      switch (capability.type) {
        case 'tool':
          await this.registerToolCapability(plugin, capabilityImpl);
          break;
        case 'workflow':
          await this.registerWorkflowCapability(plugin, capabilityImpl);
          break;
        case 'agent':
          await this.registerAgentCapability(plugin, capabilityImpl);
          break;
        case 'middleware':
          await this.registerMiddlewareCapability(plugin, capabilityImpl);
          break;
        case 'storage':
          await this.registerStorageCapability(plugin, capabilityImpl);
          break;
        case 'ui':
          await this.registerUICapability(plugin, capabilityImpl);
          break;
      }
    }
  }

  /**
   * Register tool capability
   */
  private async registerToolCapability(plugin: Plugin, capability: PluginCapability): Promise<void> {
    if (capability.implementation) {
      await this.context.toolRegistry.registerTool(
        capability.name,
        plugin.manifest.name,
        capability.implementation
      );
    }
  }

  /**
   * Register workflow capability
   */
  private async registerWorkflowCapability(plugin: Plugin, capability: PluginCapability): Promise<void> {
    if (capability.implementation) {
      await this.context.workflowEngine.registerWorkflow(capability.implementation);
    }
  }

  /**
   * Register agent capability
   */
  private async registerAgentCapability(plugin: Plugin, capability: PluginCapability): Promise<void> {
    if (capability.implementation) {
      await this.context.agentOrchestrator.registerAgent(capability.implementation);
    }
  }

  /**
   * Register middleware capability
   */
  private async registerMiddlewareCapability(plugin: Plugin, capability: PluginCapability): Promise<void> {
    // Middleware registration would be handled by the HTTP server
    this.emit('middleware:register', { plugin: plugin.manifest.name, capability });
  }

  /**
   * Register storage capability
   */
  private async registerStorageCapability(plugin: Plugin, capability: PluginCapability): Promise<void> {
    // Storage registration would be handled by the storage system
    this.emit('storage:register', { plugin: plugin.manifest.name, capability });
  }

  /**
   * Register UI capability
   */
  private async registerUICapability(plugin: Plugin, capability: PluginCapability): Promise<void> {
    // UI registration would be handled by the UI system
    this.emit('ui:register', { plugin: plugin.manifest.name, capability });
  }

  /**
   * Register plugin hooks
   */
  private async registerPluginHooks(plugin: Plugin): Promise<void> {
    for (const hook of plugin.manifest.hooks) {
      const hookImpl: PluginHook = {
        event: hook.event,
        handler: hook.handler,
        priority: hook.priority,
        implementation: plugin.getHook(hook.event)?.implementation || (() => Promise.resolve()),
      };

      plugin.hooks.set(hook.event, hookImpl);

      // Register with event system
      this.on(hook.event, async (...args) => {
        try {
          await hookImpl.implementation(...args);
        } catch (error) {
          this.logger.error({
            plugin: plugin.manifest.name,
            hook: hook.event,
            error,
          }, 'Plugin hook execution failed');
        }
      });
    }
  }

  /**
   * Register plugin routes
   */
  private async registerPluginRoutes(plugin: Plugin): Promise<void> {
    for (const route of plugin.manifest.routes) {
      const routeImpl: PluginRoute = {
        path: route.path,
        method: route.method,
        handler: route.handler,
        middleware: route.middleware,
        implementation: plugin.getRoute(route.path, route.method)?.implementation || (() => Promise.resolve()),
      };

      plugin.routes.set(`${route.method}:${route.path}`, routeImpl);

      // Register with HTTP server
      this.emit('route:register', { plugin: plugin.manifest.name, route: routeImpl });
    }
  }

  /**
   * Unregister plugin capabilities
   */
  private async unregisterPluginCapabilities(plugin: Plugin): Promise<void> {
    for (const capability of plugin.capabilities.values()) {
      switch (capability.type) {
        case 'tool':
          // Tool unregistration would be handled by tool registry
          this.emit('tool:unregister', { plugin: plugin.manifest.name, capability });
          break;
        case 'workflow':
          // Workflow unregistration would be handled by workflow engine
          this.emit('workflow:unregister', { plugin: plugin.manifest.name, capability });
          break;
        case 'agent':
          // Agent unregistration would be handled by agent orchestrator
          this.emit('agent:unregister', { plugin: plugin.manifest.name, capability });
          break;
      }
    }
  }

  /**
   * Unregister plugin hooks
   */
  private async unregisterPluginHooks(plugin: Plugin): Promise<void> {
    for (const hook of plugin.hooks.values()) {
      this.removeAllListeners(hook.event);
    }
  }

  /**
   * Unregister plugin routes
   */
  private async unregisterPluginRoutes(plugin: Plugin): Promise<void> {
    for (const route of plugin.routes.values()) {
      this.emit('route:unregister', { plugin: plugin.manifest.name, route });
    }
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get loaded plugin by ID
   */
  getLoadedPlugin(pluginId: string): Plugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all loaded plugins
   */
  getAllLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get plugins by capability type
   */
  getPluginsByCapabilityType(type: string): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(plugin =>
      plugin.manifest.capabilities.some(cap => cap.type === type)
    );
  }

  /**
   * Get plugin dependencies
   */
  getPluginDependencies(pluginId: string): string[] {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.dependencies : [];
  }

  /**
   * Get plugin dependents
   */
  getPluginDependents(pluginId: string): string[] {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.dependents : [];
  }

  /**
   * Start plugin file watching
   */
  private startPluginWatching(): void {
    const manifestPath = join(this.pluginDirectory, '*/plugin.json');
    
    watchFile(manifestPath, { interval: 1000 }, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        this.logger.info('Plugin manifest changed, reloading...');
        this.discoverPlugins();
      }
    });
  }

  /**
   * Stop plugin file watching
   */
  private stopPluginWatching(): void {
    for (const [path, watcher] of this.watchers) {
      unwatchFile(path);
    }
    this.watchers.clear();
  }

  /**
   * Start the plugin manager
   */
  async start(): Promise<void> {
    this.isRunning = true;
    
    // Discover plugins
    await this.discoverPlugins();
    
    // Load enabled plugins
    for (const [pluginId, plugin] of this.plugins) {
      if (plugin.enabled) {
        try {
          await this.loadPlugin(pluginId);
        } catch (error) {
          this.logger.error({ pluginId, error }, 'Failed to load enabled plugin');
        }
      }
    }
    
    // Start file watching
    this.startPluginWatching();
    
    this.logger.info({
      totalPlugins: this.plugins.size,
      loadedPlugins: this.loadedPlugins.size,
    }, 'Plugin manager started');
  }

  /**
   * Stop the plugin manager
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Stop file watching
    this.stopPluginWatching();
    
    // Unload all plugins
    for (const pluginId of this.loadedPlugins.keys()) {
      try {
        await this.unloadPlugin(pluginId);
      } catch (error) {
        this.logger.error({ pluginId, error }, 'Failed to unload plugin during shutdown');
      }
    }
    
    this.logger.info('Plugin manager stopped');
  }
}