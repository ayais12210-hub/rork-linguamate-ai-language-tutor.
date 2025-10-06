# Contributing to Rork Language Learning App

Thank you for your interest in contributing! This guide will help you get started quickly.

## Quick Start (10-minute contributor path)

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd rork-app
   bun install
   ```

2. **Start the development environment:**
   ```bash
   # Start both backend and frontend with tunnel
   bunx rork start --tunnel
   
   # In another terminal, start the backend
   bun run dev:server
   ```

3. **Run tests:**
   ```bash
   bun run test
   bun run lint
   bun run typecheck
   ```

## Development Workflow

### Branch Naming
- `ai/<role>/<kebab-slug>` for AI-generated features
- `feat/<kebab-slug>` for new features
- `fix/<kebab-slug>` for bug fixes
- `docs/<kebab-slug>` for documentation

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new lesson generation feature
fix: resolve PhonicsTrainer initialization issue
docs: update API documentation
test: add unit tests for feature flags
chore: update dependencies
```

### Code Quality Standards

#### TypeScript
- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use proper error handling with Result types

#### React Native
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility guidelines
- Use `testID` for testing

#### Testing
- Write unit tests for utilities and hooks
- Add integration tests for critical flows
- Maintain 80%+ code coverage
- Use MSW for API mocking

#### Performance
- Use `React.memo` for expensive components
- Implement proper loading states
- Optimize images and assets
- Follow Lighthouse performance budgets

## Project Structure

```
├── app/                    # Expo Router pages
├── backend/               # Hono API server
├── components/            # Reusable UI components
├── lib/                   # Utilities and shared logic
├── modules/               # Feature modules
├── schemas/               # Zod validation schemas
├── state/                 # Zustand state management
├── __tests__/             # Test files
└── docs/                  # Documentation
```

## Feature Development

### 1. Planning
- Create an issue with `ai:planned` label for AI features
- Use `ai:autonomous` for self-contained improvements
- Break down large features into smaller tasks

### 2. Implementation
- Create a feature branch from `main`
- Implement the feature with tests
- Ensure all CI checks pass
- Update documentation if needed

### 3. Testing
- Run the full test suite: `bun run test:ci`
- Test on both iOS and Android
- Verify accessibility compliance
- Check performance metrics

### 4. Code Review
- Create a PR with the template
- Include screenshots for UI changes
- Document any breaking changes
- Ensure CI passes

## Environment Setup

### Required Environment Variables
```bash
# Feature flags (optional)
EXPO_PUBLIC_FLAGS="tts_mock=true,leaderboard=true"

# API configuration
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

### Development Tools
- **IDE**: VS Code with recommended extensions
- **Package Manager**: Bun (preferred) or npm
- **Testing**: Jest + React Native Testing Library
- **E2E**: Playwright
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript

## Testing Guidelines

### Unit Tests
- Test business logic and utilities
- Mock external dependencies
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Integration Tests
- Test component interactions
- Use MSW for API mocking
- Test error scenarios
- Verify accessibility

### E2E Tests
- Test critical user flows
- Use Playwright for web testing
- Test on multiple devices
- Include accessibility checks

## Performance Guidelines

### Bundle Size
- Keep JavaScript bundle under 500KB
- Optimize images and assets
- Use code splitting where appropriate
- Monitor bundle size in CI

### Runtime Performance
- Minimize re-renders
- Use proper memoization
- Implement loading states
- Optimize animations

### Accessibility
- Use semantic HTML elements
- Implement proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

## Security Guidelines

### Data Handling
- Never commit secrets or API keys
- Use environment variables for configuration
- Implement proper input validation
- Follow OWASP guidelines

### API Security
- Use HTTPS in production
- Implement rate limiting
- Add security headers
- Validate all inputs with Zod

## Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
bunx expo start --clear
```

**TypeScript errors:**
```bash
bun run typecheck
```

**Test failures:**
```bash
bun run test --verbose
```

**Linting errors:**
```bash
bun run lint --fix
```

### Getting Help
- Check existing issues and discussions
- Join our Discord community
- Create a new issue with detailed information
- Use the `help-wanted` label for community tasks

## Release Process

### Versioning
We use [Semantic Versioning](https://semver.org/):
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared
- [ ] App store submissions ready

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's coding standards
- Report issues promptly

## License

This project is licensed under the MIT License. By contributing, you agree that your contributions will be licensed under the same license.

---

Thank you for contributing to Rork! 🚀
