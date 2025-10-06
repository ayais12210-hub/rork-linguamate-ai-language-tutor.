# Postgres MCP Server

This directory is for the Postgres Model Context Protocol server (optional).

## Setup

1. Install a Postgres MCP server implementation:
   ```bash
   # Check available implementations at:
   # https://github.com/modelcontextprotocol/servers
   ```

2. Update `.cursor/mcp.json` (uncomment the postgres-ro block)

3. Add to `.env`:
   ```
   DATABASE_URL_RO=postgres://readonly_user:password@host:5432/linguamate
   ```

## Security

⚠️ **Always use a read-only database user for MCP access.**

Create a read-only user:
```sql
CREATE USER mcp_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE linguamate TO mcp_readonly;
GRANT USAGE ON SCHEMA public TO mcp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mcp_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO mcp_readonly;
```

## Usage

Once configured, you can:
- Query lesson completion rates
- Analyze user engagement metrics
- Identify slow queries for optimization
- Validate data integrity
- Generate analytics reports

**Do not use for production database writes** - only enable write access for controlled maintenance windows.
