# MCP Orchestrator - Advanced AI Agent System

A comprehensive Micro-Capability Provider (MCP) orchestration system with advanced AI agent coordination, workflow automation, and enterprise-grade monitoring.

## 🚀 Features

### Core Components

- **Workflow Engine**: Execute complex multi-step workflows with conditional logic, parallel execution, and error handling
- **Tool Registry**: Dynamic tool discovery, registration, and execution with provider abstraction
- **Agent Communication**: Inter-agent messaging, task distribution, and coordination protocols
- **Configuration Management**: Dynamic feature flags, environment-specific configs, and real-time updates
- **Security Framework**: Authentication, authorization, audit logging, and data encryption
- **Agent Orchestration**: Multi-agent task distribution, performance monitoring, and load balancing
- **Testing Framework**: Comprehensive testing utilities with mocks, scenarios, and reporting
- **Monitoring System**: Advanced metrics, tracing, alerting, and health checks

### Advanced Capabilities

- **Idempotent Operations**: Safe retry mechanisms with exponential backoff
- **Circuit Breakers**: Automatic failure detection and recovery
- **Rate Limiting**: Configurable request throttling and burst handling
- **Observability**: OpenTelemetry integration with distributed tracing
- **Security**: Role-based access control, PII redaction, and audit trails
- **Scalability**: Horizontal scaling with load balancing and auto-scaling
- **Reliability**: Health checks, graceful degradation, and failover mechanisms

## 📋 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Orchestrator                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Workflow   │  │    Tool     │  │    Agent    │        │
│  │   Engine    │  │  Registry   │  │Orchestrator │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Agent    │  │    Config   │  │  Security   │        │
│  │Communication│  │  Manager    │  │  Manager    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Monitoring  │  │  Testing   │  │   Health    │        │
│  │   System    │  │ Framework  │  │  Checker    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/linguamate-ai/omni-mcp.git
cd omni-mcp

# Install dependencies
pnpm install

# Build the orchestrator
pnpm build

# Start the orchestrator
pnpm start
```

## ⚙️ Configuration

The orchestrator uses a comprehensive configuration system with environment-specific settings and feature flags.

### Environment Variables

```bash
# Core Services
NEON_DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SENTRY_DSN="https://..."

# AI Services
OPENROUTER_API_KEY="..."
GEMINI_API_KEY="..."
QWEN_MAX_API_KEY="..."
DEEPSEEK_API_KEY="..."
GROK_API_KEY="..."
MINIMAX_API_KEY="..."

# Audio Services
ELEVENLABS_API_KEY="..."

# Content Services
FIRECRAWL_API_KEY="..."
PERPLEXITY_API_KEY="..."

# Integrations
GITHUB_TOKEN="..."
INTERCOM_TOKEN="..."
ADOBE_EXPRESS_TOKEN="..."
ASANA_TOKEN="..."
NOTION_TOKEN="..."
ZAPIER_HOOK_URL="..."
V0_API_KEY="..."
WINDSOR_API_KEY="..."

# Security
ENCRYPTION_KEY="..."
STRIPE_SECRET_KEY="..."
```

### Feature Flags

```json
{
  "featureFlags": [
    {
      "name": "LM_COACH_REASONING_MODEL",
      "enabled": true,
      "rolloutPercentage": 50,
      "description": "Use advanced reasoning model for coach feedback"
    }
  ]
}
```

## 🔧 Usage

### Starting the Orchestrator

```bash
# Development mode
pnpm dev

# Production mode
pnpm start

# With custom config
CONFIG_PATH=./custom-config.json pnpm start
```

### API Endpoints

#### Workflows
```bash
# Execute a workflow
POST /workflows/bilingual-coach/execute
{
  "payload": {
    "userId": "user123",
    "sessionId": "session456",
    "targetLanguage": "es",
    "sourceLanguage": "en",
    "audioData": "base64encoded..."
  },
  "context": {
    "userId": "user123",
    "sessionId": "session456"
  }
}

# List workflows
GET /workflows

# Get workflow details
GET /workflows/bilingual-coach
```

#### Tools
```bash
# Execute a tool
POST /tools/stt/transcribe/openrouter
{
  "input": {
    "audioData": "base64encoded...",
    "language": "en"
  },
  "context": {
    "userId": "user123"
  }
}

# List all tools
GET /tools
```

#### Agents
```bash
# List agents
GET /agents

# Get agent details
GET /agents/manager-001

# Update agent status
POST /agents/manager-001/status
{
  "status": "busy",
  "metadata": {
    "currentTask": "workflow-execution"
  }
}
```

#### Configuration
```bash
# Get feature flags
GET /config/feature-flags

# Update feature flag
POST /config/feature-flags/LM_COACH_REASONING_MODEL
{
  "enabled": true,
  "options": {
    "rolloutPercentage": 75
  }
}

# Get configuration sections
GET /config/sections
```

#### Monitoring
```bash
# Get metrics
GET /monitoring/metrics?name=workflow_executions&startTime=2024-01-01&endTime=2024-01-02

# Get alerts
GET /monitoring/alerts

# Get traces
GET /monitoring/traces?operationName=workflow_execution&status=success

# Get dashboard data
GET /monitoring/dashboard
```

#### Testing
```bash
# Run test scenario
POST /testing/scenarios/workflow-integration/run
{
  "name": "Workflow Integration Test",
  "steps": [
    {
      "action": "execute_workflow",
      "input": {
        "workflowName": "bilingual-coach",
        "payload": { "userId": "test-user" }
      },
      "expectedOutput": { "status": "completed" }
    }
  ]
}

# Get test results
GET /testing/results

# Get test statistics
GET /testing/statistics

# Generate test report
GET /testing/report
```

## 🔄 Workflows

### Workflow Definition

```yaml
name: Bilingual Coach Workflow
description: AI-powered speech coaching with STT→NLU→MT→TTS pipeline
version: 1.0.0

trigger:
  event: app.coach.session.start
  payload:
    userId: string
    sessionId: string
    targetLanguage: string
    sourceLanguage: string
    audioData?: string
    textInput?: string

steps:
  - name: speech_to_text
    description: Convert audio to text using STT service
    tool: stt.transcribe
    provider: openrouter|gemini|integration-app
    config:
      fallback: integration-app.stt.local
      timeout: 12000
      language: "${trigger.payload.sourceLanguage}"
    input:
      audioData: "${trigger.payload.audioData}"
      language: "${trigger.payload.sourceLanguage}"
    output:
      text: string
      confidence: number
      segments: array

  - name: natural_language_understanding
    description: Analyze grammar, intent, and language patterns
    tool: nlu.analyze
    provider: openrouter|deepseek-r1
    config:
      model: deepseek-r1
      timeout: 15000
      maxTokens: 2000
    input:
      text: "${steps.speech_to_text.output.text}"
      language: "${trigger.payload.sourceLanguage}"
      context: "language_learning_coaching"
    output:
      intent: string
      grammar: object
      entities: array
      sentiment: string
      confidence: number

guards:
  budget:
    maxMs: 300000
    maxTokens: 10000
    maxCost: 1.00
  security:
    piiRedaction: true
    dataRetention: "90d"
    encryption: true
  fallbacks:
    stt: "integration-app"
    nlu: "openrouter"
    mt: "gemini"
    feedback: "deepseek-r1"
    tts: "text-only"
```

### Workflow Execution

```typescript
// Execute workflow programmatically
const result = await orchestrator.getWorkflowEngine().executeWorkflow(
  'bilingual-coach',
  {
    userId: 'user123',
    sessionId: 'session456',
    targetLanguage: 'es',
    sourceLanguage: 'en',
    audioData: 'base64encoded...'
  },
  {
    userId: 'user123',
    sessionId: 'session456'
  }
);

console.log('Workflow completed:', result.status);
console.log('Duration:', result.duration);
console.log('Steps:', result.steps);
```

## 🤖 Agents

### Agent Types

- **Manager**: Workflow orchestration and task distribution
- **Engineer**: Code generation and technical implementation
- **Tester**: Quality assurance and testing automation
- **Docs**: Documentation generation and maintenance
- **Security**: Security scanning and compliance

### Agent Registration

```typescript
// Register an agent
await orchestrator.getAgentOrchestrator().registerAgent({
  id: 'manager-001',
  name: 'Workflow Manager',
  type: 'manager',
  capabilities: ['workflow_execution', 'task_distribution', 'monitoring'],
  maxConcurrency: 5,
  priority: 'high',
  config: {
    timeout: 300000,
    retries: 3
  },
  metadata: {
    version: '1.0.0',
    environment: 'production'
  }
});
```

### Agent Communication

```typescript
// Send message to agent
await orchestrator.getAgentCommunication().sendMessage(
  'client-001',
  'manager-001',
  'execute_workflow',
  {
    workflowName: 'bilingual-coach',
    payload: { userId: 'user123' }
  },
  {
    priority: 'high',
    correlationId: 'req-123'
  }
);

// Create task for agent
const taskId = await orchestrator.getAgentCommunication().createTask(
  'workflow_execution',
  'Execute bilingual coach workflow',
  {
    workflowName: 'bilingual-coach',
    payload: { userId: 'user123' }
  },
  {
    priority: 'normal',
    deadline: new Date(Date.now() + 300000)
  }
);
```

## 🔧 Tools

### Tool Registration

```typescript
// Register a tool
await orchestrator.getToolRegistry().registerTool(
  'stt.transcribe',
  'openrouter',
  {
    metadata: {
      name: 'stt.transcribe',
      description: 'Speech-to-text transcription',
      version: '1.0.0',
      provider: 'openrouter',
      category: 'ai',
      timeout: 30000,
      retryable: true,
      requiresAuth: true,
      scopes: ['stt:transcribe']
    },
    capabilities: [{
      name: 'transcribe',
      description: 'Convert audio to text',
      inputTypes: ['audio'],
      outputTypes: ['text'],
      supportedProviders: ['openrouter', 'gemini']
    }],
    execute: async (input, context) => {
      // Tool implementation
      return { text: 'transcribed text', confidence: 0.95 };
    },
    healthCheck: async () => true,
    validate: (input) => ({ valid: true, errors: [] })
  }
);
```

### Tool Execution

```typescript
// Execute tool
const result = await orchestrator.getToolRegistry().executeTool(
  'stt.transcribe',
  'openrouter',
  {
    audioData: 'base64encoded...',
    language: 'en'
  },
  {
    userId: 'user123',
    sessionId: 'session456'
  }
);

console.log('Tool result:', result.success);
console.log('Output:', result.output);
console.log('Duration:', result.duration);
```

## 📊 Monitoring

### Metrics

```typescript
// Record metrics
orchestrator.getMonitoringSystem().recordMetric(
  'workflow_executions',
  1,
  'counter',
  { workflow: 'bilingual-coach', status: 'success' },
  { userId: 'user123' }
);

orchestrator.getMonitoringSystem().setGauge(
  'active_sessions',
  42,
  { environment: 'production' }
);

orchestrator.getMonitoringSystem().recordHistogram(
  'workflow_duration',
  1500,
  { workflow: 'bilingual-coach' }
);
```

### Alerts

```typescript
// Create alert
orchestrator.getMonitoringSystem().createAlert({
  id: 'high-error-rate',
  name: 'High Error Rate',
  description: 'Alert when error rate exceeds 5%',
  condition: 'error_rate > 5',
  severity: 'high',
  enabled: true,
  threshold: 5,
  duration: 300, // 5 minutes
  actions: ['log', 'notify', 'webhook'],
  metadata: {
    team: 'platform',
    escalation: 'pagerduty'
  }
});
```

### Tracing

```typescript
// Start trace
const traceId = orchestrator.getMonitoringSystem().startTrace(
  'workflow_execution',
  { userId: 'user123', workflowId: 'bilingual-coach' }
);

// Add span
const spanId = orchestrator.getMonitoringSystem().addSpan(
  traceId,
  'stt_transcription',
  { tool: 'stt.transcribe', provider: 'openrouter' }
);

// Finish span
orchestrator.getMonitoringSystem().finishSpan(traceId, spanId);

// Finish trace
orchestrator.getMonitoringSystem().finishTrace(traceId, 'success');
```

## 🧪 Testing

### Test Scenarios

```typescript
// Define test scenario
const scenario = {
  name: 'Workflow Integration Test',
  description: 'Test complete workflow execution',
  setup: [
    'create_mock_tool stt.transcribe openrouter',
    'create_mock_agent manager-001 Manager',
    'set_feature_flag LM_COACH_REASONING_MODEL true'
  ],
  steps: [
    {
      action: 'execute_workflow',
      input: {
        workflowName: 'bilingual-coach',
        payload: { userId: 'test-user', targetLanguage: 'es' }
      },
      expectedOutput: { status: 'completed' },
      timeout: 30000
    },
    {
      action: 'check_feature_flag',
      input: { name: 'LM_COACH_REASONING_MODEL' },
      expectedOutput: { enabled: true }
    }
  ],
  teardown: [
    'remove_mock_tool stt.transcribe openrouter',
    'remove_mock_agent manager-001',
    'clear_config feature_flags LM_COACH_REASONING_MODEL'
  ]
};

// Run test scenario
const result = await orchestrator.getTestingFramework().runTestScenario(scenario);
console.log('Test passed:', result.passed);
console.log('Duration:', result.duration);
```

### Mock Tools

```typescript
// Create mock tool
orchestrator.getTestingFramework().createMockTool({
  name: 'stt.transcribe',
  provider: 'openrouter',
  responses: [
    {
      input: { audioData: 'test-audio', language: 'en' },
      output: { text: 'Hello world', confidence: 0.95 },
      delay: 100
    }
  ],
  defaultResponse: { text: 'Mock transcription', confidence: 0.9 },
  defaultDelay: 50
});
```

### Mock Agents

```typescript
// Create mock agent
orchestrator.getTestingFramework().createMockAgent({
  id: 'manager-001',
  name: 'Mock Manager',
  capabilities: ['workflow_execution'],
  responses: [
    {
      messageType: 'execute_workflow',
      response: { status: 'completed', duration: 1000 },
      delay: 200
    }
  ],
  defaultResponse: { success: true },
  defaultDelay: 100
});
```

## 🔒 Security

### Authentication

```typescript
// Authenticate user
const authResult = await orchestrator.getSecurityManager().authenticate(
  { userId: 'user123' },
  { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
);

if (authResult.success) {
  console.log('User authenticated:', authResult.user);
  console.log('Session:', authResult.session);
}
```

### Authorization

```typescript
// Check permission
const authResult = await orchestrator.getSecurityManager().checkPermission(
  'user123',
  'workflow',
  'execute',
  { workflowName: 'bilingual-coach' }
);

if (authResult.allowed) {
  console.log('Permission granted');
} else {
  console.log('Permission denied:', authResult.reason);
}
```

### Audit Logging

```typescript
// Get audit events
const events = orchestrator.getSecurityManager().getAuditEvents({
  userId: 'user123',
  action: 'authenticate',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-02'),
  limit: 100
});

console.log('Audit events:', events);
```

## 📈 Performance

### Health Checks

```bash
# Check overall health
GET /healthz

# Check readiness
GET /readyz

# Get server statuses
GET /servers

# Get specific server status
GET /servers/openrouter
```

### Metrics Dashboard

```bash
# Get dashboard data
GET /monitoring/dashboard

# Response:
{
  "metrics": {
    "workflow_executions": { "latest": 150, "trend": 5 },
    "active_sessions": { "latest": 42, "trend": 2 }
  },
  "alerts": {
    "total": 10,
    "firing": 1,
    "resolved": 9
  },
  "traces": {
    "total": 1000,
    "successRate": 98.5,
    "averageDuration": 1250
  },
  "healthChecks": {
    "total": 15,
    "healthy": 14,
    "degraded": 1,
    "unhealthy": 0
  }
}
```

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY config/ ./config/

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-orchestrator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-orchestrator
  template:
    metadata:
      labels:
        app: mcp-orchestrator
    spec:
      containers:
      - name: mcp-orchestrator
        image: linguamate/mcp-orchestrator:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: CONFIG_PATH
          value: "/config/production.json"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

## 📚 API Reference

### Workflow Engine API

- `executeWorkflow(name, payload, context)` - Execute a workflow
- `registerWorkflow(definition)` - Register a new workflow
- `getWorkflow(name)` - Get workflow definition
- `getWorkflows()` - List all workflows

### Tool Registry API

- `executeTool(name, provider, input, context)` - Execute a tool
- `registerTool(name, provider, tool)` - Register a tool
- `getTool(name, provider)` - Get tool instance
- `getAllTools()` - List all tools

### Agent Orchestrator API

- `registerAgent(definition)` - Register an agent
- `updateAgentStatus(id, status, metadata)` - Update agent status
- `executeWorkflow(workflowId, context)` - Execute workflow with agents
- `getAgentMetrics(id?)` - Get agent performance metrics

### Configuration Manager API

- `getFeatureFlag(name, context)` - Get feature flag value
- `setFeatureFlag(name, enabled, options)` - Set feature flag
- `getConfigValue(section, key, defaultValue)` - Get config value
- `setConfigValue(section, key, value, options)` - Set config value

### Monitoring System API

- `recordMetric(name, value, type, labels, context)` - Record metric
- `createAlert(alert)` - Create alert
- `startTrace(operationName, context)` - Start trace
- `getDashboardData()` - Get dashboard data

### Testing Framework API

- `runTestScenario(scenario)` - Run test scenario
- `createMockTool(mockTool)` - Create mock tool
- `createMockAgent(mockAgent)` - Create mock agent
- `getTestResults()` - Get test results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Documentation: [docs.linguamate.ai](https://docs.linguamate.ai)
- Issues: [GitHub Issues](https://github.com/linguamate-ai/omni-mcp/issues)
- Discord: [Linguamate Community](https://discord.gg/linguamate)
- Email: support@linguamate.ai