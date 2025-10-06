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

if (!GITHUB_REPOSITORY || !GITHUB_EVENT_PATH || !GITHUB_TOKEN) {
  console.error("Missing required GitHub env (GITHUB_REPOSITORY/GITHUB_EVENT_PATH/GITHUB_TOKEN).");
  process.exit(1);
}

// Pick provider in priority order by available key
let provider = null;
if (OPENAI_API_KEY) provider = "openai";
else if (ANTHROPIC_API_KEY) provider = "anthropic";
else if (DEEPSEEK_API_KEY) provider = "deepseek";
else if (GEMINI_API_KEY) provider = "gemini";
if (!provider) {
  console.error("No AI provider key found. Add one secret: OPENAI_API_KEY or ANTHROPIC_API_KEY or DEEPSEEK_API_KEY or GEMINI_API_KEY.");
  process.exit(1);
}

// ---------- Load PR event ----------
const event = JSON.parse(readFileSync(GITHUB_EVENT_PATH, "utf8"));
const pr = event.pull_request;
const repo = GITHUB_REPOSITORY;
const [owner, repoName] = repo.split("/");
const prNumber = pr.number;
const baseRef = pr.base.ref;
const headRef = pr.head.ref;

const run = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

// Fetch complete history (already fetch-depth:0 in workflow, but safe)
try { run("git fetch --all --prune"); } catch {}

// Get unified diff for this PR
const baseSha = run(`git rev-parse origin/${baseRef}`);
const headSha = run(`git rev-parse HEAD`);
let diff = "";
try {
  diff = run(`git diff --unified=1 ${baseSha}...${headSha}`);
} catch (e) {
  // fallback: from the PR base SHA in the event
  const fallbackBase = pr.base.sha;
  diff = run(`git diff --unified=1 ${fallbackBase}...${headSha}`);
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
      throw new Error(`[OpenAI] API error: HTTP ${res.status} ${res.statusText} - ${JSON.stringify(j)}`);
    }
    return j.choices?.[0]?.message?.content || "";
  } catch (err) {
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
for (let i = 0; i < prompts.length; i++) {
  const piece = await callModel(prompts[i]);
  combined += `\n\n### Chunk ${i+1} Review\n${piece}\n`;
}

// ---------- Post PR comment ----------
const postBody = `
## 🤖 AI Code Review (${provider}, model: ${AI_MODEL})
${combined}
`;

const apiBase = "https://api.github.com";
const res = await fetch(`${apiBase}/repos/${owner}/${repoName}/issues/${prNumber}/comments`, {
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
  console.error("Failed to post PR comment:", res.status, txt);
  process.exit(1);
}
console.log("AI review posted.");
