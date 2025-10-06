# 🧠 MCP Integration Setup Guide

This guide explains how to set up and use the Model Context Protocol (MCP) integration for automated content ingestion in Linguamate.

## 📁 Files Added

```
mcp.config.json                    # MCP client configuration
mcp_servers/
├── requirements.txt               # Python dependencies
├── ingest_server.py              # News content scraping server
├── gitops_server.py              # Git operations server
└── test_ingest.py                # Test script
.cursor/tasks/
└── content-pipeline.yml          # Cursor automation task
.github/workflows/
└── content-ingest.yml            # GitHub Actions workflow
content/news/
└── .gitkeep                      # Directory for lesson JSON files
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r mcp_servers/requirements.txt
```

### 2. Test MCP Servers

```bash
# Test ingest server
python3 mcp_servers/test_ingest.py

# Test gitops server
echo '{"type":"tools/list"}' | python3 mcp_servers/gitops_server.py
```

### 3. Run Content Pipeline

In Cursor, run the task:
- Open Command Palette (`Cmd+Shift+P`)
- Run Task: "content-pipeline"
- Or manually: `.cursor/tasks/content-pipeline.yml`

## 🔧 Configuration

### Domain Allowlist

Edit `mcp.config.json` to modify allowed domains:

```json
{
  "env": {
    "MCP_INGEST_ALLOW_DOMAINS": "bbc.co.uk,aljazeera.com,apnews.com,reuters.com"
  }
}
```

### Content Sources

Modify `.cursor/tasks/content-pipeline.yml` to change news sources:

```yaml
- name: Ingest (index pages → lesson JSON)
  run: |
    mcp:ingest.ingest_from_index --index_url "https://www.bbc.co.uk/news" --selector "a.gs-c-promo-heading" --language "en" --max_links 6
```

## 📊 Generated Content

Lesson JSON files are created in `content/news/` with this structure:

```json
{
  "id": "abc123def456",
  "source_url": "https://example.com/article",
  "title": "Article Title",
  "language": "en",
  "created_at": 1704067200,
  "sections": [
    {
      "type": "context",
      "text": "Article content..."
    },
    {
      "type": "vocab_suggestions",
      "items": []
    },
    {
      "type": "prompts",
      "items": [
        {
          "task": "summarise",
          "prompt": "Summarise the article in 3 bullet points."
        },
        {
          "task": "translate",
          "prompt": "Translate the summary into the learner's target language."
        },
        {
          "task": "quiz",
          "prompt": "Generate 3 comprehension questions (A/B/C answers)."
        }
      ]
    }
  ],
  "safety": {
    "pii_checked": true,
    "profanity_checked": true
  }
}
```

## 🔄 Automation

### Manual Trigger

```bash
# Run the full pipeline
python3 mcp_servers/test_ingest.py
```

### Scheduled Runs

The GitHub Actions workflow runs automatically:
- **Schedule**: Weekdays at 06:15 UTC
- **Manual**: Via GitHub Actions UI
- **Branch**: `content-ingest`
- **PR**: Auto-created with lesson content

### Cursor Integration

1. Ensure `mcp.config.json` is in repo root
2. Cursor will auto-discover MCP servers
3. Use `mcp:ingest.*` and `mcp:gitops.*` in tasks

## 🛡️ Security

### Domain Restrictions

- Only whitelisted domains can be scraped
- Configure in `MCP_INGEST_ALLOW_DOMAINS` environment variable
- Default: `bbc.co.uk,aljazeera.com,apnews.com,reuters.com`

### Content Safety

- Basic PII and profanity checks (placeholder)
- Content length limits (1200 chars max)
- Rate limiting via timeout settings

### Git Operations

- Safe branch creation and commits
- No direct merges (PRs only)
- Requires GitHub CLI authentication

## 🐛 Troubleshooting

### Common Issues

1. **Python not found**: Use `python3` instead of `python`
2. **Permission denied**: Run `chmod +x mcp_servers/*.py`
3. **Import errors**: Install requirements with `pip install -r mcp_servers/requirements.txt`
4. **Domain blocked**: Check `MCP_INGEST_ALLOW_DOMAINS` setting

### Debug Mode

```bash
# Test individual components
echo '{"type":"tools/call","name":"ingest_news","arguments":{"urls":["https://example.com"],"language":"en","max_items":1}}' | python3 mcp_servers/ingest_server.py
```

### Logs

- MCP server logs: Check stdout/stderr
- GitHub Actions: Check workflow logs
- Cursor tasks: Check task output

## 🔮 Next Steps

1. **Add more content sources** (RSS feeds, APIs)
2. **Implement content quality filters** (sentiment, difficulty)
3. **Add lesson categorization** (topics, difficulty levels)
4. **Integrate with existing lesson system**
5. **Add content moderation** (AI-powered filtering)

## 📚 Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cursor MCP Integration](https://docs.cursor.com/features/mcp)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Beautiful Soup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)