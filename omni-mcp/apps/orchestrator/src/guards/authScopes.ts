import type { ServerConfig } from '../config/schema.js';

export class AuthScopesGuard {
  private scopes: Map<string, string[]> = new Map();

  registerServer(serverName: string, config: ServerConfig): void {
    this.scopes.set(serverName, config.scopes);
  }

  validateScope(serverName: string, requiredScope: string): boolean {
    const serverScopes = this.scopes.get(serverName) || [];
    return serverScopes.includes(requiredScope);
  }

  getServerScopes(serverName: string): string[] {
    return this.scopes.get(serverName) || [];
  }

  getAllScopes(): Map<string, string[]> {
    return new Map(this.scopes);
  }

  // Audit logging for scope violations
  logScopeViolation(serverName: string, attemptedScope: string, context: Record<string, any> = {}): void {
    console.warn({
      event: 'scope_violation',
      server: serverName,
      attemptedScope,
      allowedScopes: this.getServerScopes(serverName),
      ...context,
    });
  }
}