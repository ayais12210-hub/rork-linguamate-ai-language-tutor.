import { z } from "zod";

export const LifecycleState = z.enum(["idle","spawning","running","degraded","down","stopping"]);
export const EventType = z.enum(["spawn","exit","probe_ok","probe_fail","restart","shutdown"]);

export const LifecycleEvent = z.object({
  ts: z.number().int(),
  srv: z.string(),
  type: EventType,
  code: z.number().int().optional(),
  reason: z.string().optional(),
  latencyMs: z.number().int().optional()
});

export const ServerStatus = z.object({
  name: z.string(),
  state: LifecycleState,
  lastProbeAt: z.number().int().optional(),
  failures: z.number().int().default(0)
});

export type LifecycleEventT = z.infer<typeof LifecycleEvent>;
export type ServerStatusT = z.infer<typeof ServerStatus>;