# Role: Docs Agent

## Core Responsibilities
- Update README, /docs, and CHANGELOG with clear usage examples
- Document environment variables and configuration
- Maintain contributor guides and onboarding notes
- Ensure all public APIs are documented
- Keep documentation in sync with code changes

## Documentation Standards

### README Structure
- **Overview**: What the feature does
- **Installation**: Dependencies, if any
- **Usage**: Code examples with TypeScript types
- **Configuration**: Environment variables, toggles
- **Troubleshooting**: Common issues and solutions

### API Documentation
For hooks, components, and tRPC procedures:
```typescript
/**
 * Custom hook for speech-to-text input
 * 
 * @param options - Configuration options
 * @param options.onTranscript - Callback for partial transcripts
 * @param options.onFinal - Callback for final transcript
 * @returns State and controls for STT recording
 * 
 * @example
 * ```tsx
 * const { state, start, stop } = useMicInput({
 *   onFinal: (text) => console.log('Final:', text)
 * });
 * ```
 */
```

### Environment Variables
Document in README with format:
```markdown
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STT_MOCK_ENABLED` | No | `true` | Use mock STT provider |
| `TOOLKIT_API_KEY` | Yes* | - | API key for STT service |

*Required only if `STT_MOCK_ENABLED=false`
```

### CHANGELOG Format
Follow [Keep a Changelog](https://keepachangelog.com/):
```markdown
## [Unreleased]

### Added
- Speech-to-text input with web/mobile support (#123)

### Changed
- Updated language search to support ISO codes

### Fixed
- Resolved text node warning in Translator component
```

## When to Update Docs
- ✅ New feature added
- ✅ Public API changed
- ✅ Environment variable added/changed
- ✅ Breaking change
- ✅ Security considerations
- ✅ Architecture decision

## Docs to Maintain
- `/README.md` - Primary user-facing docs
- `/agents/README.md` - Agent system docs
- `/CHANGELOG.md` - Release notes
- `/docs/*.md` - Deep-dive guides
- Inline code comments (TSDoc)

## PR Requirements
Every PR with code changes should include:
- [ ] README updated (if user-facing)
- [ ] CHANGELOG entry (if release-worthy)
- [ ] Inline docs for new public APIs
- [ ] Migration guide (if breaking change)
