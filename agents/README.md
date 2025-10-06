# Cursor Multi-Agent Workforce

This directory contains configuration and templates for the Cursor AI multi-agent workforce, tailored for Expo React Native + TypeScript + tRPC + Hono stack.

## Structure

```
agents/
├── tasks.yaml              # Task definitions (features, bugs, maintenance, docs, security)
├── prompts/                # Role-specific prompt files
│   ├── manager.md
│   ├── engineer.md
│   ├── tester.md
│   ├── docs.md
│   └── security.md
├── templates/              # PR and documentation templates
│   └── PR_TEMPLATE_AGENT.md
├── outbox/                 # Generated plans (created automatically)
└── README.md              # This file
```

## Quick Start

### 1. Create an AI Task

Use the GitHub issue template at `.github/ISSUE_TEMPLATE/ai_task.yml`:
- Go to Issues → New Issue → "AI Task"
- Fill in title, context, and acceptance criteria
- Choose autonomy level (`ai:planned` or `ai:autonomous`)

### 2. Run the Manager Agent

In Cursor, paste this prompt:

```
Load .cursorrules. Act as Manager. Read /agents/tasks.yaml. 
Create plan and spawn first 3 subtasks as PRs ≤300 LOC.
Use /agents/templates/PR_TEMPLATE_AGENT.md for PRs.
```

### 3. Execute Specific Roles

**Engineer:**
```
Act as Engineer. Implement translator-stt feature with hooks/components and types.
Validate: npm run lint && npm run typecheck && npm run test
```

**Tester:**
```
Act as Tester. Add RTL tests for translator-stt with MSW mocks. 
Target 85%+ diff coverage.
```

**Docs:**
```
Act as Docs. Update README with Voice Input usage and env toggles.
```

**Security:**
```
Act as Security. Scan translator-stt for XSS/validation issues.
Add zod schemas where missing.
```

## Task Management

Tasks are defined in `tasks.yaml` with categories:
- **features**: New functionality
- **bugs**: Bug fixes
- **maintenance**: Refactoring, dependencies
- **docs**: Documentation updates
- **security**: Security hardening

## Autonomy Levels

- **ai:planned** (default): Agent asks before refactors >200 LOC
- **ai:autonomous**: Agent proceeds within scope + guardrails

## Quality Gates

All PRs must pass:
```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript strict
npm run test          # Jest with 85%+ coverage
```

## Mobile-Specific Guardrails

1. **No Native Modules**: No `expo prebuild` without `allow:native` label
2. **ESLint rule**: `react-native/no-raw-text` enforced (no stray text in `<View>`)
3. **Accessibility**: All custom touchables need `accessibilityRole`/`Label`
4. **Testing**: Use `@testing-library/react-native` + MSW for network

## STT Implementation

The Speech-to-Text feature follows a **mobile-first, non-native** approach:

- **Web**: Web Speech API (if available)
- **Mobile**: Server fallback via `/api/stt` (mock-first, can be upgraded)
- **Provider abstraction**: `lib/stt/` with pluggable implementations

See `hooks/useMicInput.ts` and `components/MicButton.tsx` for usage.

## CI/CD

GitHub Actions workflow at `.github/workflows/app-ci.yml` runs on PRs:
- Type checking
- Linting
- Tests with coverage

## Branch Naming

Format: `ai/<role>/<kebab-slug>`

Examples:
- `ai/engineer/translator-stt`
- `ai/tester/lang-search-tests`
- `ai/docs/voice-input-readme`

## Commit Convention

Use Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests only
- `refactor:` Code restructuring
- `chore:` Maintenance
- `perf:` Performance improvement

## Support

- Review `.cursorrules` for complete workflow
- Check `tasks.yaml` for active work items
- See `templates/PR_TEMPLATE_AGENT.md` for PR format
