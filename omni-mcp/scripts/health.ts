#!/usr/bin/env tsx

import { loadConfig } from '../apps/orchestrator/src/config/schema.js';
import { ServerRegistry } from '../apps/orchestrator/src/registry.js';
import { HealthChecker } from '../apps/orchestrator/src/health.js';
import { hasRequiredEnvs } from '../apps/orchestrator/src/config/schema.js';

async function main() {
  const isCI = process.argv.includes('--ci');
  const config = loadConfig();
  const registry = new ServerRegistry(config);
  const healthChecker = new HealthChecker();
  
  const enabledServers = registry.getEnabledServers();
  
  console.log(`Checking health of ${enabledServers.length} enabled servers...`);
  
  let allHealthy = true;
  const results: Array<{ name: string; healthy: boolean; error?: string; responseTime?: number }> = [];
  
  for (const [name, serverConfig] of enabledServers) {
    // Check if required environment variables are present
    if (!hasRequiredEnvs(serverConfig.env)) {
      console.log(`❌ ${name}: Missing required environment variables`);
      results.push({ name, healthy: false, error: 'Missing required environment variables' });
      allHealthy = false;
      continue;
    }
    
    try {
      const healthStatus = await healthChecker.checkServerHealth(name, serverConfig);
      const status = healthStatus.healthy ? '✅' : '❌';
      const responseTime = healthStatus.responseTime ? ` (${healthStatus.responseTime}ms)` : '';
      
      console.log(`${status} ${name}: ${healthStatus.healthy ? 'healthy' : 'unhealthy'}${responseTime}`);
      
      if (healthStatus.error) {
        console.log(`   Error: ${healthStatus.error}`);
      }
      
      results.push({
        name,
        healthy: healthStatus.healthy,
        error: healthStatus.error || undefined,
        responseTime: healthStatus.responseTime || undefined,
      });
      
      if (!healthStatus.healthy) {
        allHealthy = false;
      }
    } catch (error) {
      console.log(`❌ ${name}: Error checking health - ${error}`);
      results.push({ name, healthy: false, error: String(error) });
      allHealthy = false;
    }
  }
  
  console.log('\n--- Summary ---');
  const healthyCount = results.filter(r => r.healthy).length;
  const totalCount = results.length;
  
  console.log(`Healthy: ${healthyCount}/${totalCount}`);
  
  if (!allHealthy) {
    console.log('\nUnhealthy servers:');
    results.filter(r => !r.healthy).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`);
    });
  }
  
  if (isCI && !allHealthy) {
    console.log('\n❌ Health check failed in CI mode');
    process.exit(1);
  } else if (allHealthy) {
    console.log('\n✅ All enabled servers are healthy');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some servers are unhealthy');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Health check failed:', error);
  process.exit(1);
});