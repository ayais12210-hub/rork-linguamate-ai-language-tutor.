# MCP Orchestrator - Complete System Documentation

## 🏗️ Architecture Overview

The MCP Orchestrator is a comprehensive, production-grade system for managing Micro-Capability Providers (MCPs) and AI agents. It provides a complete ecosystem for workflow automation, agent coordination, monitoring, and extensibility.

## 🧩 Core Components

### 1. **Workflow Engine** (`workflow-engine.ts`)
- **Purpose**: Execute complex multi-step workflows with conditional logic
- **Features**:
  - Parallel and sequential step processing
  - Variable interpolation and context management
  - Retry mechanisms with exponential backoff
  - Comprehensive error handling and monitoring
  - Step dependencies and conditional execution

**Example Usage**:
```typescript
const result = await workflowEngine.executeWorkflow('bilingual-coach', {
  userId: 'user123',
  targetLanguage: 'es',
  audioData: 'base64encoded...'
}, { userId: 'user123' });
```

### 2. **Tool Registry** (`tool-registry.ts`)
- **Purpose**: Dynamic tool discovery, registration, and execution
- **Features**:
  - Provider abstraction and fallback mechanisms
  - Tool execution with context and security validation
  - Performance metrics and health monitoring
  - Capability-based tool discovery

**Example Usage**:
```typescript
await toolRegistry.registerTool('stt.transcribe', 'openrouter', {
  metadata: { name: 'stt.transcribe', provider: 'openrouter' },
  capabilities: [{ name: 'transcribe', inputTypes: ['audio'] }],
  execute: async (input) => ({ text: 'transcribed text' }),
  healthCheck: async () => true,
  validate: (input) => ({ valid: true, errors: [] })
});

const result = await toolRegistry.executeTool('stt.transcribe', 'openrouter', {
  audioData: 'base64encoded...',
  language: 'en'
});
```

### 3. **Agent Communication Protocol** (`agent-communication.ts`)
- **Purpose**: Inter-agent messaging, task distribution, and coordination
- **Features**:
  - Priority-based message queues
  - Task assignment and acknowledgment
  - Message TTL and expiration handling
  - Broadcast and direct communication

**Example Usage**:
```typescript
await agentCommunication.sendMessage(
  'client-001',
  'manager-001',
  'execute_workflow',
  { workflowName: 'bilingual-coach', payload: { userId: 'user123' } },
  { priority: 'high', correlationId: 'req-123' }
);

const taskId = await agentCommunication.createTask(
  'workflow_execution',
  'Execute bilingual coach workflow',
  { workflowName: 'bilingual-coach', payload: { userId: 'user123' } }
);
```

### 4. **Configuration Management** (`config-manager.ts`)
- **Purpose**: Dynamic feature flags, environment-specific configs, and real-time updates
- **Features**:
  - Feature flags with rollout percentages
  - File watching and hot reloading
  - Environment-specific configurations
  - Comprehensive validation and metadata

**Example Usage**:
```typescript
// Set feature flag
configManager.setFeatureFlag('LM_COACH_REASONING_MODEL', true, {
  rolloutPercentage: 50,
  targetUsers: ['user123', 'user456']
});

// Get feature flag
const enabled = configManager.getFeatureFlag('LM_COACH_REASONING_MODEL', {
  userId: 'user123'
});

// Set configuration value
configManager.setConfigValue('workflows', 'bilingual-coach', {
  maxConcurrency: 10,
  timeout: 300000,
  retries: 3
});
```

### 5. **Security Framework** (`security-manager.ts`)
- **Purpose**: Authentication, authorization, audit logging, and data encryption
- **Features**:
  - Role-based access control (RBAC)
  - User authentication and session management
  - Comprehensive audit logging
  - Data encryption and PII protection

**Example Usage**:
```typescript
// Authenticate user
const authResult = await securityManager.authenticate(
  { userId: 'user123' },
  { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
);

// Check permission
const hasPermission = await securityManager.checkPermission(
  'user123',
  'workflow',
  'execute',
  { workflowName: 'bilingual-coach' }
);

// Get audit events
const events = securityManager.getAuditEvents({
  userId: 'user123',
  action: 'authenticate',
  startDate: new Date('2024-01-01'),
  limit: 100
});
```

### 6. **Agent Orchestration** (`agent-orchestrator.ts`)
- **Purpose**: Multi-agent task distribution, performance monitoring, and load balancing
- **Features**:
  - Agent registration and status management
  - Task distribution with dependency resolution
  - Performance metrics and load balancing
  - Workflow execution with agent coordination

**Example Usage**:
```typescript
// Register agent
await agentOrchestrator.registerAgent({
  id: 'manager-001',
  name: 'Workflow Manager',
  type: 'manager',
  capabilities: ['workflow_execution', 'task_distribution'],
  maxConcurrency: 5,
  priority: 'high'
});

// Execute workflow with agents
const result = await agentOrchestrator.executeWorkflow('bilingual-coach', {
  workflowId: 'bilingual-coach',
  executionId: 'exec-123',
  userId: 'user123'
});
```

### 7. **Testing Framework** (`testing-framework.ts`)
- **Purpose**: Comprehensive testing utilities with mocks, scenarios, and reporting
- **Features**:
  - Mock tools and agents with configurable responses
  - Test scenario execution with setup/teardown
  - Integration testing utilities
  - Performance and reliability testing

**Example Usage**:
```typescript
// Create mock tool
testingFramework.createMockTool({
  name: 'stt.transcribe',
  provider: 'openrouter',
  responses: [{
    input: { audioData: 'test-audio', language: 'en' },
    output: { text: 'Hello world', confidence: 0.95 },
    delay: 100
  }],
  defaultResponse: { text: 'Mock transcription', confidence: 0.9 }
});

// Run test scenario
const result = await testingFramework.runTestScenario({
  name: 'Workflow Integration Test',
  steps: [{
    action: 'execute_workflow',
    input: { workflowName: 'bilingual-coach', payload: { userId: 'test-user' } },
    expectedOutput: { status: 'completed' }
  }]
});
```

### 8. **Monitoring System** (`monitoring-system.ts`)
- **Purpose**: Advanced metrics, tracing, alerting, and health checks
- **Features**:
  - Metrics collection (counters, gauges, histograms)
  - Distributed tracing with spans
  - Alert management with conditions and actions
  - Health check monitoring

**Example Usage**:
```typescript
// Record metrics
monitoringSystem.recordMetric('workflow_executions', 1, 'counter', {
  workflow: 'bilingual-coach',
  status: 'success'
});

// Start trace
const traceId = monitoringSystem.startTrace('workflow_execution', {
  userId: 'user123',
  workflowId: 'bilingual-coach'
});

// Add span
const spanId = monitoringSystem.addSpan(traceId, 'stt_transcription', {
  tool: 'stt.transcribe',
  provider: 'openrouter'
});

// Finish span and trace
monitoringSystem.finishSpan(traceId, spanId);
monitoringSystem.finishTrace(traceId, 'success');
```

## 🚀 Advanced Components

### 9. **Plugin Architecture** (`plugin-manager.ts`)
- **Purpose**: Dynamic plugin loading and management system
- **Features**:
  - Plugin discovery and dependency resolution
  - Dynamic capability registration
  - Event hooks and route handlers
  - Hot reloading and version management

**Example Plugin**:
```json
{
  "name": "advanced-analytics",
  "version": "1.0.0",
  "capabilities": [
    {
      "name": "analytics.dashboard",
      "type": "ui",
      "description": "Analytics dashboard component"
    }
  ],
  "hooks": [
    {
      "event": "workflow:completed",
      "handler": "onWorkflowCompleted",
      "priority": 10
    }
  ],
  "routes": [
    {
      "path": "/analytics/dashboard",
      "method": "GET",
      "handler": "getDashboard"
    }
  ]
}
```

### 10. **Event Sourcing System** (`event-store.ts`)
- **Purpose**: Event-driven architecture with replay capabilities
- **Features**:
  - Event storage and retrieval
  - Snapshot management
  - Event replay and reconstruction
  - Aggregate state management

**Example Usage**:
```typescript
// Append events
await eventStore.appendEvents('workflow:exec-123', 'workflow', [{
  type: 'workflow:started',
  data: { workflowName: 'bilingual-coach', userId: 'user123' },
  metadata: { source: 'workflow-engine' }
}], 0, { source: 'workflow-engine' });

// Get events
const events = await eventStore.getEvents('workflow:exec-123', 0);

// Rebuild aggregate
const aggregate = await eventStore.rebuildAggregate('workflow:exec-123', 'workflow');
```

### 11. **Caching Layer** (`cache-manager.ts`)
- **Purpose**: Redis-based caching with invalidation strategies
- **Features**:
  - Multiple cache strategies
  - Tag-based invalidation
  - Compression and encryption
  - Performance monitoring

**Example Usage**:
```typescript
// Set cache entry
await cacheManager.set('workflow:result', result, {
  ttl: 1800,
  tags: ['workflow', 'result'],
  strategy: 'workflow'
});

// Get cache entry
const cached = await cacheManager.get('workflow:result', { strategy: 'workflow' });

// Invalidate by tags
await cacheManager.invalidateByTags(['workflow']);
```

### 12. **Message Queue System** (`message-queue-manager.ts`)
- **Purpose**: Reliable message processing with dead letter queues
- **Features**:
  - Queue management and configuration
  - Message persistence and delivery guarantees
  - Dead letter queue handling
  - Consumer management

**Example Usage**:
```typescript
// Create queue
await messageQueueManager.createQueue({
  name: 'workflow-events',
  maxSize: 10000,
  visibilityTimeout: 30000,
  deadLetterQueue: 'workflow-events-dlq'
});

// Send message
await messageQueueManager.sendMessage(
  'workflow-events',
  'workflow:completed',
  { workflowId: 'bilingual-coach', result: 'success' },
  { context: { source: 'workflow-engine' } }
);

// Register handler
messageQueueManager.registerHandler('workflow-events', async (message) => {
  console.log('Processing message:', message);
});
```

### 13. **API Gateway** (`api-gateway.ts`)
- **Purpose**: Request routing, rate limiting, and authentication
- **Features**:
  - Route configuration and management
  - Service discovery and load balancing
  - Rate limiting and circuit breakers
  - Middleware pipeline

**Example Usage**:
```typescript
// Register route
await apiGateway.registerRoute({
  path: '/api/workflows/:name/execute',
  method: 'POST',
  target: 'workflow-engine',
  auth: { required: true, scopes: ['workflow:execute'] },
  rateLimit: { requests: 100, window: 60 },
  cache: { enabled: true, ttl: 300 }
});

// Register service
await apiGateway.registerService({
  name: 'workflow-engine',
  baseUrl: 'http://localhost:3001',
  circuitBreaker: { enabled: true, failureThreshold: 5 }
});
```

## 🔧 Integration System

### **MCP Integration System** (`integration-system.ts`)
- **Purpose**: Orchestrates all components into a cohesive system
- **Features**:
  - Component initialization and dependency management
  - Event flow coordination
  - Health monitoring and diagnostics
  - Integration testing

**Example Usage**:
```typescript
const integrationSystem = new MCPIntegrationSystem({
  plugins: { directory: './plugins', enabled: ['advanced-analytics'] },
  eventStore: { maxEventsPerSnapshot: 100 },
  cache: { redis: { host: 'localhost', port: 6379 } },
  messageQueue: { queues: [{ name: 'workflow-events', maxSize: 10000 }] }
}, logger);

await integrationSystem.start();

const result = await integrationSystem.executeWorkflow('bilingual-coach', payload, context);
const health = await integrationSystem.getSystemHealth();
```

## 📊 Monitoring and Observability

### **Health Checks**
- Component health monitoring
- Dependency status tracking
- Performance metrics collection
- Alert management

### **Metrics**
- Request/response times
- Error rates and success rates
- Resource utilization
- Custom business metrics

### **Tracing**
- Distributed request tracing
- Span correlation
- Performance bottleneck identification
- Error root cause analysis

### **Logging**
- Structured logging with context
- Log aggregation and correlation
- Audit trail maintenance
- Security event logging

## 🔒 Security Features

### **Authentication**
- Multi-factor authentication support
- Session management
- Token-based authentication
- OAuth2 integration

### **Authorization**
- Role-based access control
- Permission-based authorization
- Resource-level access control
- API key management

### **Data Protection**
- Encryption at rest and in transit
- PII redaction and anonymization
- Data retention policies
- Compliance reporting

### **Audit Logging**
- Comprehensive audit trails
- Security event monitoring
- Compliance reporting
- Forensic analysis support

## 🧪 Testing and Quality Assurance

### **Unit Testing**
- Component isolation testing
- Mock and stub support
- Test coverage reporting
- Automated test execution

### **Integration Testing**
- End-to-end workflow testing
- Component interaction testing
- Performance testing
- Load testing

### **Mock Framework**
- Tool and agent mocking
- Response simulation
- Error condition testing
- Performance simulation

## 🚀 Deployment and Operations

### **Configuration Management**
- Environment-specific configs
- Feature flag management
- Dynamic configuration updates
- Configuration validation

### **Plugin System**
- Dynamic plugin loading
- Hot reloading support
- Dependency management
- Version compatibility

### **Scaling**
- Horizontal scaling support
- Load balancing
- Auto-scaling capabilities
- Resource optimization

### **Monitoring**
- Real-time health monitoring
- Performance metrics
- Alert management
- Dashboard visualization

## 📈 Performance and Scalability

### **Caching**
- Multi-level caching strategy
- Cache invalidation
- Performance optimization
- Memory management

### **Message Queues**
- Asynchronous processing
- Message persistence
- Dead letter handling
- Consumer scaling

### **Circuit Breakers**
- Failure isolation
- Automatic recovery
- Performance protection
- Graceful degradation

### **Rate Limiting**
- Request throttling
- Burst handling
- User-based limiting
- API protection

## 🔄 Workflow Examples

### **Bilingual Coach Workflow**
```yaml
name: Bilingual Coach Workflow
steps:
  - name: speech_to_text
    tool: stt.transcribe
    provider: openrouter|gemini|integration-app
    input:
      audioData: "${trigger.payload.audioData}"
      language: "${trigger.payload.sourceLanguage}"
  
  - name: natural_language_understanding
    tool: nlu.analyze
    provider: openrouter|deepseek-r1
    input:
      text: "${steps.speech_to_text.output.text}"
      language: "${trigger.payload.sourceLanguage}"
  
  - name: machine_translation
    tool: mt.translate
    provider: gemini|openrouter|minimax
    input:
      text: "${steps.natural_language_understanding.output.text}"
      sourceLanguage: "${trigger.payload.sourceLanguage}"
      targetLanguage: "${trigger.payload.targetLanguage}"
  
  - name: feedback_generation
    tool: feedback.generate
    provider: deepseek-r1|qwen-max
    input:
      originalText: "${steps.speech_to_text.output.text}"
      translatedText: "${steps.machine_translation.output.text}"
      analysis: "${steps.natural_language_understanding.output}"
  
  - name: text_to_speech
    tool: tts.synthesize
    provider: elevenlabs
    input:
      text: "${steps.feedback_generation.output.feedback}"
      voice: "${trigger.payload.targetLanguage}"
```

### **Content QA Workflow**
```yaml
name: Content QA Workflow
trigger:
  event: github.pr.opened
steps:
  - name: schema_validation
    tool: schema.validate
    provider: ppl-modelcontext
    input:
      content: "${trigger.payload.content}"
      schema: "lesson.schema.json"
  
  - name: pedagogical_linting
    tool: lint.pedagogical
    provider: openrouter
    input:
      content: "${trigger.payload.content}"
      rules: "pedagogical-rules.yaml"
  
  - name: accessibility_check
    tool: a11y.scan
    provider: v0
    input:
      content: "${trigger.payload.content}"
      standards: ["WCAG2.1", "ADA"]
  
  - name: voiceover_qa
    tool: qa.voiceover
    provider: windsor
    input:
      content: "${trigger.payload.content}"
      languages: ["en", "es", "fr"]
  
  - name: approval_decision
    tool: decision.approve
    provider: deepseek-r1
    input:
      validationResults: "${steps.schema_validation.output}"
      lintResults: "${steps.pedagogical_linting.output}"
      a11yResults: "${steps.accessibility_check.output}"
      voiceResults: "${steps.voiceover_qa.output}"
```

## 🎯 Best Practices

### **Development**
- Use TypeScript for type safety
- Implement comprehensive error handling
- Write unit and integration tests
- Follow security best practices

### **Deployment**
- Use environment-specific configurations
- Implement health checks and monitoring
- Set up proper logging and alerting
- Plan for disaster recovery

### **Operations**
- Monitor system health continuously
- Implement proper backup strategies
- Use feature flags for gradual rollouts
- Maintain comprehensive documentation

### **Security**
- Implement defense in depth
- Use least privilege principles
- Encrypt sensitive data
- Maintain audit trails

## 📚 API Reference

### **Workflow Engine API**
- `executeWorkflow(name, payload, context)` - Execute a workflow
- `registerWorkflow(definition)` - Register a new workflow
- `getWorkflow(name)` - Get workflow definition
- `getWorkflows()` - List all workflows

### **Tool Registry API**
- `executeTool(name, provider, input, context)` - Execute a tool
- `registerTool(name, provider, tool)` - Register a tool
- `getTool(name, provider)` - Get tool instance
- `getAllTools()` - List all tools

### **Agent Orchestrator API**
- `registerAgent(definition)` - Register an agent
- `updateAgentStatus(id, status, metadata)` - Update agent status
- `executeWorkflow(workflowId, context)` - Execute workflow with agents
- `getAgentMetrics(id?)` - Get agent performance metrics

### **Configuration Manager API**
- `getFeatureFlag(name, context)` - Get feature flag value
- `setFeatureFlag(name, enabled, options)` - Set feature flag
- `getConfigValue(section, key, defaultValue)` - Get config value
- `setConfigValue(section, key, value, options)` - Set config value

### **Monitoring System API**
- `recordMetric(name, value, type, labels, context)` - Record metric
- `createAlert(alert)` - Create alert
- `startTrace(operationName, context)` - Start trace
- `getDashboardData()` - Get dashboard data

## 🚀 Getting Started

### **Installation**
```bash
git clone https://github.com/linguamate-ai/omni-mcp.git
cd omni-mcp
pnpm install
pnpm build
```

### **Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

### **Running**
```bash
pnpm start
# Or for development
pnpm dev
```

### **Testing**
```bash
pnpm test
pnpm test:integration
pnpm test:e2e
```

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