import fs from 'node:fs';

const stream = process.env.NODE_ENV === 'production' ? process.stdout : fs.createWriteStream('./audit.log', { flags: 'a' });
const REDACT = /(token|key|secret|password)=([A-Za-z0-9._-]+)/gi;

export function audit(ev: Record<string, unknown>): void {
  const safe = JSON.stringify(ev).replace(REDACT, (_m, k) => `${k}=[redacted]`);
  stream.write(safe + '\n');
}

export function auditServerEvent(server: string, event: string, data: Record<string, unknown> = {}): void {
  audit({
    timestamp: new Date().toISOString(),
    server,
    event,
    ...data,
  });
}

export function logServerSpawn(server: string, data: Record<string, unknown> = {}): void {
  auditServerEvent(server, 'server_spawn', data);
}

export function logServerExit(server: string, data: Record<string, unknown> = {}): void {
  auditServerEvent(server, 'server_exit', data);
}

export function logServerRestart(server: string, data: Record<string, unknown> = {}): void {
  auditServerEvent(server, 'server_restart', data);
}

export function auditProbeResult(server: string, success: boolean, latencyMs: number, error?: string): void {
  auditServerEvent(server, success ? 'probe_ok' : 'probe_fail', {
    latencyMs,
    error,
  });
}

export function auditEgressBlock(hostname: string, context: string): void {
  audit({
    timestamp: new Date().toISOString(),
    event: 'egress_blocked',
    hostname,
    context,
  });
}