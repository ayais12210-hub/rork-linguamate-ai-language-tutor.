# AI Reviewer Notes

- Target stack: Expo 53+, React Native, TypeScript strict, React Hook Form/Zod, Jest+RTL, Playwright.
- Priorities:
  1. **Runtime safety**: hook rules, component purity, memo boundaries, navigation & params.
  2. **Type soundness**: generics, discriminated unions, `never` exhaustiveness.
  3. **RN performance**: `useCallback`, `useMemo`, `React.memo`, FlatList keys, re-render hot spots.
  4. **Styling**: Tailwind class drift, duplicated styles, inaccessible contrast.
  5. **I/O**: networking, Zod schemas, graceful error states, offline safety.
  6. **Tests**: add RTL tests for crash-prone files; e2e smoke for onboarding, translator, STT/TTs flows.
  7. **Security**: secrets, URL allowlists, dependency risks.

## Setup

In your repo: Settings → Secrets and variables → Actions → New repository secret

Add one of:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `GEMINI_API_KEY`

No extra packages required.

## Configuration

The workflow can be configured via environment variables in `.github/workflows/ai-pr-reviewer.yml`:

- `AI_MODEL`: The model to use (e.g., `gpt-4o-mini`, `claude-3-5-sonnet`, `deepseek-chat`, `gemini-1.5-pro`)
- `MAX_TOKENS`: Maximum tokens for the AI response (default: `8000`)
- `DIFF_LIMIT_KB`: Maximum size of diff chunks in KB (default: `900`)
- `REVIEW_TONE`: The tone for the review (default: `precise, implementation-first, UK English`)
- `PROJECT_CONTEXT_PATHS`: Newline-separated list of files/directories to include as context

## What You'll See

On every PR (not draft), the workflow runs, chunks the diff, sends to your chosen model, and posts a single, structured review comment with:

1. Executive summary
2. Must-fix issues (with mini patch diffs)
3. Nice-to-have clean-ups
4. Concrete tests to add
5. CI/tooling suggestions

## Adding More Review Agents

If you want multiple perspectives, duplicate the job under different names with different models (e.g., one OpenAI, one Anthropic), or add third-party apps:

- SonarCloud (quality/security)
- CodeQL (security)
- DeepSource (bugs & style)
- Reviewpad (policy automation)
- Danger JS (custom PR rules)
- Codecov (coverage gates)

These will appear alongside the AI reviewer under Checks/Reviews.
