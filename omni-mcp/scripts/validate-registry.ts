#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { PRDSchema } from "../apps/orchestrator/src/config/prd.schema.js";

const manifestPath = path.join("servers","servers.manifest.json");
const serversDir = path.join("servers");

function fail(msg: string) { console.error(msg); process.exit(1); }

if (!fs.existsSync(manifestPath)) fail("Missing servers/servers.manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath,"utf8"));
if (!Array.isArray(manifest.servers)) fail("manifest.servers must be an array");

const yamlFiles = fs.readdirSync(serversDir).filter(f => f.endsWith(".yaml") && f !== "_TEMPLATE.yaml");

const prdLike:any = {
  runtime: { maxConcurrency: 4, defaultTimeoutMs: 15000, retry: { attempts: 3, backoffMs: 500 } },
  network: { outboundAllowlist: [] },
  observability: { otelEnabled: false, sampling: 1.0 },
  security: { auditLog: true, redactSecrets: true },
  features: {},
  servers: {}
};

const namesFromYaml = new Set<string>();

for (const f of yamlFiles) {
  const y = YAML.parse(fs.readFileSync(path.join(serversDir,f),"utf8")) || {};
  if (!y.name) continue;
  namesFromYaml.add(y.name);
  prdLike.features[y.name] = { enabled: Boolean(y.enabled) };
  prdLike.servers[y.name] = {
    name: y.name,
    command: y.command || "npx",
    args: Array.isArray(y.args) ? y.args : [],
    env: y.env || {},
    scopes: y.scopes || [],
    probe: y.probe || y.healthCheck || { type: "stdio", timeoutMs: 10000 },
    limits: y.limits || {},
    retry: y.retry || {},
    timeouts: y.timeouts || {},
    notes: y.notes
  };
}

const parsed = PRDSchema.safeParse(prdLike);
if (!parsed.success) {
  console.error(parsed.error.format());
  fail("PRD validation failed for current YAMLs.");
}

// cross-check manifest vs yaml
const manifestNames = new Set<string>(manifest.servers.map((s:any) => s.name));
const missingYamls = [...manifestNames].filter(n => !namesFromYaml.has(n));
const extraYamls = [...namesFromYaml].filter(n => !manifestNames.has(n));

if (missingYamls.length) fail("YAML missing for manifest servers: " + missingYamls.join(", "));
if (extraYamls.length) console.warn("Note: YAMLs exist not in manifest: " + extraYamls.join(", "));

console.log("Registry validation OK.");