import { describe, it, expect } from "vitest";
import { PRDSchema } from "../apps/orchestrator/src/config/prd.schema.js";

describe("PRD schema", () => {
  it("validates a minimal server map", () => {
    const cfg = PRDSchema.parse({
      runtime: { maxConcurrency: 2, defaultTimeoutMs: 10000, retry: { attempts: 1, backoffMs: 100 } },
      network: { outboundAllowlist: [] },
      observability: { otelEnabled: false, sampling: 1 },
      security: { auditLog: true, redactSecrets: true },
      features: { dummy: { enabled: true } },
      servers: {
        dummy: {
          name: "dummy",
          command: "node",
          args: ["x.js"],
          env: {},
          probe: { type: "stdio", timeoutMs: 1000, intervalMs: 1000 },
          limits: {}, retry: {}, timeouts: {}
        }
      }
    });
    expect(cfg.servers.dummy.name).toBe("dummy");
  });
});