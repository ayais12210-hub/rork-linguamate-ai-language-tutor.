# Quality Assessment - Quick Start

## 🚀 Run Quality Suite

```bash
bun run quality
```

This runs: lint → typecheck → tests → e2e → a11y → security → score

---

## 📊 View Your Score

After running quality suite:

```bash
cat reports/quality-report.md
```

Or open in browser:
```bash
open reports/quality-report.md
```

---

## 🎯 Quality Gates (Build Fails If)

- ❌ Overall score < 75
- ❌ Coverage < 85%
- ❌ Critical/High security vulnerabilities
- ❌ Lighthouse Performance < 85
- ❌ Serious/critical a11y violations

---

## 🔧 Quick Fixes

### Fix Linting Issues
```bash
bun run lint:fix
```

### Fix Formatting
```bash
bun run format:fix
```

### Update Dependencies
```bash
bun run audit:fix
```

### View Coverage
```bash
bun run test:coverage
open coverage/lcov-report/index.html
```

### Debug E2E Tests
```bash
bun run e2e:ui
```

---

## 📈 Current Score Breakdown

| Category | Weight | Target |
|----------|--------|--------|
| Testing | 25% | 90%+ coverage, stable E2E |
| Performance | 20% | Lighthouse 90+ |
| Security | 20% | Zero critical/high vulns |
| Maintainability | 15% | Zero lint errors |
| Accessibility | 10% | Zero serious violations |
| Reliability | 5% | Error handling + offline |
| DevEx | 5% | Fast CI, good artifacts |

---

## 🎓 Learn More

- [Quality Playbook](./docs/quality-playbook.md) - Full guide
- [Accessibility](./docs/accessibility.md) - A11y best practices
- [Performance](./docs/performance.md) - Optimization guide
- [Testing Strategy](./docs/TESTING_STRATEGY.md) - Test patterns

---

## 🆘 Common Issues

### "Score too low"
1. Check `reports/quality-report.md` for details
2. Focus on lowest-scoring category
3. Run individual checks to debug

### "Tests failing"
```bash
bun run test:watch  # Watch mode for debugging
```

### "E2E flaky"
```bash
bun run e2e:debug   # Debug mode with inspector
```

### "Lighthouse not running"
Make sure web server is running:
```bash
bun run web  # In separate terminal
```

---

## 💡 Pro Tips

1. **Before committing:**
   ```bash
   bun run lint && bun run typecheck && bun run test
   ```

2. **Before PR:**
   ```bash
   bun run quality
   ```

3. **Monitor trends:**
   - Check score on every PR
   - Track improvements over time
   - Celebrate wins! 🎉

---

**Target: 90+ Score** 🟢  
**Current: ~85 Score** 🟡

You're almost there! 💪
