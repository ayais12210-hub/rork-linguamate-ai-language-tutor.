# AI PR Reviewer Debug Guide

This guide helps you debug and fix issues with the AI PR Reviewer workflow.

## Quick Fixes

### 1. Add Debug Secrets
Go to your repository → Settings → Secrets and variables → Actions → New repository secret:

```
ACTIONS_STEP_DEBUG=true
ACTIONS_RUNNER_DEBUG=true
```

### 2. Ensure Required Secrets
Add at least one AI provider API key:
- `OPENAI_API_KEY` (recommended)
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `GEMINI_API_KEY`

### 3. Check Permissions
The workflow now includes:
```yaml
permissions:
  contents: read
  pull-requests: write
```

## Common Issues & Solutions

### Issue: "Run AI Review – Process completed with exit code 1"

**Root Causes:**
1. Missing API key
2. Insufficient permissions
3. Git fetch/diff issues
4. API rate limits or errors

**Debug Steps:**
1. Check the "Debug Environment" step output
2. Look for specific error messages in the logs
3. Verify API keys are set correctly

### Issue: "No AI provider key found"

**Solution:**
Add at least one API key in repository secrets:
- Go to Settings → Secrets and variables → Actions
- Add `OPENAI_API_KEY` with your OpenAI API key
- Or add another provider key

### Issue: "Failed to post PR comment"

**Causes:**
- Missing `pull-requests: write` permission
- Invalid `GITHUB_TOKEN`
- Network issues

**Solution:**
The workflow now includes proper permissions and error handling.

## Local Testing

### Test the AI reviewer locally:

```bash
# Set your API key
export OPENAI_API_KEY=sk-your-key-here

# Run the debug script
node .github/ai-reviewer/debug.mjs
```

### Test with a real PR diff:

```bash
# Create a test diff
git diff HEAD~1 > test.diff

# Test the reviewer with the diff
export OPENAI_API_KEY=sk-your-key-here
export GITHUB_REPOSITORY=your-org/your-repo
export GITHUB_EVENT_PATH=/path/to/mock-event.json
export GITHUB_TOKEN=your-token

node .github/ai-reviewer/review.mjs
```

## Workflow Structure

The AI review is now integrated into the main CI workflow with:

1. **Isolation**: Runs as separate job with `continue-on-error: true`
2. **Debugging**: Comprehensive logging and environment checks
3. **Error Handling**: Graceful failure with detailed error messages
4. **Permissions**: Proper GitHub permissions for PR comments

## Monitoring

After implementing fixes:

1. **Re-run the failed job** to see detailed debug output
2. **Check the "Debug Environment" step** for configuration issues
3. **Look for specific error messages** in the "Run AI Review" step
4. **Verify the "Surface AI review result" step** shows the outcome

## Troubleshooting Checklist

- [ ] Debug secrets added (`ACTIONS_STEP_DEBUG=true`)
- [ ] At least one AI API key is set
- [ ] Workflow has `pull-requests: write` permission
- [ ] PR is not in draft mode
- [ ] Git history is available (fetch-depth: 0)
- [ ] API key has sufficient credits/quota
- [ ] Network connectivity to AI provider APIs

## Success Indicators

When working correctly, you should see:
- ✅ Debug environment shows all required variables
- ✅ AI provider selected and model confirmed
- ✅ Git diff retrieved successfully
- ✅ AI API calls complete without errors
- ✅ PR comment posted with review results
- ✅ "AI review completed successfully" message

## Need Help?

If issues persist after following this guide:
1. Check the GitHub Actions logs for specific error messages
2. Verify your API keys are valid and have sufficient quota
3. Test locally using the debug script
4. Check the AI provider's status page for outages