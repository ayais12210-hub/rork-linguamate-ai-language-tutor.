// Danger JS configuration for Linguamate AI Tutor
// See: https://danger.systems/js/

import { danger, warn, fail, message } from 'danger'

// Check for large PRs without tests
if (danger.github.pr.additions + danger.github.pr.deletions > 500) {
  const hasTestFiles = danger.git.modified_files.some(file => 
    file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__')
  )
  
  if (!hasTestFiles) {
    fail('🚫 Large PRs (>500 lines) must include test files')
  }
}

// Check for feature PRs without tests
if (danger.github.pr.title.includes('feat:') || danger.github.pr.title.includes('feature:')) {
  const hasTestFiles = danger.git.modified_files.some(file => 
    file.includes('.test.') || file.includes('.spec.') || file.includes('__tests__')
  )
  
  if (!hasTestFiles) {
    warn('⚠️ Feature PRs should include test files')
  }
}

// Check for MCP changes without validation
const hasMCPChanges = danger.git.modified_files.some(file => file.startsWith('omni-mcp/'))
if (hasMCPChanges) {
  message('🔍 MCP changes detected - ensure omni-mcp/ validation passes')
}

// Check for documentation updates
const hasDocChanges = danger.git.modified_files.some(file => 
  file.includes('.md') || file.includes('docs/')
)
if (hasDocChanges) {
  message('📚 Documentation updated - thank you!')
}

// Check for package.json changes
const hasPackageChanges = danger.git.modified_files.includes('package.json')
if (hasPackageChanges) {
  warn('📦 Package.json modified - ensure dependencies are properly tested')
}

// Check for lockfile changes
const hasLockfileChanges = danger.git.modified_files.some(file => 
  file.includes('pnpm-lock.yaml') || file.includes('package-lock.json')
)
if (hasLockfileChanges && !hasPackageChanges) {
  warn('🔒 Lockfile changed without package.json changes - verify this is intentional')
}

// Check for conventional commits
const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .+/
if (!conventionalCommitRegex.test(danger.github.pr.title)) {
  fail('📝 PR title must follow Conventional Commits format (e.g., "feat: add new feature")')
}

// Check for PR description
if (!danger.github.pr.body || danger.github.pr.body.length < 50) {
  warn('📝 PR description should be more detailed (at least 50 characters)')
}

// Check for breaking changes
if (danger.github.pr.title.includes('BREAKING CHANGE') || danger.github.pr.body.includes('BREAKING CHANGE')) {
  message('🚨 Breaking change detected - ensure this is properly documented')
}

// Check for TODO/FIXME comments
const todoRegex = /(TODO|FIXME|HACK|XXX):/i
const hasTodos = danger.git.modified_files.some(file => {
  const content = danger.git.diffForFile(file)
  return content && todoRegex.test(content)
})

if (hasTodos) {
  warn('📝 PR contains TODO/FIXME comments - consider addressing them')
}

// Success message for good PRs
if (danger.github.pr.additions > 0 && danger.github.pr.deletions > 0) {
  message('✅ PR contains both additions and deletions - good refactoring!')
}