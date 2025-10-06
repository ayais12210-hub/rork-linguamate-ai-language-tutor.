# Quick Start: Cursor Multi-Agent Workforce

## 🚀 One-Line Commands

### Manager (Plan & Spawn Tasks)
```
Load .cursorrules. Act as Manager. Read /agents/tasks.yaml. Create plan and spawn 3 subtasks as PRs.
```

### Engineer (Implement Features)
```
Act as Engineer. Implement translator-stt feature. Validate: npm run lint && npm run typecheck && npm run test
```

### Tester (Write Tests)
```
Act as Tester. Add RTL tests for translator-stt with 85%+ coverage. Use MSW for API mocks.
```

### Docs (Update Documentation)
```
Act as Docs. Update README with Voice Input section, env toggles, and usage examples.
```

### Security (Security Review)
```
Act as Security. Scan translator-stt for vulnerabilities. Add zod validation where missing.
```

## 📋 Before You Start

1. **Review tasks**: Check `agents/tasks.yaml` for available work
2. **Create issues**: Use `.github/ISSUE_TEMPLATE/ai_task.yml` template
3. **Read rules**: Skim `.cursorrules` for guardrails

## ✅ Quality Gates (Must Pass)

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run test          # Jest with coverage
```

## 🔧 New Features

### Speech-to-Text (STT)
```tsx
import { useMicInput } from '@/hooks/useMicInput';
import { MicButton } from '@/components/MicButton';

function MyComponent() {
  const handleText = (text: string) => console.log(text);
  
  return <MicButton onInsert={handleText} />;
}
```

**Providers:**
- Web: Web Speech API (automatic)
- Mobile: Server `/api/stt` (mock-first)

## 📁 Key Files

| File | Purpose |
|------|---------|
| `agents/tasks.yaml` | Task definitions |
| `.cursorrules` | Agent rules & guardrails |
| `agents/templates/PR_TEMPLATE_AGENT.md` | PR format |
| `lib/stt/` | STT provider implementations |
| `hooks/useMicInput.ts` | Mic input hook |

## 🏷️ Labels

- `ai:planned` - Agent asks before big changes
- `ai:autonomous` - Agent proceeds freely
- `allow:native` - Native modules permitted

## 📊 Task Categories

1. **features** - New functionality (e.g., `translator-stt`)
2. **bugs** - Bug fixes (e.g., `view-textnode`)
3. **maintenance** - Refactoring, deps
4. **docs** - Documentation
5. **security** - Hardening, validation

## 🌿 Branch Naming

Format: `ai/<role>/<slug>`

Examples:
- `ai/engineer/translator-stt`
- `ai/tester/mic-input-tests`
- `ai/docs/voice-readme`

## 💡 Tips

1. Keep PRs **under 300 LOC**
2. Use **MSW** for API mocking in tests
3. Target **85%+ coverage** on new code
4. Follow **Conventional Commits** format
5. Add **accessibility labels** to touchables

## 🆘 Troubleshooting

**Tests fail?**
```bash
npm run test -- --no-coverage  # Faster feedback
```

**Lint errors?**
```bash
npm run lint -- --fix          # Auto-fix
```

**Type errors?**
```bash
npm run typecheck              # Check types
```

## 📚 Full Documentation

- Complete guide: `agents/README.md`
- Setup summary: `CURSOR_MULTI_AGENT_SETUP_COMPLETE.md`
- Cursor rules: `.cursorrules`
