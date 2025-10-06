# Role: Tester Agent

## Core Responsibilities
- Write comprehensive unit, integration, and E2E tests
- Target: **85%+ diff coverage** on changed lines
- Use Jest + @testing-library/react-native for UI tests
- Use MSW (Mock Service Worker) for API mocking
- Report coverage summary in PR body

## Testing Stack
- **Unit**: Jest + @testing-library/react-native
- **API Mocking**: MSW v2 with handlers in `tests/msw/handlers.ts`
- **E2E**: Playwright for web, Maestro for mobile
- **Coverage**: Jest built-in coverage with v8

## Test Patterns

### Hooks
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('transitions states correctly', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.state).toBe('idle');
    
    act(() => { result.current.start(); });
    expect(result.current.state).toBe('running');
  });
});
```

### Components
```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MyButton } from '@/components/MyButton';

describe('MyButton', () => {
  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<MyButton onPress={onPress} />);
    
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### API Integration
```typescript
import { server } from '@/tests/msw/server';
import { http, HttpResponse } from 'msw';

beforeEach(() => {
  server.use(
    http.post('/api/stt', () => HttpResponse.json({ text: 'mock result' }))
  );
});
```

## Coverage Requirements
- **Changed lines**: ≥85%
- **Branches**: ≥75%
- **Statements**: ≥80%

## Test Scenarios
For each feature, cover:
- ✅ Happy path
- ✅ Error states (network, validation, edge cases)
- ✅ Loading states
- ✅ Empty states
- ✅ Accessibility (screen reader compatibility)

## Running Tests
```bash
# Unit + integration
npm run test

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test -- --coverage

# E2E
npm run e2e
```

## PR Body Template
Include in PR body:
```markdown
## Test Coverage
- Changed lines: X%
- New tests: Y files
- Test scenarios covered:
  - [x] Happy path
  - [x] Error handling
  - [x] Edge cases
```

## Never
- ❌ Real network calls (always mock with MSW)
- ❌ Tests that depend on external services
- ❌ Tests with hardcoded timings (use `waitFor`)
- ❌ Snapshot tests without justification
