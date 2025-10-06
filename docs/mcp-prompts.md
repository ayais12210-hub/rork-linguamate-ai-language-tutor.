# MCP Prompt Pack — Linguamate

Pre-tested prompts for common agent-driven tasks in the Linguamate repository. Use these with Cursor + MCP to streamline development workflows.

---

## 🔧 CI & Quality

### Fix failing CI workflow
```
Read the latest GitHub Actions logs for the main branch. Identify any failing steps in the CI workflow. Propose a minimal patch to fix the issue, create a new branch named `ci/fix-<descriptive-slug>`, and open a PR with:
- Summary of the failure
- Root cause analysis
- The fix applied
- Link to the failing workflow run
```

### Add missing tests for untested modules
```
Scan the `lib/` directory and identify modules with <50% test coverage. For the top 3 modules by LOC:
1. Create corresponding test files in `tests/lib/`
2. Cover: happy path, error cases, edge cases
3. Use Jest + MSW for any network calls
4. Ensure tests follow the patterns in existing test files
5. Open a PR titled "test: improve coverage for lib modules"
```

### Lint & format entire codebase
```
Run `npm run lint` and capture all errors. For each auto-fixable error, apply the fix. For any remaining errors, propose a fix and create a PR with the changes. Title: "chore: fix linting errors across codebase"
```

---

## 📦 Component Development

### Generate component with tests
```
Create a new React Native component `components/GrammarQuiz.tsx` with:
- TypeScript props interface
- Accessible touchables (accessibilityRole/Label)
- Error boundary integration
- Corresponding test file `__tests__/GrammarQuiz.test.tsx` with:
  - Render test
  - Props variation tests
  - Interaction tests
  - Accessibility tests
- Export from `components/index.ts`

Follow existing component patterns in the codebase.
```

### Refactor component for accessibility
```
Analyze `components/PhonicsTrainer.tsx` for accessibility issues:
- Missing accessibilityRole/Label/Hint
- Color contrast violations
- Touch target size (<44x44)
- Screen reader support

Apply fixes and add/update tests in `__tests__/PhonicsTrainer.test.tsx` to verify a11y compliance. Open a PR titled "a11y: improve PhonicsTrainer accessibility"
```

---

## 🗄️ Backend & API

### Add new tRPC endpoint with validation
```
Create a new tRPC procedure in `backend/routers/` for fetching user lesson progress:
- Input: userId (string), dateRange (optional)
- Validation: use zod schema in `schemas/`
- Output: typed response with lesson stats
- Error handling: use AppError patterns from `lib/errors`
- Unit tests in `__tests__/api.lesson-progress.test.ts`
- Update API documentation in `docs/ARCHITECTURE.md`
```

### Add database migration (read-only query optimization)
```
Using the Postgres MCP server (read-only):
1. Identify slow queries in the lessons table (>100ms p95)
2. Propose indexes to optimize them
3. Create migration file in `backend/migrations/`
4. Add rollback script
5. Document the change in a PR with before/after query plans
```

---

## 🧪 Testing

### Generate integration test for translator flow
```
Create an integration test in `__tests__/translator.integration.test.tsx` that:
1. Renders the translator screen
2. Simulates text input in Punjabi
3. Mocks STT/TTS API responses using MSW
4. Verifies translated output is displayed
5. Tests error states (network failure, API error)
6. Ensures at least 85% diff coverage on changed code

Follow patterns from existing integration tests.
```

### Add E2E test for onboarding
```
Create a Playwright E2E test in `tests/e2e/onboarding.spec.ts`:
1. Navigate to app root
2. Complete language selection
3. Complete proficiency level selection
4. Verify navigation to home screen
5. Check that preferences are persisted
6. Test back navigation and state preservation

Use existing Playwright config and helpers.
```

---

## 📚 Documentation

### Update architecture docs after refactor
```
I just refactored the `lib/speech/` module. Update `docs/ARCHITECTURE.md` to reflect:
- New `useSpeech()` hook API
- Changed file structure
- Updated data flow diagrams (if applicable)
- Migration guide for existing code

Keep the tone consistent with existing docs.
```

### Generate API reference for new schemas
```
Scan `schemas/` for any new zod schemas added in the last commit. For each:
1. Generate markdown API reference in `docs/SCHEMA_CONTRACTS.md`
2. Include: schema name, fields, types, validation rules, usage examples
3. Cross-reference related schemas
4. Add to the schema index
```

---

## 🐛 Bug Triage & Fixes

### Create issue from Sentry crash (requires Sentry MCP)
```
Using Sentry MCP, fetch the top 5 crashes (Android, last 7 days). For each:
1. Create a GitHub issue with:
   - Stack trace
   - Reproduction steps (if inferrable)
   - Affected module/component
   - Labels: `bug`, `mobile`, `priority:high`
2. Link related issues if duplicates exist
```

### Fix bug with test coverage
```
There's a reported bug: "Translator crashes when input exceeds 500 characters". 
1. Reproduce the issue in `__tests__/translator.unit.test.tsx`
2. Identify the root cause in `app/(tabs)/translator.tsx`
3. Apply a fix with proper input validation
4. Ensure tests cover the edge case
5. Open a PR titled "fix: prevent translator crash on long input"
```

---

## 🚀 Deployment & Release

### Prepare release notes from commits
```
Generate release notes for version 1.2.0 by:
1. Reading all commits since the last tag (v1.1.0)
2. Grouping by type: features, fixes, docs, chores
3. Formatting in the style of `RELEASE_NOTES.md`
4. Highlighting breaking changes
5. Adding upgrade instructions if needed

Save to `RELEASE_NOTES.md` and open a PR.
```

### Verify EAS build status (requires EAS MCP)
```
Using EAS MCP:
1. Check the status of the latest Android and iOS builds
2. If either failed, fetch the build logs
3. Identify the failure reason
4. Propose a fix (dependency issue, config error, etc.)
5. Open a PR or GitHub issue depending on complexity
```

---

## 🔒 Security

### Scan for secrets and sensitive data
```
Scan the entire codebase for:
- Hardcoded API keys, tokens, passwords
- Exposed environment variables in client code
- Unsafe use of `eval`, `dangerouslySetInnerHTML`
- Missing input sanitization in forms

For each finding:
1. Assess severity (critical, high, medium, low)
2. Propose a fix (move to .env, add zod validation, etc.)
3. Create an issue labeled `security` with remediation steps
```

### Add zod validation to existing endpoint
```
The endpoint `backend/routers/translator.ts` currently lacks strict input validation. 
1. Create a zod schema in `schemas/translator.ts` for the input
2. Apply the schema to the tRPC procedure
3. Add test cases for invalid inputs
4. Update API docs
5. Open a PR titled "security: add input validation to translator endpoint"
```

---

## 📊 Analytics & Observability

### Query lesson completion rates (requires Postgres MCP)
```
Using Postgres MCP (read-only):
1. Query lesson completion rates for the last 30 days
2. Group by language pair (e.g., English → Punjabi)
3. Identify lessons with <50% completion
4. Generate a report in `reports/lesson-engagement-YYYY-MM-DD.md`
5. Propose improvements (difficulty adjustment, content updates)
```

### Inspect rate-limit buckets (requires Redis MCP)
```
Using Redis MCP (read-only):
1. List all keys matching `linguamate:rate:*`
2. Identify any users hitting rate limits frequently
3. Check for anomalous patterns (potential abuse)
4. Generate a summary report
5. Propose rate-limit adjustments if needed
```

---

## 🎨 UI/UX Improvements

### Add loading states to all screens
```
Audit all screens in `app/` for missing loading states. For each:
1. Add a proper loading indicator (ActivityIndicator)
2. Ensure loading doesn't block critical UI
3. Add skeleton loaders for lists/cards if applicable
4. Test loading states in component tests
5. Open a PR titled "ux: add loading states across app screens"
```

### Implement dark mode for new components
```
Review all components added in the last 7 days. For each:
1. Ensure they use theme colors from `constants/Colors.ts`
2. Test in both light and dark modes
3. Fix any hardcoded colors or contrast issues
4. Add dark mode tests
5. Open a PR titled "ui: dark mode support for new components"
```

---

## 🔄 Refactoring

### Extract common hook from duplicated logic
```
I've noticed duplicated state management logic in:
- `app/(tabs)/translator.tsx`
- `app/(tabs)/phonics.tsx`
- `modules/conversation/ConversationScreen.tsx`

Extract this into a shared hook `hooks/useAudioRecording.ts`:
1. Consolidate the logic
2. Preserve existing behavior
3. Update all call sites to use the new hook
4. Add tests for the hook
5. Open a PR titled "refactor: extract useAudioRecording hook"
```

---

## 💡 Tips for Using These Prompts

1. **Be specific**: Modify prompts to reference actual file paths and module names in your repo
2. **Combine with context**: Use `@file`, `@folder`, or `@codebase` in Cursor to provide additional context
3. **Iterate**: If the first attempt isn't perfect, refine the prompt and try again
4. **Review changes**: Always review agent-generated code before merging
5. **Extend the pack**: Add your own prompts as you discover useful patterns

---

## 🤖 Agent Roles (Multi-Agent Workflow)

These prompts align with the roles defined in `/agents/tasks.yaml`:

- **Manager**: CI fixes, issue triage, planning
- **Engineer**: Component creation, refactors, API endpoints
- **Tester**: Test generation, coverage improvements
- **Docs**: Documentation updates, API references
- **Security**: Vulnerability scans, input validation

Use the role-specific prompts to spawn focused subtasks on separate branches.
