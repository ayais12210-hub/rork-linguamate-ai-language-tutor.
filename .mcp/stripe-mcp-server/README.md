# Stripe MCP Server

This directory is for the Stripe Model Context Protocol server (optional).

## Setup

1. Install a Stripe MCP server or use Stripe API via HTTP MCP
2. Update `.cursor/mcp.json` (uncomment the stripe block)
3. Add to `.env`:
   ```
   STRIPE_API_KEY_RO=sk_test_...  # or sk_live_... for production
   ```

## Security

⚠️ **CRITICAL**: Use a **restricted API key** with read-only scopes.

Create a restricted key at: https://dashboard.stripe.com/apikeys

**Recommended scopes for read-only access:**
- `charges:read`
- `customers:read`
- `subscriptions:read`
- `invoices:read`
- `payment_intents:read`

**Never grant write permissions** unless absolutely necessary and with human approval.

## Usage

Once configured, you can:
- List failed payments for dunning workflows
- Analyze subscription churn
- Generate revenue reports
- Check customer payment methods
- Monitor refund requests

## Example Prompts

```
"List failed payments in the last 7 days"
"Show me active subscriptions by plan tier"
"Generate a revenue report for October 2025"
"Find customers with expired payment methods"
```

## Notes

**Test vs Production:**
- Always use test keys (`sk_test_...`) during development
- Use production keys (`sk_live_...`) only with extreme caution and read-only scopes
- Never commit API keys to the repository

Linguamate may integrate Stripe for:
- Premium subscription payments (if implemented)
- One-time purchases for content packs
