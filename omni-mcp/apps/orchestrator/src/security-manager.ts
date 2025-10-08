import { z } from 'zod';
import { EventEmitter } from 'events';
import { createLogger } from '../observability/logger.js';
import { ConfigManager } from './config-manager.js';
import crypto from 'crypto';

// Security schemas
const PermissionSchema = z.object({
  resource: z.string(),
  action: z.string(),
  conditions: z.record(z.any()).optional(),
});

const RoleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(PermissionSchema),
  metadata: z.record(z.any()).default({}),
});

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  roles: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.date(),
});

const AuditEventSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  result: z.enum(['success', 'failure', 'denied']),
  details: z.record(z.any()).optional(),
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  roles: string[];
  permissions: Permission[];
  metadata: Record<string, any>;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
}

export class SecurityManager extends EventEmitter {
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private sessions: Map<string, Session> = new Map();
  private auditEvents: AuditEvent[] = [];
  private logger: ReturnType<typeof createLogger>;
  private configManager: ConfigManager;
  private encryptionKey: string;
  private sessionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    configManager: ConfigManager,
    logger: ReturnType<typeof createLogger>
  ) {
    super();
    this.configManager = configManager;
    this.logger = logger;
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    const defaultRoles: Role[] = [
      {
        name: 'admin',
        description: 'Full system access',
        permissions: [
          { resource: '*', action: '*' },
        ],
      },
      {
        name: 'user',
        description: 'Standard user access',
        permissions: [
          { resource: 'workflow', action: 'execute' },
          { resource: 'tool', action: 'use' },
          { resource: 'agent', action: 'communicate' },
        ],
      },
      {
        name: 'developer',
        description: 'Developer access',
        permissions: [
          { resource: 'workflow', action: '*' },
          { resource: 'tool', action: '*' },
          { resource: 'agent', action: '*' },
          { resource: 'config', action: 'read' },
        ],
      },
      {
        name: 'viewer',
        description: 'Read-only access',
        permissions: [
          { resource: 'workflow', action: 'read' },
          { resource: 'tool', action: 'read' },
          { resource: 'agent', action: 'read' },
          { resource: 'config', action: 'read' },
        ],
      },
    ];

    for (const role of defaultRoles) {
      this.roles.set(role.name, role);
    }
  }

  /**
   * Authenticate a user
   */
  async authenticate(
    credentials: { email?: string; userId?: string; token?: string },
    context: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<AuthenticationResult> {
    try {
      let user: User | undefined;

      // Token-based authentication
      if (credentials.token) {
        const session = this.sessions.get(credentials.token);
        if (session && session.expiresAt > new Date()) {
          user = this.users.get(session.userId);
          if (user) {
            // Update session last access
            session.metadata.lastAccess = new Date();
            return {
              success: true,
              user,
              session,
            };
          }
        }
      }

      // User ID or email authentication
      if (credentials.userId) {
        user = this.users.get(credentials.userId);
      } else if (credentials.email) {
        user = Array.from(this.users.values()).find(u => u.email === credentials.email);
      }

      if (!user) {
        this.logAuditEvent({
          action: 'authenticate',
          resource: 'user',
          result: 'failure',
          details: { reason: 'user_not_found', credentials: this.redactCredentials(credentials) },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });

        return {
          success: false,
          error: 'User not found',
        };
      }

      // Create session
      const session = await this.createSession(user.id, context);

      this.logAuditEvent({
        userId: user.id,
        action: 'authenticate',
        resource: 'user',
        result: 'success',
        details: { userId: user.id },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return {
        success: true,
        user,
        session,
      };

    } catch (error) {
      this.logger.error({ error, credentials }, 'Authentication failed');
      
      this.logAuditEvent({
        action: 'authenticate',
        resource: 'user',
        result: 'failure',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  /**
   * Create a session for a user
   */
  async createSession(
    userId: string,
    context: { ipAddress?: string; userAgent?: string } = {}
  ): Promise<Session> {
    const sessionId = this.generateSessionId();
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + this.sessionTimeout);

    const session: Session = {
      id: sessionId,
      userId,
      token,
      expiresAt,
      metadata: {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        createdAt: new Date(),
        lastAccess: new Date(),
      },
      createdAt: new Date(),
    };

    this.sessions.set(token, session);

    this.logger.info({
      userId,
      sessionId,
      expiresAt,
    }, 'Session created');

    return session;
  }

  /**
   * Revoke a session
   */
  async revokeSession(token: string): Promise<void> {
    const session = this.sessions.get(token);
    if (session) {
      this.sessions.delete(token);
      
      this.logAuditEvent({
        userId: session.userId,
        sessionId: session.id,
        action: 'revoke_session',
        resource: 'session',
        result: 'success',
        details: { sessionId: session.id },
      });

      this.logger.info({
        userId: session.userId,
        sessionId: session.id,
      }, 'Session revoked');
    }
  }

  /**
   * Check if user has permission to perform action on resource
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context: Record<string, any> = {}
  ): Promise<AuthorizationResult> {
    try {
      const user = this.users.get(userId);
      if (!user) {
        return {
          allowed: false,
          reason: 'User not found',
        };
      }

      const userRoles = user.roles.map(roleName => this.roles.get(roleName)).filter(Boolean) as Role[];
      const userPermissions = userRoles.flatMap(role => role.permissions);

      // Check for wildcard permissions
      const hasWildcardPermission = userPermissions.some(permission => 
        permission.resource === '*' && permission.action === '*'
      );

      if (hasWildcardPermission) {
        this.logAuditEvent({
          userId,
          action: 'authorize',
          resource,
          result: 'success',
          details: { reason: 'wildcard_permission', action },
        });

        return { allowed: true };
      }

      // Check specific permissions
      const hasPermission = userPermissions.some(permission => {
        const resourceMatch = permission.resource === '*' || permission.resource === resource;
        const actionMatch = permission.action === '*' || permission.action === action;
        
        if (resourceMatch && actionMatch) {
          // Check conditions if any
          if (permission.conditions) {
            return this.evaluateConditions(permission.conditions, context);
          }
          return true;
        }
        
        return false;
      });

      if (hasPermission) {
        this.logAuditEvent({
          userId,
          action: 'authorize',
          resource,
          result: 'success',
          details: { action },
        });

        return { allowed: true };
      }

      this.logAuditEvent({
        userId,
        action: 'authorize',
        resource,
        result: 'denied',
        details: { reason: 'insufficient_permissions', action },
      });

      return {
        allowed: false,
        reason: 'Insufficient permissions',
        requiredPermissions: [{ resource, action }],
      };

    } catch (error) {
      this.logger.error({ error, userId, resource, action }, 'Permission check failed');
      
      this.logAuditEvent({
        userId,
        action: 'authorize',
        resource,
        result: 'failure',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      return {
        allowed: false,
        reason: 'Permission check failed',
      };
    }
  }

  /**
   * Check tool permission
   */
  async checkToolPermission(
    toolName: string,
    providerName: string,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> {
    if (!userId) {
      return false;
    }

    const result = await this.checkPermission(userId, 'tool', 'use', {
      toolName,
      providerName,
      sessionId,
    });

    return result.allowed;
  }

  /**
   * Get security context for user
   */
  async getSecurityContext(userId: string): Promise<SecurityContext | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    const userRoles = user.roles.map(roleName => this.roles.get(roleName)).filter(Boolean) as Role[];
    const permissions = userRoles.flatMap(role => role.permissions);

    return {
      userId,
      roles: user.roles,
      permissions,
      metadata: user.metadata,
    };
  }

  /**
   * Create or update a user
   */
  async createUser(userData: {
    id: string;
    email?: string;
    roles?: string[];
    metadata?: Record<string, any>;
  }): Promise<User> {
    const user: User = {
      id: userData.id,
      email: userData.email,
      roles: userData.roles || ['user'],
      metadata: userData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);

    this.logAuditEvent({
      userId: user.id,
      action: 'create_user',
      resource: 'user',
      result: 'success',
      details: { userId: user.id, roles: user.roles },
    });

    this.logger.info({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    }, 'User created');

    return user;
  }

  /**
   * Update user roles
   */
  async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const oldRoles = [...user.roles];
    user.roles = roles;
    user.updatedAt = new Date();

    this.logAuditEvent({
      userId,
      action: 'update_roles',
      resource: 'user',
      result: 'success',
      details: { oldRoles, newRoles: roles },
    });

    this.logger.info({
      userId,
      oldRoles,
      newRoles: roles,
    }, 'User roles updated');
  }

  /**
   * Create or update a role
   */
  async createRole(roleData: {
    name: string;
    description?: string;
    permissions: Permission[];
    metadata?: Record<string, any>;
  }): Promise<Role> {
    const role: Role = {
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions,
      metadata: roleData.metadata || {},
    };

    this.roles.set(role.name, role);

    this.logAuditEvent({
      action: 'create_role',
      resource: 'role',
      result: 'success',
      details: { roleName: role.name, permissions: role.permissions.length },
    });

    this.logger.info({
      roleName: role.name,
      permissions: role.permissions.length,
    }, 'Role created');

    return role;
  }

  /**
   * Get audit events
   */
  getAuditEvents(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    result?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): AuditEvent[] {
    let events = [...this.auditEvents];

    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }

    if (filters.action) {
      events = events.filter(e => e.action === filters.action);
    }

    if (filters.resource) {
      events = events.filter(e => e.resource === filters.resource);
    }

    if (filters.result) {
      events = events.filter(e => e.result === filters.result);
    }

    if (filters.startDate) {
      events = events.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      events = events.filter(e => e.timestamp <= filters.endDate!);
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  /**
   * Log audit event
   */
  private logAuditEvent(eventData: Partial<AuditEvent>): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      userId: eventData.userId,
      sessionId: eventData.sessionId,
      action: eventData.action || 'unknown',
      resource: eventData.resource || 'unknown',
      result: eventData.result || 'success',
      details: eventData.details,
      timestamp: new Date(),
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
    };

    this.auditEvents.push(event);

    // Keep only last 10000 events to prevent memory issues
    if (this.auditEvents.length > 10000) {
      this.auditEvents = this.auditEvents.slice(-10000);
    }

    this.emit('audit:event', { event });
  }

  /**
   * Evaluate permission conditions
   */
  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Redact sensitive credentials
   */
  private redactCredentials(credentials: any): any {
    const redacted = { ...credentials };
    if (redacted.token) {
      redacted.token = '[REDACTED]';
    }
    if (redacted.password) {
      redacted.password = '[REDACTED]';
    }
    return redacted;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate authentication token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [token, session] of this.sessions) {
      if (session.expiresAt < now) {
        this.sessions.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info({ cleaned }, 'Expired sessions cleaned up');
    }
  }

  /**
   * Start the security manager
   */
  async start(): Promise<void> {
    // Start periodic cleanup of expired sessions
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000); // Every hour

    this.logger.info('Security manager started');
  }

  /**
   * Stop the security manager
   */
  async stop(): Promise<void> {
    this.logger.info('Security manager stopped');
  }
}