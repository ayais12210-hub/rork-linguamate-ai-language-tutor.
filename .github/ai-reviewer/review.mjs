#!/usr/bin/env node
/**
 * AI PR Reviewer for GitHub Actions (no external deps).
 * - Gathers PR metadata + unified diff
 * - Chunks diff for long PRs
 * - Calls one of: OpenAI, Anthropic, DeepSeek, Gemini (based on which API key is present)
 * - Posts a single structured review comment with actionable suggestions
 *
 * Permissions required in workflow: pull-requests: write
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

// ---------- Helpers ----------
const env = process.env;
const {
  GITHUB_REPOSITORY,
  GITHUB_EVENT_PATH,
  GITHUB_TOKEN,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  DEEPSEEK_API_KEY,
  GEMINI_API_KEY,
  AI_MODEL = "gpt-4o-mini",
  MAX_TOKENS = "8000",
  DIFF_LIMIT_KB = "900",
  REVIEW_TONE = "precise, implementation-first, UK English",
  PROJECT_CONTEXT_PATHS = ""
} = env;

// Enhanced error handling and debugging
console.log("🔍 AI Reviewer Debug Info:");
console.log("GITHUB_REPOSITORY:", GITHUB_REPOSITORY || "MISSING");
console.log("GITHUB_EVENT_PATH:", GITHUB_EVENT_PATH || "MISSING");
console.log("GITHUB_TOKEN:", GITHUB_TOKEN ? "PRESENT" : "MISSING");
console.log("Provider keys available:", {
  OPENAI: !!OPENAI_API_KEY,
  ANTHROPIC: !!ANTHROPIC_API_KEY,
  DEEPSEEK: !!DEEPSEEK_API_KEY,
  GEMINI: !!GEMINI_API_KEY
});

if (!GITHUB_REPOSITORY || !GITHUB_EVENT_PATH || !GITHUB_TOKEN) {
  console.error("❌ Missing required GitHub env (GITHUB_REPOSITORY/GITHUB_EVENT_PATH/GITHUB_TOKEN).");
  console.error("Available env vars:", Object.keys(env).filter(k => k.startsWith('GITHUB_')));
  process.exit(1);
}

// Pick provider in priority order by available key
let provider = null;
if (OPENAI_API_KEY) provider = "openai";
else if (ANTHROPIC_API_KEY) provider = "anthropic";
else if (DEEPSEEK_API_KEY) provider = "deepseek";
else if (GEMINI_API_KEY) provider = "gemini";
if (!provider) {
  console.error("❌ No AI provider key found. Add one secret: OPENAI_API_KEY or ANTHROPIC_API_KEY or DEEPSEEK_API_KEY or GEMINI_API_KEY.");
  console.error("No provider API keys found in environment.");
  process.exit(1);
}

console.log(`✅ Using AI provider: ${provider} with model: ${AI_MODEL}`);

// ---------- Load PR event ----------
let event, pr, repo, owner, repoName, prNumber, baseRef, headRef;
try {
  event = JSON.parse(readFileSync(GITHUB_EVENT_PATH, "utf8"));
  pr = event.pull_request;
  repo = GITHUB_REPOSITORY;
  [owner, repoName] = repo.split("/");
  prNumber = pr.number;
  baseRef = pr.base.ref;
  headRef = pr.head.ref;
  
  console.log(`📋 PR #${prNumber}: ${pr.title}`);
  console.log(`🔀 Base: ${baseRef}, Head: ${headRef}`);
  console.log(`👤 Author: ${pr.user?.login}`);
} catch (error) {
  console.error("❌ Failed to parse GitHub event:", error.message);
  process.exit(1);
}

const run = (cmd) => {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (error) {
    console.error(`❌ Command failed: ${cmd}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
};

// Fetch complete history (already fetch-depth:0 in workflow, but safe)
try { 
  console.log("🔄 Fetching git history...");
  run("git fetch --all --prune"); 
} catch (e) {
  console.warn("⚠️ Git fetch failed, continuing...");
}

// Get unified diff for this PR
let diff = "";
try {
  console.log("🔍 Getting git diff...");
  const baseSha = run(`git rev-parse origin/${baseRef}`);
  const headSha = run(`git rev-parse HEAD`);
  console.log(`📊 Base SHA: ${baseSha}, Head SHA: ${headSha}`);
  
  diff = run(`git diff --unified=1 ${baseSha}...${headSha}`);
  console.log(`📝 Diff size: ${Buffer.byteLength(diff, 'utf8')} bytes`);
} catch (e) {
  console.warn("⚠️ Primary diff method failed, trying fallback...");
  try {
    // fallback: from the PR base SHA in the event
    const fallbackBase = pr.base.sha;
    diff = run(`git diff --unified=1 ${fallbackBase}...HEAD`);
    console.log(`📝 Fallback diff size: ${Buffer.byteLength(diff, 'utf8')} bytes`);
  } catch (fallbackError) {
    console.error("❌ Both diff methods failed:", fallbackError.message);
    process.exit(1);
  }
}

// Load optional project context files (small, to give model awareness)
const contextPaths = PROJECT_CONTEXT_PATHS.split("\n").map(s => s.trim()).filter(Boolean);
const contextSnippets = [];
for (const p of contextPaths) {
  try {
    // Limit size to 100 KB per file
    const buf = readFileSync(p, "utf8");
    if (Buffer.byteLength(buf, "utf8") <= 100 * 1024) {
      contextSnippets.push(`--- FILE: ${p}\n${buf}`);
    }
  } catch {}
}

const sysPrompt = `You are an elite code reviewer for a cross-platform React Native + Expo + TypeScript app (Linguamate – AI Language Tutor).
Respond in ${REVIEW_TONE}.
Focus on: correctness, runtime errors, hooks/renders, RN/Expo best practices, TypeScript types, accessibility, performance (re-renders, memoization), testing (Jest/RTL/Playwright), security (unsafe eval, secrets), CI reliability, folder cohesion, and dead code.
For each issue: give a short title, exact file:line if possible, the risk, and a concrete patch (diff fenced).
Prefer minimal, surgical fixes. Avoid bikeshedding.

Return sections:
1) Executive Summary (bullet points)
2) Must-Fix Findings (numbered, with precise patches)
3) Nice-to-Have (optional refactors, DX)
4) Tests To Add (list specific test names and files)
5) CI/Tooling Suggestions (concise)
`;

// Chunk diff
const limit = parseInt(DIFF_LIMIT_KB, 10) * 1024;
function chunkText(t, maxBytes) {
  const chunks = [];
  let cur = [];
  let size = 0;
  const lines = t.split("\n");
  for (const line of lines) {
    const b = Buffer.byteLength(line + "\n", "utf8");
    if (size + b > maxBytes && cur.length) {
      chunks.push(cur.join("\n"));
      cur = [line];
      size = b;
    } else {
      cur.push(line); size += b;
    }
  }
  if (cur.length) chunks.push(cur.join("\n"));
  return chunks;
}
const diffChunks = chunkText(diff, limit);

// ---------- AI call wrappers ----------
async function callOpenAI(prompt) {
  try {
    console.log(`🔗 Calling OpenAI API with model: ${AI_MODEL}`);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        max_tokens: parseInt(MAX_TOKENS, 10),
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: prompt }
        ]
      })
    });
    
    const j = await res.json();
    if (!res.ok) {
      console.error(`❌ OpenAI API error: HTTP ${res.status} ${res.statusText}`);
      console.error(`Response:`, JSON.stringify(j, null, 2));
      throw new Error(`[OpenAI] API error: HTTP ${res.status} ${res.statusText} - ${JSON.stringify(j)}`);
    }
    
    const content = j.choices?.[0]?.message?.content || "";
    console.log(`✅ OpenAI response received (${content.length} chars)`);
    return content;
  } catch (err) {
    console.error(`❌ OpenAI error:`, err.message);
    throw new Error(`[OpenAI] Network or fetch error: ${err && err.message ? err.message : err}`);
  }
}

async function callAnthropic(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: parseInt(MAX_TOKENS, 10),
      system: sysPrompt,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const j = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(j));
  const blocks = j.content || [];
  return blocks.map(b => b.text || "").join("\n");
}

async function callDeepSeek(prompt) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.2,
      max_tokens: parseInt(MAX_TOKENS, 10),
      messages: [
        { role: "system", content: sysPrompt },
        { role: "user", content: prompt }
      ]
    })
  });
  const j = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(j));
  return j.choices?.[0]?.message?.content || "";
}

async function callGemini(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${sysPrompt}\n\n${prompt}` }]}],
      generationConfig: { temperature: 0.2, maxOutputTokens: parseInt(MAX_TOKENS, 10) }
    })
  });
  const j = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(j));
  return j.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";
}

async function callModel(prompt) {
  if (provider === "openai") return callOpenAI(prompt);
  if (provider === "anthropic") return callAnthropic(prompt);
  if (provider === "deepseek") return callDeepSeek(prompt);
  if (provider === "gemini") return callGemini(prompt);
  throw new Error("No provider selected");
}

// ---------- Build prompt ----------
const header = `PR #${prNumber}: ${pr.title}
Author: ${pr.user?.login}
Base: ${baseRef}  Head: ${headRef}
URL: ${pr.html_url}

PR Description:
${(pr.body || "").slice(0, 4000)}

Project Context (selected files):
${contextSnippets.join("\n\n").slice(0, 30000)}
`;

const prompts = diffChunks.map((chunk, i) =>
  `${header}\n\nDIFF CHUNK ${i+1}/${diffChunks.length} (unified diff):\n\n${chunk}`
);

// ---------- Review all chunks ----------
let combined = "";
console.log(`🤖 Starting AI review of ${prompts.length} chunk(s)...`);

for (let i = 0; i < prompts.length; i++) {
  try {
    console.log(`📝 Processing chunk ${i+1}/${prompts.length}...`);
    const piece = await callModel(prompts[i]);
    combined += `\n\n### Chunk ${i+1} Review\n${piece}\n`;
    console.log(`✅ Chunk ${i+1} completed`);
  } catch (error) {
    console.error(`❌ Failed to process chunk ${i+1}:`, error.message);
    combined += `\n\n### Chunk ${i+1} Review\n**Error**: Failed to process this chunk: ${error.message}\n`;
  }
}

// ---------- Post PR comment ----------
const postBody = `
## 🤖 AI Code Review (${provider}, model: ${AI_MODEL})
${combined}
`;

console.log("📤 Posting review comment to PR...");
const apiBase = "https://api.github.com";
const commentUrl = `${apiBase}/repos/${owner}/${repoName}/issues/${prNumber}/comments`;

try {
  const res = await fetch(commentUrl, {
    method: "POST",
    headers: {
      "Authorization": `token ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body: postBody })
  });
  
  if (!res.ok) {
    const txt = await res.text();
    console.error("❌ Failed to post PR comment:");
    console.error(`Status: ${res.status} ${res.statusText}`);
    console.error(`Response: ${txt}`);
    console.error(`URL: ${commentUrl}`);
    process.exit(1);
  }
  
  const responseData = await res.json();
  console.log("✅ AI review posted successfully!");
  console.log(`🔗 Comment URL: ${responseData.html_url}`);
} catch (error) {
  console.error("❌ Network error posting comment:", error.message);
  process.exit(1);
}
