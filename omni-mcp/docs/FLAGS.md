# Linguamate.ai Feature Flags

This document describes all feature flags used in the Linguamate.ai MCP orchestration system. Feature flags allow for runtime configuration and gradual feature rollouts.

## Core Learning Features

### LM_USE_LOCAL_STT
- **Type**: boolean
- **Default**: false
- **Description**: Enable fallback to on-device speech-to-text when cloud STT services are unavailable
- **Impact**: Reduces dependency on external STT services, improves offline capability
- **Workflows**: bilingual-coach, instant-translate

### LM_COACH_REASONING_MODEL
- **Type**: string
- **Default**: deepseek-r1
- **Options**: deepseek-r1, qwen-max, openrouter
- **Description**: Select the reasoning model for AI coach feedback generation
- **Impact**: Affects quality and speed of coaching feedback
- **Workflows**: bilingual-coach, content-qa

### LM_TRANSLATE_PROVIDER
- **Type**: string
- **Default**: gemini
- **Options**: gemini, minimax, openrouter
- **Description**: Primary translation service provider
- **Impact**: Affects translation quality and latency
- **Workflows**: instant-translate, bilingual-coach

### LM_RAG_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable RAG (Retrieval Augmented Generation) for content search and recommendations
- **Impact**: Improves content discovery and contextual responses
- **Workflows**: lesson-ingest, bilingual-coach

## CI/CD & Quality Assurance

### LM_CI_SMOKE_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable end-to-end smoke tests in CI pipeline
- **Impact**: Ensures critical user flows work before deployment
- **Workflows**: dev-ci-guardian

### LM_SCHEMA_VALIDATION_STRICT
- **Type**: boolean
- **Default**: true
- **Description**: Enable strict schema validation for all content
- **Impact**: Prevents invalid content from reaching production
- **Workflows**: lesson-ingest, content-qa

### LM_PERFORMANCE_MONITORING
- **Type**: boolean
- **Default**: true
- **Description**: Enable performance monitoring and Core Web Vitals tracking
- **Impact**: Helps identify performance regressions
- **Workflows**: dev-ci-guardian

## Content & Media

### LM_TTS_QUALITY_CHECK
- **Type**: boolean
- **Default**: true
- **Description**: Enable AI-powered TTS quality assessment
- **Impact**: Ensures voice output meets quality standards
- **Workflows**: content-qa, bilingual-coach

### LM_VOICE_CUSTOMIZATION
- **Type**: boolean
- **Default**: false
- **Description**: Enable custom voice profiles for users
- **Impact**: Allows personalized TTS experiences
- **Workflows**: bilingual-coach, instant-translate

### LM_CONTENT_ENRICHMENT
- **Type**: boolean
- **Default**: true
- **Description**: Enable automatic content enrichment with cultural notes
- **Impact**: Improves content quality and cultural relevance
- **Workflows**: lesson-ingest

## Billing & Entitlements

### LM_BILLING_WEBHOOKS_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable Stripe webhook processing for billing events
- **Impact**: Ensures subscription changes are processed automatically
- **Workflows**: billing-entitlements

### LM_FAMILY_PLAN_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable family plan features and multi-seat management
- **Impact**: Allows family sharing and seat management
- **Workflows**: billing-entitlements

### LM_TRIAL_EXTENSIONS_ENABLED
- **Type**: boolean
- **Default**: false
- **Description**: Enable automatic trial extensions for engaged users
- **Impact**: Increases trial-to-paid conversion rates
- **Workflows**: billing-entitlements

## Growth & Support

### LM_AUTOMATED_SUPPORT
- **Type**: boolean
- **Default**: true
- **Description**: Enable automated support ticket routing and responses
- **Impact**: Improves support efficiency and response times
- **Workflows**: growth-support

### LM_LEAD_SCORING_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable AI-powered lead scoring and qualification
- **Impact**: Improves sales efficiency and conversion rates
- **Workflows**: growth-support

### LM_MARKETING_AUTOMATION
- **Type**: boolean
- **Default**: true
- **Description**: Enable automated marketing campaign generation
- **Impact**: Reduces manual marketing work and improves consistency
- **Workflows**: growth-support

## Security & Compliance

### LM_PII_REDACTION_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable automatic PII redaction in logs and analytics
- **Impact**: Ensures privacy compliance and data protection
- **Workflows**: All workflows

### LM_AUDIT_LOGGING_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable comprehensive audit logging for compliance
- **Impact**: Provides audit trail for regulatory compliance
- **Workflows**: All workflows

### LM_ENCRYPTION_AT_REST
- **Type**: boolean
- **Default**: true
- **Description**: Enable encryption for data at rest
- **Impact**: Protects sensitive data in databases and storage
- **Workflows**: All workflows

## Performance & Scalability

### LM_CACHING_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable response caching for improved performance
- **Impact**: Reduces latency and improves user experience
- **Workflows**: All workflows

### LM_RATE_LIMITING_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable rate limiting to prevent abuse
- **Impact**: Protects against abuse and ensures fair usage
- **Workflows**: All workflows

### LM_CIRCUIT_BREAKER_ENABLED
- **Type**: boolean
- **Default**: true
- **Description**: Enable circuit breakers for external service calls
- **Impact**: Prevents cascade failures and improves resilience
- **Workflows**: All workflows

## Development & Testing

### LM_MOCK_SERVICES_ENABLED
- **Type**: boolean
- **Default**: false
- **Description**: Enable mock services for development and testing
- **Impact**: Allows development without external service dependencies
- **Workflows**: All workflows (development only)

### LM_DEBUG_LOGGING_ENABLED
- **Type**: boolean
- **Default**: false
- **Description**: Enable detailed debug logging
- **Impact**: Provides detailed logs for troubleshooting
- **Workflows**: All workflows

### LM_TEST_DATA_GENERATION
- **Type**: boolean
- **Default**: false
- **Description**: Enable automatic test data generation
- **Impact**: Simplifies testing with realistic data
- **Workflows**: Testing workflows

## Feature Flag Management

### Runtime Configuration
Feature flags are read at runtime from environment variables. Changes require application restart unless using a dynamic configuration service.

### Flag Hierarchy
1. Environment variables (highest priority)
2. Configuration files
3. Default values (lowest priority)

### Flag Validation
All feature flags are validated against their expected types and values at startup. Invalid flags will cause the application to fail fast.

### Monitoring
Feature flag usage is tracked and logged for analytics and debugging purposes.

## Usage Examples

### Environment Configuration
```bash
# Enable local STT fallback
export LM_USE_LOCAL_STT=true

# Use Qwen Max for reasoning
export LM_COACH_REASONING_MODEL=qwen-max

# Disable RAG for testing
export LM_RAG_ENABLED=false
```

### Runtime Check
```typescript
const useLocalSTT = process.env.LM_USE_LOCAL_STT === 'true';
const reasoningModel = process.env.LM_COACH_REASONING_MODEL || 'deepseek-r1';
const ragEnabled = process.env.LM_RAG_ENABLED !== 'false';
```

### Conditional Logic
```typescript
if (process.env.LM_TTS_QUALITY_CHECK === 'true') {
  // Run TTS quality assessment
  await windsor.qa(audioSamples);
} else {
  // Skip quality check
  console.log('TTS quality check disabled');
}
```

## Flag Rollout Strategy

### Gradual Rollout
1. **Development**: Enable flag in development environment
2. **Staging**: Test flag in staging environment
3. **Beta Users**: Enable for beta users only
4. **Percentage Rollout**: Gradually increase percentage of users
5. **Full Rollout**: Enable for all users
6. **Cleanup**: Remove flag after stable rollout

### Rollback Plan
- Keep previous flag values documented
- Monitor key metrics during rollout
- Have automated rollback triggers
- Manual rollback capability for critical issues

## Flag Dependencies

Some feature flags have dependencies on others:

- `LM_VOICE_CUSTOMIZATION` requires `LM_TTS_QUALITY_CHECK`
- `LM_FAMILY_PLAN_ENABLED` requires `LM_BILLING_WEBHOOKS_ENABLED`
- `LM_MARKETING_AUTOMATION` requires `LM_LEAD_SCORING_ENABLED`

## Flag Metrics

Track the following metrics for each feature flag:
- Usage rate
- Performance impact
- Error rate
- User satisfaction
- Business metrics (conversion, retention, etc.)