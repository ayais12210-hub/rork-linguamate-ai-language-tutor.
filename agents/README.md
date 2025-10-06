# Cursor Multi-Agent Workforce

This directory contains the configuration and prompts for the Cursor AI multi-agent workforce system tailored for Expo RN + TypeScript + tRPC + Hono stack.

## Structure

- **`tasks.yaml`**: Task definitions for features, bugs, maintenance, docs, and security
- **`prompts/`**: Role-specific prompts for Manager, Engineer, Tester, Docs, and Security agents
- **`templates/`**: PR template for agent-generated pull requests
- **`outbox/`**: Generated plans and work artifacts (git-ignored)

## Quick Start

### 1. Load the Rules

In Cursor, run:
```
Load .cursorrules. Act as Manager. Read /agents/tasks.yaml.
```

### 2. Create an AI Task

Use the GitHub issue template `.github/ISSUE_TEMPLATE/ai_task.yml` to create a new task, or reference existing tasks from `tasks.yaml`.

### 3. Execute Tasks

**Example: Start STT Implementation**
```
Act as Manager. Implement translator-stt feature from tasks.yaml. 
Create branch ai/engineer/stt-integration. Open PR using template.
```

**Example: Add Tests**
```
Act as Tester. Add tests for useMicInput hook with 85%+ coverage. 
Use MSW mocks for /api/stt endpoint.
```

## Roles

### Manager
- Ingests tasks from `tasks.yaml` and GitHub issues
- Creates execution plans in `agents/outbox/`
- Spawns subtasks across Engineer, Tester, Docs, Security roles
- Opens PRs using the agent template

### Engineer
- Implements minimal viable changes
- Ensures typed boundaries and error handling
- No native modules without `allow:native` label
- Runs lint/typecheck/test before PR

### Tester
- Uses Jest + @testing-library/react-native
- MSW for network mocking
- Target: 85%+ diff coverage on changed lines
- Reports coverage in PR body

### Docs
- Updates README/docs with usage examples
- Documents env variables and configuration
- Keeps CHANGELOG in sync

### Security
- Scans diffs for XSS, eval, unsafe storage
- Adds zod validation where missing
- Provides security checklist in PR

## Task Definition Format

```yaml
features:
  - id: feature-id
    title: "Feature Title"
    acceptance:
      - Criteria 1
      - Criteria 2
    tests:
      - Test requirement 1
    docs:
      - Documentation requirement

bugs:
  - id: bug-id
    title: "Bug Title"
    repro: "Reproduction steps"
    tests:
      - Regression test requirements
```

## Validation

All PRs must pass:
```bash
npm run lint
npm run typecheck
npm run test -- --coverage
```

## Configuration

Autonomy levels (set via GitHub labels):
- **`ai:planned`**: Agent asks before refactors >200 LOC
- **`ai:autonomous`**: Agent proceeds within guardrails

Default concurrency: 3 parallel tasks

## CI/CD

The `.github/workflows/app-ci.yml` workflow runs on all PRs:
- Type checking
- Linting
- Tests with coverage

## Speech-to-Text (STT) Implementation

The multi-agent workforce has scaffolded a complete STT system:

### Components Created

1. **Provider Abstraction** (`lib/stt/`)
   - `provider.ts`: Interface definition
   - `webSpeech.ts`: Web Speech API implementation
   - `serverFallback.ts`: Server-side STT fallback
   - `index.ts`: Provider selection logic

2. **React Hook** (`hooks/useMicInput.ts`)
   - State machine: idle → recording → processing
   - Provider lifecycle management
   - Partial and final text callbacks

3. **UI Component** (`components/MicButton.tsx`)
   - Accessible button with proper ARIA labels
   - Visual recording states
   - Activity indicator for processing

4. **Backend Route** (`backend/routes/stt.ts`)
   - Simple `/stt` endpoint for mobile fallback
   - Mock-first approach (set `STT_MOCK_ENABLED=false` to enable real providers)
   - Rate limiting and error handling

5. **Tests** (`__tests__/useMicInput.test.ts`)
   - Hook state machine tests
   - Mocked provider for deterministic testing

6. **MSW Mocks** (`tests/msw/handlers.ts`)
   - `/api/stt` endpoint mock
   - Returns predictable mock response

### Usage

```tsx
import { MicButton } from '@/components/MicButton';

function TranslatorScreen() {
  const [text, setText] = useState('');
  
  return (
    <MicButton onInsert={(voiceText) => setText(text + ' ' + voiceText)} />
  );
}
```

### Environment Variables

- `STT_MOCK_ENABLED`: Set to `false` to use real STT providers (default: `true`)
- `EXPO_PUBLIC_TOOLKIT_URL`: Base URL for STT service
- `TOOLKIT_API_KEY`: API key for STT service

## E2E Testing

Maestro flows in `.maestro/flows/`:
- `translator.yml`: Basic happy path test

Run with: `npm run e2e`

## Known Limitations

1. **Test Setup**: The test infrastructure requires full polyfills for MSW v2. Current setup includes:
   - web-streams-polyfill
   - whatwg-fetch  
   - TextEncoder/TextDecoder
   
   Some tests may need additional configuration based on your environment.

2. **Native Modules**: The STT implementation deliberately avoids native modules to maintain Expo Go compatibility.

3. **Jest Config**: Uses `ts-jest` preset. Consider migrating to `jest-expo` for better React Native support.

## Contributing

When acting as an agent:

1. **Check guardrails** in `.cursorrules`
2. **Run validation** commands locally
3. **Use PR template** from `templates/PR_TEMPLATE_AGENT.md`
4. **Update this README** if you change agent workflows

## Support

For questions about the multi-agent system:
- Review `.cursorrules` for global principles
- Check `prompts/<role>.md` for role-specific guidance
- Reference `tasks.yaml` for acceptance criteria
