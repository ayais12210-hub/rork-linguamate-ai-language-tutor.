#!/usr/bin/env tsx

import { globby } from "globby";
import { readFileSync } from "node:fs";
import YAML from "yaml";
import assert from "node:assert";
import { loadConfig } from '../apps/orchestrator/src/config/schema.js';

type Health = { type: "stdio" | "http"; url?: string; timeoutMs: number };
type ServerStatus = "OK" | "DEGRADED" | "DOWN" | "UNKNOWN";

interface ServerHealthResult {
  name: string;
  status: ServerStatus;
  responseTime?: number;
  error?: string;
  lastChecked: Date;
  enabled: boolean;
  critical: boolean;
}

interface HealthSummary {
  totalServers: number;
  enabledServers: number;
  healthyServers: number;
  degradedServers: number;
  downServers: number;
  criticalDown: number;
  overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  results: ServerHealthResult[];
}

// Critical servers that must be healthy for the system to function
const CRITICAL_SERVERS = [
  'neon',           // Primary database
  'supabase',       // Auth and realtime
  'openrouter',     // Primary LLM gateway
  'elevenlabs',     // TTS service
  'sentry',         // Error tracking
];

// Server-specific health check configurations
const SERVER_HEALTH_CONFIGS = {
  'openrouter': {
    testEndpoint: 'https://openrouter.ai/api/v1/models',
    timeout: 10000,
    expectedStatus: 200,
  },
  'elevenlabs': {
    testEndpoint: 'https://api.elevenlabs.io/v1/voices',
    timeout: 15000,
    expectedStatus: 200,
  },
  'gemini': {
    testEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    timeout: 10000,
    expectedStatus: 200,
  },
  'neon': {
    testEndpoint: 'https://console.neon.tech/api/v2/projects',
    timeout: 10000,
    expectedStatus: 200,
  },
  'supabase': {
    testEndpoint: 'https://api.supabase.com/v1/projects',
    timeout: 10000,
    expectedStatus: 200,
  },
  'sentry': {
    testEndpoint: 'https://sentry.io/api/0/organizations',
    timeout: 10000,
    expectedStatus: 200,
  },
  'stripe': {
    testEndpoint: 'https://api.stripe.com/v1/charges',
    timeout: 10000,
    expectedStatus: 200,
  },
  'github': {
    testEndpoint: 'https://api.github.com/user',
    timeout: 10000,
    expectedStatus: 200,
  },
  'notion': {
    testEndpoint: 'https://api.notion.com/v1/users/me',
    timeout: 10000,
    expectedStatus: 200,
  },
  'intercom': {
    testEndpoint: 'https://api.intercom.io/me',
    timeout: 10000,
    expectedStatus: 200,
  },
};

async function checkServerHealth(serverName: string, config: any): Promise<ServerHealthResult> {
  const startTime = Date.now();
  const isCritical = CRITICAL_SERVERS.includes(serverName);
  
  try {
    // Check if server has specific health config
    const healthConfig = SERVER_HEALTH_CONFIGS[serverName as keyof typeof SERVER_HEALTH_CONFIGS];
    
    if (healthConfig) {
      // Use specific health check endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), healthConfig.timeout);
      
      try {
        const response = await fetch(healthConfig.testEndpoint, {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${process.env[`${serverName.toUpperCase()}_API_KEY`] || 'mock-key'}`,
            'User-Agent': 'Linguamate-Health-Check/1.0',
          },
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (response.status === healthConfig.expectedStatus) {
          return {
            name: serverName,
            status: "OK",
            responseTime,
            lastChecked: new Date(),
            enabled: true,
            critical: isCritical,
          };
        } else {
          return {
            name: serverName,
            status: "DEGRADED",
            responseTime,
            error: `HTTP ${response.status}`,
            lastChecked: new Date(),
            enabled: true,
            critical: isCritical,
          };
        }
      } catch (error) {
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            name: serverName,
            status: "DOWN",
            responseTime,
            error: "Timeout",
            lastChecked: new Date(),
            enabled: true,
            critical: isCritical,
          };
        }
        
        return {
          name: serverName,
          status: "DOWN",
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date(),
          enabled: true,
          critical: isCritical,
        };
      }
    } else {
      // Use configured health check
      const hc: Health = config.healthCheck ?? { type: "stdio", timeoutMs: 10000 };
      
      if (hc.type === "http" && hc.url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), hc.timeoutMs);
        
        try {
          const response = await fetch(hc.url, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Linguamate-Health-Check/1.0',
            },
          });
          
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            return {
              name: serverName,
              status: "OK",
              responseTime,
              lastChecked: new Date(),
              enabled: true,
              critical: isCritical,
            };
          } else {
            return {
              name: serverName,
              status: "DEGRADED",
              responseTime,
              error: `HTTP ${response.status}`,
              lastChecked: new Date(),
              enabled: true,
              critical: isCritical,
            };
          }
        } catch (error) {
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          
          return {
            name: serverName,
            status: "DOWN",
            responseTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date(),
            enabled: true,
            critical: isCritical,
          };
        }
      } else {
        // Assume stdio servers are healthy (manual check required)
        return {
          name: serverName,
          status: "UNKNOWN",
          lastChecked: new Date(),
          enabled: true,
          critical: isCritical,
        };
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      name: serverName,
      status: "DOWN",
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date(),
      enabled: true,
      critical: isCritical,
    };
  }
}

function generateHealthSummary(results: ServerHealthResult[]): HealthSummary {
  const totalServers = results.length;
  const enabledServers = results.filter(r => r.enabled).length;
  const healthyServers = results.filter(r => r.status === "OK").length;
  const degradedServers = results.filter(r => r.status === "DEGRADED").length;
  const downServers = results.filter(r => r.status === "DOWN").length;
  const criticalDown = results.filter(r => r.critical && r.status === "DOWN").length;
  
  let overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  if (criticalDown > 0) {
    overallStatus = "CRITICAL";
  } else if (downServers > 0 || degradedServers > 0) {
    overallStatus = "DEGRADED";
  } else {
    overallStatus = "HEALTHY";
  }
  
  return {
    totalServers,
    enabledServers,
    healthyServers,
    degradedServers,
    downServers,
    criticalDown,
    overallStatus,
    results,
  };
}

function printHealthTable(summary: HealthSummary) {
  console.log("\n" + "=".repeat(80));
  console.log("LINGUAMATE.AI MCP SERVER HEALTH DASHBOARD");
  console.log("=".repeat(80));
  
  console.log(`\nOverall Status: ${summary.overallStatus}`);
  console.log(`Total Servers: ${summary.totalServers}`);
  console.log(`Enabled Servers: ${summary.enabledServers}`);
  console.log(`Healthy: ${summary.healthyServers} | Degraded: ${summary.degradedServers} | Down: ${summary.downServers}`);
  
  if (summary.criticalDown > 0) {
    console.log(`🚨 CRITICAL SERVERS DOWN: ${summary.criticalDown}`);
  }
  
  console.log("\n" + "-".repeat(80));
  console.log("SERVER STATUS TABLE");
  console.log("-".repeat(80));
  console.log("Server Name".padEnd(20) + "Status".padEnd(12) + "Response Time".padEnd(15) + "Critical".padEnd(10) + "Error");
  console.log("-".repeat(80));
  
  summary.results.forEach(result => {
    const statusIcon = result.status === "OK" ? "✅" : 
                      result.status === "DEGRADED" ? "⚠️" : 
                      result.status === "DOWN" ? "❌" : "❓";
    
    const statusText = `${statusIcon} ${result.status}`;
    const responseTime = result.responseTime ? `${result.responseTime}ms` : "N/A";
    const critical = result.critical ? "YES" : "NO";
    const error = result.error || "";
    
    console.log(
      result.name.padEnd(20) + 
      statusText.padEnd(12) + 
      responseTime.padEnd(15) + 
      critical.padEnd(10) + 
      error
    );
  });
  
  console.log("-".repeat(80));
}

async function main() {
  const isCI = process.argv.includes('--ci');
  const config = loadConfig();
  const files = await globby("servers/*.yaml");
  
  const results: ServerHealthResult[] = [];
  
  for (const file of files) {
    const y = YAML.parse(readFileSync(file, "utf8"));
    
    // Check if server is enabled via feature flag or server config
    const featureEnabled = config.features?.[y.name]?.enabled || false;
    const serverEnabled = y.enabled || false;
    
    if (!featureEnabled && !serverEnabled) {
      results.push({
        name: y.name,
        status: "UNKNOWN",
        lastChecked: new Date(),
        enabled: false,
        critical: CRITICAL_SERVERS.includes(y.name),
      });
      continue;
    }
    
    const result = await checkServerHealth(y.name, y);
    results.push(result);
    
    if (!isCI) {
      console.log(`${result.name}: ${result.status}${result.responseTime ? ` (${result.responseTime}ms)` : ''}`);
    }
  }
  
  const summary = generateHealthSummary(results);
  
  if (!isCI) {
    printHealthTable(summary);
  }
  
  // In CI mode, output JSON for programmatic consumption
  if (isCI) {
    console.log(JSON.stringify(summary, null, 2));
  }
  
  // Exit with appropriate code
  if (summary.overallStatus === "CRITICAL") {
    console.error("❌ Critical servers are down - system is not operational");
    process.exit(2);
  } else if (summary.overallStatus === "DEGRADED") {
    console.warn("⚠️ Some servers are degraded - system may have reduced functionality");
    process.exit(1);
  } else {
    console.log("✅ All enabled servers are healthy");
    process.exit(0);
  }
}

main().catch(e => {
  console.error("❌ Health probe failed", e);
  process.exit(1);
});