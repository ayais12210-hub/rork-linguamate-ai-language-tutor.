# Linguamate.ai Server-to-Capability Mapping

This document provides a comprehensive mapping of all MCP servers to their product capabilities, tool contracts, and required environment variables.

## Server Catalog & Capabilities

### Core AI & Language Services

#### OpenRouter (`openrouter.yaml`)
**Capability**: Meta-LLM gateway with intelligent routing
**Primary Use**: General LLM completions, STT, reasoning
**Tool Contracts**:
- `llm.complete({prompt, model, maxTokens, temperature})` → `{text, usage, model}`
- `stt.transcribe({audio, language})` → `{text, confidence, segments}`
- `route.model({task, context})` → `{recommendedModel, reason}`

**Required Env**: `OPENROUTER_API_KEY`
**Fallback**: Integration App local STT
**Health Check**: `https://openrouter.ai/api/v1/models`

#### DeepSeek R1 (`deepseek-r1.yaml`)
**Capability**: Advanced reasoning LLM for grading and explanations
**Primary Use**: Coach feedback generation, content QA, complex reasoning
**Tool Contracts**:
- `reason.analyze({context, question, rubric})` → `{analysis, score, reasoning}`
- `feedback.generate({input, rubric, context})` → `{feedback, suggestions, score}`
- `grade.content({content, criteria})` → `{grade, feedback, improvements}`

**Required Env**: `DEEPSEEK_API_KEY`
**Health Check**: `https://api.deepseek.com/v1/models`

#### Qwen Max (`qwen-max.yaml`)
**Capability**: High-context LLM for long content generation
**Primary Use**: Lesson generation, content normalization, long-form analysis
**Tool Contracts**:
- `generate.lesson({topic, level, language})` → `{lesson, metadata, quality}`
- `normalize.content({rawContent, schema})` → `{normalizedContent, confidence}`
- `analyze.long({content, context})` → `{analysis, insights, recommendations}`

**Required Env**: `QWEN_MAX_API_KEY`
**Health Check**: `https://dashscope.aliyuncs.com/v1/models`

#### Gemini (`gemini.yaml`)
**Capability**: Multimodal LLM for audio/image processing
**Primary Use**: STT, MT, multimodal lesson content
**Tool Contracts**:
- `multimodal.process({input, type, task})` → `{result, confidence, metadata}`
- `translate.text({text, sourceLang, targetLang})` → `{translation, confidence}`
- `analyze.image({imageUrl, prompt})` → `{description, analysis}`

**Required Env**: `GEMINI_API_KEY`
**Health Check**: `https://generativelanguage.googleapis.com/v1beta/models`

#### Minimax (`minimax.yaml`)
**Capability**: Fast paraphrasing and simplification
**Primary Use**: Quick translations, content simplification
**Tool Contracts**:
- `paraphrase.text({text, style, level})` → `{paraphrased, changes}`
- `simplify.content({content, targetLevel})` → `{simplified, complexity}`
- `translate.fast({text, targetLang})` → `{translation, confidence}`

**Required Env**: `MINIMAX_API_KEY`, `MINIMAX_GROUP_ID`
**Health Check**: Custom endpoint

#### Grok (`grok.yaml`)
**Capability**: Web-aware LLM for current information
**Primary Use**: Cultural notes, current usage examples, research
**Tool Contracts**:
- `research.current({topic, context})` → `{information, sources, relevance}`
- `cultural.notes({topic, language})` → `{notes, examples, context}`
- `web.search({query, filters})` → `{results, summaries, sources}`

**Required Env**: `GROK_API_KEY`
**Health Check**: `https://api.x.ai/v1/models`

### Speech & Audio Services

#### ElevenLabs (`elevenlabs.yaml`)
**Capability**: High-quality TTS with voice customization
**Primary Use**: Coach feedback audio, lesson narration, translation audio
**Tool Contracts**:
- `tts.speak({text, voice, language, prosody})` → `{audioUrl, duration, format}`
- `voice.clone({sample, name})` → `{voiceId, quality}`
- `voice.list({language, gender})` → `{voices, metadata}`

**Required Env**: `ELEVENLABS_API_KEY`
**Health Check**: `https://api.elevenlabs.io/v1/voices`

#### Windsor (`windsor.yaml`)
**Capability**: AI voiceover quality assessment
**Primary Use**: TTS quality control, voice evaluation
**Tool Contracts**:
- `qa.voice({audioUrl, criteria})` → `{score, issues, recommendations}`
- `evaluate.tone({audio, targetTone})` → `{match, suggestions}`
- `assess.pace({audio, targetPace})` → `{pace, adjustments}`

**Required Env**: `WINDSOR_API_KEY`
**Health Check**: Custom endpoint

### Content & Data Services

#### Neon (`neon.yaml`)
**Capability**: Primary PostgreSQL database
**Primary Use**: User data, lessons, progress, analytics
**Tool Contracts**:
- `sql.query({query, params})` → `{results, metadata}`
- `migrations.run({version, direction})` → `{status, changes}`
- `backup.create({scope, format})` → `{backupId, url}`

**Required Env**: `NEON_DATABASE_URL`, `NEON_POOLER_URL`
**Health Check**: `https://console.neon.tech/api/v2/projects`

#### Supabase (`supabase.yaml`)
**Capability**: Auth, storage, and realtime services
**Primary Use**: Authentication, file storage, real-time updates
**Tool Contracts**:
- `auth.user({action, data})` → `{user, token, status}`
- `storage.upload({file, bucket})` → `{url, metadata}`
- `realtime.publish({channel, event})` → `{status, subscribers}`

**Required Env**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
**Health Check**: `https://api.supabase.com/v1/projects`

#### Berry RAG (`berry-rag.yaml`)
**Capability**: RAG system for content search and recommendations
**Primary Use**: Lesson search, content recommendations, knowledge retrieval
**Tool Contracts**:
- `rag.query({query, context, filters})` → `{results, relevance, sources}`
- `rag.ingest({content, metadata})` → `{embeddingId, status}`
- `rag.recommend({user, context})` → `{recommendations, scores}`

**Required Env**: `BERRY_RAG_API_KEY`
**Health Check**: Custom endpoint

### Content Management

#### Notion (`notion.yaml`)
**Capability**: Writer workspace for lesson specifications
**Primary Use**: Content creation, lesson planning, team collaboration
**Tool Contracts**:
- `page.get({pageId, fields})` → `{content, metadata, blocks}`
- `db.query({databaseId, filter})` → `{results, pagination}`
- `page.create({parent, content})` → `{pageId, url}`

**Required Env**: `NOTION_TOKEN`, `NOTION_DATABASE_ID`
**Health Check**: `https://api.notion.com/v1/users/me`

#### Firecrawl (`firecrawl.yaml`)
**Capability**: Web content extraction and crawling
**Primary Use**: External content ingestion, web scraping
**Tool Contracts**:
- `crawl.fetch({url, options})` → `{content, metadata, links}`
- `crawl.extract({url, schema})` → `{structuredData, confidence}`
- `crawl.batch({urls, options})` → `{results, errors}`

**Required Env**: `FIRECRAWL_API_KEY`
**Health Check**: `https://api.firecrawl.dev/health`

#### Perplexity (`perplexity.yaml`)
**Capability**: Research and information gathering
**Primary Use**: Content enrichment, background research
**Tool Contracts**:
- `research.query({question, context})` → `{answer, sources, confidence}`
- `research.summarize({topic, depth})` → `{summary, keyPoints}`
- `research.factcheck({claim, sources})` → `{verdict, evidence}`

**Required Env**: `PERPLEXITY_API_KEY`
**Health Check**: Custom endpoint

### Development & Quality Assurance

#### GitHub (`github.yaml`)
**Capability**: Version control and PR management
**Primary Use**: Content PR creation, code review, CI/CD
**Tool Contracts**:
- `pr.create({title, body, files})` → `{prNumber, url, status}`
- `review.comment({prNumber, comment})` → `{commentId, status}`
- `repo.status({branch, checks})` → `{status, details}`

**Required Env**: `GITHUB_TOKEN`, `GITHUB_APP_ID`, `GITHUB_PRIVATE_KEY`
**Health Check**: `https://api.github.com/user`

#### Playwright (`playwright.yaml`)
**Capability**: End-to-end testing automation
**Primary Use**: Smoke tests, user flow validation
**Tool Contracts**:
- `test.run({suite, environment})` → `{results, coverage, artifacts}`
- `test.smoke({flows, browsers})` → `{passed, failed, details}`
- `test.performance({urls, metrics})` → `{metrics, recommendations}`

**Required Env**: `PLAYWRIGHT_BASE_URL`
**Health Check**: Custom endpoint

#### Chrome DevTools (`chrome-devtools.yaml`)
**Capability**: Performance monitoring and debugging
**Primary Use**: Core Web Vitals, performance analysis
**Tool Contracts**:
- `lcp.measure({url, iterations})` → `{lcp, metrics, recommendations}`
- `trace.start({url, categories})` → `{traceId, status}`
- `trace.stop({traceId})` → `{trace, analysis}`

**Required Env**: None (uses Chrome DevTools Protocol)
**Health Check**: Custom endpoint

#### PPL ModelContext (`ppl-modelcontext.yaml`)
**Capability**: MCP specification validation
**Primary Use**: Schema validation, workflow verification
**Tool Contracts**:
- `schema.validate({schema, data})` → `{valid, errors, warnings}`
- `workflow.verify({workflow, context})` → `{valid, issues, suggestions}`
- `spec.check({spec, version})` → `{compatible, issues}`

**Required Env**: None
**Health Check**: Custom endpoint

### Business & Growth Services

#### Stripe (`stripe.yaml`)
**Capability**: Payment processing and subscription management
**Primary Use**: Billing, subscriptions, payment webhooks
**Tool Contracts**:
- `checkout.create({priceId, customerId})` → `{sessionId, url}`
- `customer.portal({customerId})` → `{url, expires}`
- `subscription.get({subscriptionId})` → `{subscription, status}`

**Required Env**: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
**Health Check**: `https://api.stripe.com/v1/charges`

#### Intercom (`fast-intercom.yaml`)
**Capability**: Customer support and user journey tracking
**Primary Use**: Support tickets, user tagging, engagement tracking
**Tool Contracts**:
- `intercom.event({userId, event, data})` → `{eventId, status}`
- `intercom.user.tag({userId, tags})` → `{tagged, status}`
- `intercom.ticket.create({userId, message})` → `{ticketId, status}`

**Required Env**: `INTERCOM_TOKEN`, `INTERCOM_APP_ID`
**Health Check**: `https://api.intercom.io/me`

#### Asana (`asana.yaml`)
**Capability**: Project management and task tracking
**Primary Use**: Content team coordination, task management
**Tool Contracts**:
- `task.create({name, project, assignee})` → `{taskId, url}`
- `project.add({name, team, template})` → `{projectId, url}`
- `task.update({taskId, updates})` → `{status, changes}`

**Required Env**: `ASANA_TOKEN`, `ASANA_WORKSPACE_ID`
**Health Check**: Custom endpoint

#### Zapier (`zapier.yaml`)
**Capability**: Workflow automation and integrations
**Primary Use**: RevOps automation, lead management, notifications
**Tool Contracts**:
- `zapier.trigger({zapId, data})` → `{executionId, status}`
- `zapier.webhook({url, data})` → `{response, status}`
- `zapier.log({event, data})` → `{logged, timestamp}`

**Required Env**: `ZAPIER_HOOK_URL`, `ZAPIER_WEBHOOK_SECRET`
**Health Check**: Custom endpoint

### Marketing & Creative Services

#### Adobe Express (`adobe-express.yaml`)
**Capability**: Marketing creative generation
**Primary Use**: Social media assets, course promos, marketing materials
**Tool Contracts**:
- `asset.generate({prompt, size, style})` → `{assetUrl, metadata}`
- `template.create({type, content})` → `{templateId, url}`
- `brand.apply({asset, brand})` → `{brandedAsset, changes}`

**Required Env**: `ADOBE_EXPRESS_TOKEN`, `ADOBE_EXPRESS_CLIENT_ID`, `ADOBE_EXPRESS_CLIENT_SECRET`
**Health Check**: Custom endpoint

#### V0 (`v0.yaml`)
**Capability**: UI component generation and scaffolding
**Primary Use**: UI drafts, component generation, design system
**Tool Contracts**:
- `ui.generate({prompt, framework})` → `{components, code, preview}`
- `ui.scan({url, criteria})` → `{issues, suggestions, score}`
- `ui.optimize({component, metrics})` → `{optimized, improvements}`

**Required Env**: `V0_API_KEY`
**Health Check**: Custom endpoint

### Monitoring & Observability

#### Sentry (`sentry.yaml`)
**Capability**: Error tracking and performance monitoring
**Primary Use**: Error monitoring, performance tracking, release management
**Tool Contracts**:
- `event.capture({error, context})` → `{eventId, status}`
- `release.create({version, environment})` → `{releaseId, url}`
- `performance.track({metric, value})` → `{tracked, timestamp}`

**Required Env**: `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
**Health Check**: `https://sentry.io/api/0/organizations`

#### GlobalPing (`globalping.yaml`)
**Capability**: Global latency and connectivity monitoring
**Primary Use**: Service health monitoring, latency tracking
**Tool Contracts**:
- `latency.check({endpoints, regions})` → `{latencies, status}`
- `connectivity.test({url, regions})` → `{results, issues}`
- `health.monitor({services, interval})` → `{status, alerts}`

**Required Env**: `GLOBALPING_API_KEY`
**Health Check**: Custom endpoint

### Utility Services

#### Backup (`backup.yaml`)
**Capability**: Data backup and snapshot management
**Primary Use**: Content backups, disaster recovery, data export
**Tool Contracts**:
- `backup.snapshot({scope, format})` → `{backupId, url, size}`
- `backup.restore({backupId, target})` → `{status, progress}`
- `backup.list({scope, limit})` → `{backups, metadata}`

**Required Env**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
**Health Check**: Custom endpoint

#### Context7 (`context7.yaml`)
**Capability**: Context management and memory
**Primary Use**: Long-term memory, context summarization
**Tool Contracts**:
- `ctx.summarise({content, context})` → `{summary, keyPoints}`
- `ctx.retrieve({query, context})` → `{results, relevance}`
- `ctx.store({content, metadata})` → `{stored, id}`

**Required Env**: `CONTEXT7_API_KEY`
**Health Check**: Custom endpoint

#### Integration App (`integration-app.yaml`)
**Capability**: Bridge to internal adapters
**Primary Use**: BFF tasks, queue management, internal services
**Tool Contracts**:
- `bff.task({task, data})` → `{result, status}`
- `queue.process({queue, job})` → `{processed, result}`
- `adapter.call({service, method, params})` → `{result, metadata}`

**Required Env**: `INTEGRATION_APP_TOKEN`
**Health Check**: Custom endpoint

#### HF Space (`hfspace.yaml`)
**Capability**: Model demonstrations and prototyping
**Primary Use**: Pronunciation scoring, model testing
**Tool Contracts**:
- `model.demo({model, input})` → `{output, metadata}`
- `pronunciation.score({audio, text})` → `{score, feedback}`
- `model.test({model, dataset})` → `{results, metrics}`

**Required Env**: `HFSPACE_API_KEY`
**Health Check**: Custom endpoint

#### Backlog (`backlog.yaml`)
**Capability**: Lightweight issue tracking
**Primary Use**: Content defects, bug tracking
**Tool Contracts**:
- `issue.create({title, description, priority})` → `{issueId, url}`
- `issue.tag({issueId, tags})` → `{tagged, status}`
- `issue.list({filter, status})` → `{issues, pagination}`

**Required Env**: `BACKLOG_API_KEY`
**Health Check**: Custom endpoint

#### Adobe Commerce (`adobe-commerce.yaml`)
**Capability**: E-commerce platform integration
**Primary Use**: Learning packs, merchandise sales
**Tool Contracts**:
- `catalog.list({category, filters})` → `{products, pagination}`
- `order.get({orderId})` → `{order, status, items}`
- `cart.manage({action, items})` → `{cart, total}`

**Required Env**: `ADOBE_COMMERCE_API_KEY`
**Health Check**: Custom endpoint

## Tool Contract Specifications

### Standard Input/Output Formats

#### LLM Tool Contract
```typescript
interface LLMInput {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  context?: object;
}

interface LLMOutput {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}
```

#### TTS Tool Contract
```typescript
interface TTSInput {
  text: string;
  voice: string;
  language: string;
  prosody?: {
    rate?: number;
    pitch?: number;
    volume?: number;
  };
}

interface TTSOutput {
  audioUrl: string;
  duration: number;
  format: string;
  metadata: {
    voice: string;
    language: string;
    quality: number;
  };
}
```

#### Database Tool Contract
```typescript
interface DBInput {
  query: string;
  params?: any[];
  transaction?: boolean;
}

interface DBOutput {
  results: any[];
  rowCount: number;
  executionTime: number;
  metadata: {
    query: string;
    params: any[];
  };
}
```

## Environment Variable Requirements

### Critical Services (Must Have)
- `NEON_DATABASE_URL` - Primary database
- `SUPABASE_URL` - Auth and storage
- `SUPABASE_ANON_KEY` - Client access
- `OPENROUTER_API_KEY` - Primary LLM gateway
- `ELEVENLABS_API_KEY` - TTS service
- `SENTRY_DSN` - Error tracking

### Important Services (Should Have)
- `GEMINI_API_KEY` - Multimodal LLM
- `DEEPSEEK_API_KEY` - Reasoning LLM
- `STRIPE_SECRET_KEY` - Payment processing
- `GITHUB_TOKEN` - Version control
- `NOTION_TOKEN` - Content management

### Optional Services (Nice to Have)
- `QWEN_MAX_API_KEY` - Long context LLM
- `GROK_API_KEY` - Web-aware LLM
- `MINIMAX_API_KEY` - Fast paraphrasing
- `PERPLEXITY_API_KEY` - Research
- `FIRECRAWL_API_KEY` - Web crawling

## Health Check Status

### Server Status Definitions
- **OK**: Service is healthy and responding normally
- **DEGRADED**: Service is responding but with reduced functionality
- **DOWN**: Service is not responding or returning errors
- **UNKNOWN**: Service status cannot be determined

### Critical Server Thresholds
- **Response Time**: < 5 seconds for critical services
- **Error Rate**: < 1% for critical services
- **Availability**: > 99.9% for critical services

### Fallback Strategies
- **OpenRouter Down**: Fallback to Gemini or local STT
- **ElevenLabs Down**: Text-only feedback mode
- **Neon Down**: Read-only mode with cached data
- **Supabase Down**: Local auth fallback
- **Sentry Down**: Local error logging

## Integration Patterns

### Workflow Integration
Each server is integrated into workflows through standardized tool contracts that provide:
- Consistent input/output formats
- Error handling and fallback mechanisms
- Performance monitoring and metrics
- Security and authentication

### Service Dependencies
- **Bilingual Coach**: Requires STT, NLU, MT, TTS, and persistence services
- **Lesson Ingest**: Requires content fetching, validation, enrichment, and storage
- **Content QA**: Requires schema validation, pedagogy linting, and accessibility checks
- **Billing**: Requires payment processing, user management, and notification services

### Data Flow Patterns
- **Synchronous**: Real-time user interactions (coach, translate)
- **Asynchronous**: Background processing (content ingest, analytics)
- **Event-driven**: Webhook processing (billing, support)
- **Batch**: Scheduled tasks (backups, cleanup)