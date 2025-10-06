# Redis MCP Server

This directory is for the Redis Model Context Protocol server (optional).

## Setup

1. Install a Redis MCP server implementation
2. Update `.cursor/mcp.json` (uncomment the redis-ro block)
3. Add to `.env`:
   ```
   REDIS_URL_RO=rediss://readonly_user:password@host:6380/0
   ```

## Security

⚠️ **Use a read-only Redis user or connection.**

Configure Redis ACL:
```redis
ACL SETUSER mcp_readonly on >secure_password ~* +@read -@write -@dangerous
```

## Usage

Once configured, you can:
- Inspect rate-limit buckets (`linguamate:rate:*`)
- Monitor job queues
- Check cache hit rates
- Identify stale keys for cleanup
- Debug session state issues

**Do not use for production writes** - read-only access is sufficient for most agent tasks.
