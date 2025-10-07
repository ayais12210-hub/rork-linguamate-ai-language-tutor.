import { appendFileSync } from 'fs';
import { join } from 'path';

export interface AuditEvent {
  timestamp: string;
  event: string;
  server: string;
  data: Record<string, unknown>;
}

// Redact values that look like secrets
function redactSecrets(value: unknown): unknown {
  if (typeof value === 'string') {
    // Redact token-like patterns
    if (value.match(/^[A-Za-z0-9]{20,}$/) || value.includes('token') || value.includes('key') || value.includes('secret')) {
      return '[REDACTED]';
    }
  }
  
  if (typeof value === 'object' && value !== null) {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSecrets(val);
      }
    }
    return redacted;
  }
  
  return value;
}

// Format audit event as NDJSON
function formatAuditEvent(event: AuditEvent): string {
  const redactedData = redactSecrets(event.data);
  return JSON.stringify({
    ...event,
    data: redactedData,
  }) + '\n';
}

// Write audit event to file and stdout
export function logAuditEvent(event: AuditEvent): void {
  const formatted = formatAuditEvent(event);
  
  // Write to audit.log in development
  if (process.env.NODE_ENV !== 'production') {
    const auditLogPath = join(process.cwd(), 'audit.log');
    appendFileSync(auditLogPath, formatted);
  }
  
  // Write to stdout in production
  if (process.env.NODE_ENV === 'production') {
    process.stdout.write(formatted);
  }
}

// Log server spawn event
export function logServerSpawn(server: string, data: Record<string, unknown>): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    event: 'spawn',
    server,
    data,
  });
}

// Log server exit event
export function logServerExit(server: string, data: Record<string, unknown>): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    event: 'exit',
    server,
    data,
  });
}

// Log server restart event
export function logServerRestart(server: string, data: Record<string, unknown>): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    event: 'restart',
    server,
    data,
  });
}

// Log probe success event
export function logProbeSuccess(server: string, data: Record<string, unknown>): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    event: 'probe_ok',
    server,
    data,
  });
}

// Log probe failure event
export function logProbeFailure(server: string, data: Record<string, unknown>): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    event: 'probe_fail',
    server,
    data,
  });
}

// Log security event
export function logSecurityEvent(server: string, data: Record<string, unknown>): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    event: 'security',
    server,
    data,
  });
}

// Log configuration change event
export function logConfigChange(server: string, data: Record<string, unknown>): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    event: 'config_change',
    server,
    data,
  });
}