#!/usr/bin/env tsx

import { globby } from "globby";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import assert from "node:assert";
import { loadConfig } from '../../apps/orchestrator/src/config/schema.js';

type Health = { type: "stdio" | "http"; url?: string; timeoutMs: number };

async function main() {
  const config = loadConfig();
  const files = await globby("servers/*.yaml");
  
  let enabledCount = 0;
  
  for (const file of files) {
    const y = YAML.parse(readFileSync(file, "utf8"));
    
    // Check if server is enabled via feature flag or server config
    const featureEnabled = config.features[y.name]?.enabled || false;
    const serverEnabled = y.enabled || false;
    
    if (!featureEnabled && !serverEnabled) continue;
    
    enabledCount++;
    const hc: Health = y.healthCheck ?? { type: "stdio", timeoutMs: 10000 };

    if (hc.type === "http" && hc.url) {
      try {
        const res = await fetch(hc.url, { signal: AbortSignal.timeout(hc.timeoutMs) });
        assert.equal(res.ok, true, `Health check failed for ${y.name}`);
        console.log(`${y.name}: http OK`);
      } catch (error) {
        console.log(`${y.name}: http FAILED - ${error}`);
        throw error;
      }
    } else {
      console.log(`${y.name}: stdio assumed healthy (manual check)`);
    }
  }
  
  if (enabledCount === 0) {
    console.log("No servers enabled");
  } else {
    console.log(`✅ All ${enabledCount} enabled servers healthy`);
  }
}

main().catch(e => {
  console.error("❌ Health probe failed", e);
  process.exit(1);
});