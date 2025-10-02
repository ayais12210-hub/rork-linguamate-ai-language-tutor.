# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive testing infrastructure with Jest, Playwright, and MSW
- Unit test coverage for schemas, utilities, and factories
- E2E test suite for web platform
- CI/CD pipeline with test gates and coverage reporting
- Git hooks with Husky for pre-commit linting and commit message validation
- Conventional Commits enforcement with commitlint
- Test data factories for lessons and users
- TestID conventions documentation
- MSW handlers for API mocking
- Test utilities for React components and tRPC procedures

### Changed
- Updated CI workflow to include typecheck, lint, test, and E2E jobs
- Enhanced code quality checks with Prettier and ESLint

### Infrastructure
- Jest configuration with coverage thresholds
- Playwright configuration for E2E testing
- Husky git hooks setup
- lint-staged configuration
- Release-please automation for changelog generation

## [1.0.0] - 2024-01-01

### Added
- Initial release of Linguamate language learning app
- Multi-language support (Punjabi, Spanish, French, etc.)
- Interactive lessons and exercises
- Gamification features (XP, streaks, leaderboards)
- AI-powered chat tutor
- Offline mode support
- User authentication and profiles
- Progress tracking and analytics

[Unreleased]: https://github.com/linguamate/linguamate/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/linguamate/linguamate/releases/tag/v1.0.0
