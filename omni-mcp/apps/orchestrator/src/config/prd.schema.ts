import { z } from "zod";

export const ProbeType = z.enum(["stdio", "http"]);

export const ProbeSpec = z.object({
  type: ProbeType,
  url: z.string().url().optional(),
  command: z.string().optional(),
  timeoutMs: z.number().int().positive().default(10000),
  intervalMs: z.number().int().positive().default(10000)
});

export const LimitsSpec = z.object({
  rps: z.number().int().positive().optional(),
  burst: z.number().int().positive().optional()
}).partial();

export const RetrySpec = z.object({
  attempts: z.number().int().nonnegative().default(3),
  backoffMs: z.number().int().nonnegative().default(500)
});

export const TimeoutsSpec = z.object({
  opMs: z.number().int().positive().default(15000),
  startMs: z.number().int().positive().default(15000)
});

export const ServerPRD = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).default({}),
  scopes: z.array(z.string()).default([]),
  probe: ProbeSpec,
  limits: LimitsSpec.default({}),
  retry: RetrySpec.default({ attempts: 3, backoffMs: 500 }),
  timeouts: TimeoutsSpec.default({ opMs: 15000, startMs: 15000 }),
  notes: z.string().optional()
});

export const FeaturesMap = z.record(z.object({ enabled: z.boolean().default(false) }).partial());

export const RuntimeSpec = z.object({
  maxConcurrency: z.number().int().positive().default(4),
  defaultTimeoutMs: z.number().int().positive().default(15000),
  retry: RetrySpec.default({ attempts: 3, backoffMs: 500 })
});

export const ObservabilitySpec = z.object({
  otelEnabled: z.union([z.boolean(), z.string()]).default(false),
  sampling: z.number().min(0).max(1).default(1.0),
  sentryDsn: z.string().optional()
});

export const SecuritySpec = z.object({
  auditLog: z.boolean().default(true),
  redactSecrets: z.boolean().default(true)
});

export const NetworkSpec = z.object({
  outboundAllowlist: z.union([z.array(z.string()), z.string()]).default([])
});

export const PRDSchema = z.object({
  runtime: RuntimeSpec,
  network: NetworkSpec,
  observability: ObservabilitySpec,
  security: SecuritySpec,
  features: FeaturesMap,
  servers: z.record(ServerPRD)
});

export type PRD = z.infer<typeof PRDSchema>;