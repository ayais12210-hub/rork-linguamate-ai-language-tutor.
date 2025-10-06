# RevenueCat MCP Server

This directory is for the RevenueCat Model Context Protocol server (optional).

## Setup

1. Install a RevenueCat MCP server or use RevenueCat API via HTTP MCP
2. Update `.cursor/mcp.json` (uncomment the revenuecat block)
3. Add to `.env`:
   ```
   REVENUECAT_API_KEY_RO=your_revenuecat_api_key
   ```

## Security

Generate an API key at: https://app.revenuecat.com/settings/api-keys

⚠️ Use a **read-only** API key:
- Public API keys are read-only by design
- Secret API keys have write access - only use if absolutely necessary

## Usage

Once configured, you can:
- Fetch subscription analytics
- Monitor trial conversions
- Analyze churn by cohort
- Check active entitlements
- Generate revenue dashboards

## Example Prompts

```
"Show me subscription stats for the last 30 days"
"List active premium users"
"Calculate trial-to-paid conversion rate for October"
"Find users with failed renewals"
```

## Notes

Linguamate currently uses RevenueCat (`EXPO_PUBLIC_RC_API_KEY` in `.env.example`).

This MCP server is useful for:
- Automated analytics reports
- Dunning workflow triggers
- A/B test analysis for pricing
- Subscription health monitoring

**Integration with Stripe:**
- If using both RevenueCat and Stripe, RevenueCat abstracts cross-platform payments
- RevenueCat MCP is preferred for subscription analytics
- Stripe MCP is better for raw payment data and refunds
