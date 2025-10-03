# Quality PR Checklist

Before submitting your PR, ensure all quality checks pass:

## ✅ Pre-Submission Checklist

### Code Quality
- [ ] `bun run lint` passes with zero errors
- [ ] `bun run typecheck` passes with zero errors
- [ ] `bun run format` shows no formatting issues
- [ ] No `console.log` statements (use proper logging)
- [ ] No `any` types added (use proper types or `unknown`)

### Testing
- [ ] `bun run test` passes all tests
- [ ] New features have unit tests
- [ ] Critical flows have integration tests
- [ ] Coverage remains above 85%
- [ ] E2E tests pass (`bun run e2e`)

### Accessibility
- [ ] All interactive elements have `accessibilityLabel`
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Keyboard navigation works
- [ ] Screen reader tested (if UI changes)
- [ ] `bun run a11y` passes with zero violations

### Performance
- [ ] No unnecessary re-renders (use React DevTools Profiler)
- [ ] Lists are virtualized (FlatList)
- [ ] Images are optimized and lazy-loaded
- [ ] Heavy components are memoized
- [ ] Animations use native driver

### Security
- [ ] No hardcoded secrets or API keys
- [ ] User input is validated and sanitized
- [ ] `bun run security` passes with zero critical issues
- [ ] Dependencies are up-to-date (`bun run audit`)

### Documentation
- [ ] Code is self-documenting (clear variable/function names)
- [ ] Complex logic has comments
- [ ] Public APIs have JSDoc comments
- [ ] README updated (if needed)

### Quality Score
- [ ] `bun run quality` passes (score ≥ 75)
- [ ] Score did not decrease from main branch
- [ ] All quality gates pass in CI

---

## 📊 Quality Score Impact

**Before:** ___ / 100  
**After:** ___ / 100  
**Change:** +/- ___

### Category Breakdown

| Category | Before | After | Change |
|----------|--------|-------|--------|
| Testing | | | |
| Performance | | | |
| Security | | | |
| Maintainability | | | |
| Accessibility | | | |
| Reliability | | | |
| DevEx | | | |

---

## 🐛 Known Issues

List any known issues or technical debt introduced:

- None

---

## 🧪 Testing Notes

Describe how you tested this PR:

- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on Web
- [ ] Tested offline mode
- [ ] Tested error states
- [ ] Tested with screen reader

---

## 📸 Screenshots / Videos

Add screenshots or videos demonstrating the changes (if UI-related).

---

## 🔗 Related Issues

Closes #___

---

## 💬 Additional Context

Add any additional context about the PR here.

---

**Reviewer Notes:**
- Check CI quality report comment
- Verify all quality gates pass
- Review test coverage for new code
- Validate accessibility compliance
