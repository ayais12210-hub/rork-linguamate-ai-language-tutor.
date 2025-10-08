# Cursor and GitHub Tools Integration

This document describes the integration of Cursor and GitHub tools in the Linguamate AI Tutor multi-agent workforce system.

## Overview

The system now includes comprehensive tools for:
- **GitHub Operations**: Issues, PRs, releases, workflows
- **Cursor Integration**: Project management, code assistance, analytics
- **Agent Automation**: Automated workflows for different agent roles

## MCP Servers

### Enhanced GitOps Server (`mcp_servers/gitops_server.py`)

Provides comprehensive GitHub operations:

#### Git Operations
- `git_create_branch` - Create or reset a branch
- `git_commit_all` - Stage and commit all changes
- `git_push_branch` - Push branch to origin
- `git_open_pr` - Create pull request via GitHub CLI

#### GitHub Issues
- `github_create_issue` - Create GitHub issues
- `github_list_issues` - List issues with filtering

#### Pull Requests
- `github_get_pr_details` - Get PR details
- `github_list_prs` - List pull requests
- `github_add_pr_comment` - Add comments to PRs
- `github_merge_pr` - Merge pull requests

#### Releases
- `github_create_release` - Create GitHub releases

#### GitHub Actions
- `github_get_workflow_runs` - Get workflow run status
- `github_trigger_workflow` - Trigger workflows

### Cursor Tools Server (`mcp_servers/cursor_server.py`)

Provides Cursor-specific operations:

#### Project Management
- `cursor_create_project` - Create new Cursor projects
- `cursor_list_projects` - List projects
- `cursor_get_project` - Get project details
- `cursor_update_project` - Update project settings
- `cursor_delete_project` - Delete projects

#### Session Management
- `cursor_create_session` - Create coding sessions
- `cursor_list_sessions` - List sessions
- `cursor_get_session` - Get session details
- `cursor_send_message` - Send messages to sessions

#### Code Assistance
- `cursor_get_suggestions` - Get code suggestions
- `cursor_apply_suggestion` - Apply suggestions

#### Advanced Features
- `cursor_code_review` - Perform code reviews
- `cursor_refactor` - Refactor code
- `cursor_generate_tests` - Generate test files
- `cursor_documentation` - Generate documentation

#### Analytics
- `cursor_get_analytics` - Get usage analytics

## Agent Scripts

### Manager Agent (`agents/manager_agent.py`)

Handles task planning and coordination:
- Loads tasks from `agents/tasks.yaml`
- Creates work plans with priorities
- Spawns subtasks for different agent roles
- Creates branches for autonomous operations
- Updates plan files in `agents/outbox/`

### Engineer Agent (`agents/engineer_agent.py`)

Handles implementation:
- Loads task details
- Runs pre/post implementation checks (lint, typecheck, tests)
- Implements features and bug fixes
- Commits changes with conventional commit messages
- Creates pull requests
- Pushes branches

### Tester Agent (`agents/tester_agent.py`)

Handles testing and quality assurance:
- Runs comprehensive test suites (unit, E2E, a11y, performance)
- Extracts coverage information
- Generates test reports
- Creates test files
- Validates test quality

## Configuration

### MCP Configuration Files

#### `.cursor/mcp.json`
```json
{
  "mcpServers": {
    "gitops-enhanced": {
      "command": "python3",
      "args": ["mcp_servers/gitops_server.py"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "cursor-tools": {
      "command": "python3",
      "args": ["mcp_servers/cursor_server.py"],
      "env": {
        "CURSOR_API_KEY": "${env:CURSOR_API_KEY}"
      }
    }
  }
}
```

#### `mcp.config.json`
```json
{
  "clients": [
    {
      "name": "linguamate-mcp",
      "servers": [
        {
          "id": "gitops",
          "transport": {
            "stdio": {
              "command": "python3",
              "args": ["mcp_servers/gitops_server.py"]
            }
          },
          "env": {
            "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
          }
        },
        {
          "id": "cursor",
          "transport": {
            "stdio": {
              "command": "python3",
              "args": ["mcp_servers/cursor_server.py"]
            }
          },
          "env": {
            "CURSOR_API_KEY": "${env:CURSOR_API_KEY}"
          }
        }
      ]
    }
  ]
}
```

## Environment Variables

Required environment variables:

- `GITHUB_TOKEN` - GitHub personal access token with appropriate permissions
- `CURSOR_API_KEY` - Cursor API key for accessing Cursor services

## GitHub Actions Workflow

### Agent Operations Workflow (`.github/workflows/agent-operations.yml`)

Automated workflow for agent operations:

#### Triggers
- Manual dispatch with agent type selection
- Issues labeled with `ai:planned` or `ai:autonomous`
- Pull requests labeled with `ai:planned` or `ai:autonomous`

#### Jobs
- `agent-manager` - Runs manager agent for planning
- `agent-engineer` - Runs engineer agent for implementation
- `agent-tester` - Runs tester agent for testing
- `agent-docs` - Runs documentation agent
- `agent-security` - Runs security agent
- `cursor-integration` - Updates Cursor project and generates reports

## Usage Examples

### Running Agents Manually

```bash
# Run manager agent
TASK_ID=translator-stt npm run agent:manager

# Run engineer agent
TASK_ID=translator-stt BRANCH_NAME=ai/engineer/translator-stt npm run agent:engineer

# Run tester agent
TASK_ID=translator-stt npm run agent:tester
```

### Using MCP Tools

```python
# GitHub operations
from mcp_servers.gitops_server import github_create_issue, github_list_prs

# Create an issue
issue = github_create_issue({
    "title": "Implement voice input",
    "body": "Add speech-to-text functionality",
    "labels": ["enhancement", "ai:planned"]
})

# List pull requests
prs = github_list_prs({"state": "open"})
```

### Triggering Workflows

```bash
# Trigger agent workflow manually
gh workflow run agent-operations.yml \
  -f agent_type=engineer \
  -f task_id=translator-stt \
  -f autonomy_level=autonomous
```

## Security Considerations

- All API keys are stored as GitHub secrets
- MCP servers use environment variables for authentication
- Workflows run in isolated environments
- Agent operations respect autonomy levels (`planned` vs `autonomous`)

## Monitoring and Analytics

- Agent operations generate reports in `agent_report.json`
- Cursor analytics provide usage insights
- GitHub Actions provide workflow execution logs
- Test reports include coverage and quality metrics

## Troubleshooting

### Common Issues

1. **Missing API Keys**: Ensure `GITHUB_TOKEN` and `CURSOR_API_KEY` are set
2. **Permission Errors**: Verify GitHub token has required permissions
3. **MCP Server Errors**: Check Python dependencies in `mcp_servers/requirements.txt`
4. **Agent Failures**: Review agent logs and error messages

### Debug Commands

```bash
# Validate MCP configuration
npm run mcp:check

# Test MCP servers
npm run mcp:test

# Check agent status
python3 agents/manager_agent.py
```

## Future Enhancements

- Integration with more Cursor features
- Enhanced GitHub Actions workflows
- Real-time agent communication
- Advanced analytics and reporting
- Multi-repository support