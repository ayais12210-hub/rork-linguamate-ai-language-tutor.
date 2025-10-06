#!/usr/bin/env node
/**
 * Debug script for AI PR Reviewer
 * Tests the AI reviewer locally without requiring a GitHub PR context
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

// Mock GitHub environment for local testing
const mockEvent = {
  pull_request: {
    number: 123,
    title: "Test PR for AI Review",
    body: "This is a test PR to verify the AI reviewer works correctly.",
    user: { login: "test-user" },
    base: { ref: "main", sha: "abc123" },
    head: { ref: "feature/test", sha: "def456" },
    html_url: "https://github.com/test/repo/pull/123"
  }
};

// Set up mock environment
process.env.GITHUB_REPOSITORY = "test/repo";
process.env.GITHUB_EVENT_PATH = "/tmp/mock-event.json";
process.env.GITHUB_TOKEN = "mock-token";

// Write mock event file
import { writeFileSync } from "node:fs";
writeFileSync("/tmp/mock-event.json", JSON.stringify(mockEvent));

console.log("🧪 AI Reviewer Debug Script");
console.log("==========================");

// Check if we have any API keys
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
const hasGemini = !!process.env.GEMINI_API_KEY;

console.log("API Keys available:");
console.log(`  OpenAI: ${hasOpenAI ? "✅" : "❌"}`);
console.log(`  Anthropic: ${hasAnthropic ? "✅" : "❌"}`);
console.log(`  DeepSeek: ${hasDeepSeek ? "✅" : "❌"}`);
console.log(`  Gemini: ${hasGemini ? "✅" : "❌"}`);

if (!hasOpenAI && !hasAnthropic && !hasDeepSeek && !hasGemini) {
  console.log("\n❌ No API keys found. Set one of:");
  console.log("  export OPENAI_API_KEY=sk-...");
  console.log("  export ANTHROPIC_API_KEY=sk-ant-...");
  console.log("  export DEEPSEEK_API_KEY=sk-...");
  console.log("  export GEMINI_API_KEY=...");
  process.exit(1);
}

// Test git setup
console.log("\n🔍 Testing git setup...");
try {
  const gitVersion = execSync("git --version", { encoding: "utf8" }).trim();
  console.log(`✅ Git: ${gitVersion}`);
  
  const gitStatus = execSync("git status --porcelain", { encoding: "utf8" }).trim();
  if (gitStatus) {
    console.log("📝 Uncommitted changes detected:");
    console.log(gitStatus);
  } else {
    console.log("✅ Working directory clean");
  }
} catch (error) {
  console.error("❌ Git error:", error.message);
}

// Test the AI reviewer script
console.log("\n🤖 Testing AI reviewer script...");
try {
  execSync("node .github/ai-reviewer/review.mjs", { 
    stdio: "inherit",
    env: { ...process.env }
  });
  console.log("✅ AI reviewer completed successfully!");
} catch (error) {
  console.error("❌ AI reviewer failed:", error.message);
  process.exit(1);
}

// Cleanup
try {
  execSync("rm -f /tmp/mock-event.json");
} catch {}

console.log("\n🎉 Debug test completed!");