#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const serversDir = path.join("servers");
const readme = path.join("README.md");
const files = fs.readdirSync(serversDir).filter(f => f.endsWith(".yaml") && !f.startsWith("_"));

type Row = { name:string; pkg:string; envKeys:number; probe:string; enabled:boolean; };
const rows: Row[] = [];

for (const f of files) {
  const y = YAML.parse(fs.readFileSync(path.join(serversDir,f),"utf8"));
  if (!y?.name) continue;
  const pkg = (Array.isArray(y.args) && y.args.length > 0) ? y.args[0] : (y.command || "npx");
  const envKeys = y.env ? Object.keys(y.env).length : 0;
  const probe = y.probe?.type || y.healthCheck?.type || "stdio";
  rows.push({ name: y.name, pkg, envKeys, probe, enabled: Boolean(y.enabled) });
}

rows.sort((a,b) => a.name.localeCompare(b.name));

const table = [
  "| Server | Package/Bin | Env Keys | Probe | Default Enabled |",
  "|---|---|---:|---|---|",
  ...rows.map(r => `| \`${r.name}\` | \`${r.pkg}\` | ${r.envKeys} | ${r.probe} | ${r.enabled ? "✅" : "❌"} |`)
].join("\n");

const md = fs.readFileSync(readme, "utf8");
const start = "<!-- BEGIN:REGISTRY-TABLE -->";
const end = "<!-- END:REGISTRY-TABLE -->";
const a = md.indexOf(start);
const b = md.indexOf(end);
if (a === -1 || b === -1 || b < a) {
  console.error("README markers not found. Please keep BEGIN/END markers.");
  process.exit(1);
}
const out = md.slice(0, a + start.length) + "\n" + table + "\n" + md.slice(b);
fs.writeFileSync(readme, out);
console.log("README registry table updated.");