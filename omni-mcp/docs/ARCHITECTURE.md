# Linguamate.ai Architecture Documentation

## System Overview

Linguamate.ai is a comprehensive language learning platform powered by AI, built with a microservices architecture using MCP (Model Context Protocol) orchestration. The system provides bilingual coaching, instant translation, content management, and growth automation capabilities.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Linguamate.ai Platform                   │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Applications                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Web App   │  │   iOS App   │  │ Android App │             │
│  │  (React)    │  │  (Expo RN)  │  │  (Expo RN)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  Backend Services                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   BFF API   │  │   Auth API   │  │  Content API│             │
│  │  (Hono)     │  │ (Supabase)   │  │   (tRPC)    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  MCP Orchestration Layer                                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                omni-mcp/                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │ Workflows   │  │   Servers    │  │  Schemas    │         │ │
│  │  │   (YAML)    │  │   (YAML)    │  │  (JSON)     │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  External Services & AI Providers                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   LLM APIs  │  │  Speech APIs │  │  Content APIs│            │
│  │ (OpenRouter │  │(ElevenLabs)  │  │  (Notion)   │            │
│  │  Gemini)    │  │             │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Core Workflows

### 1. Bilingual Coach Workflow
**Purpose**: AI-powered speech coaching with STT→NLU→MT→TTS pipeline

```
User Input (Audio/Text)
    ↓
┌─────────────────────────────────────────────────────────────┐
│                    STT Processing                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ OpenRouter  │  │   Gemini    │  │ Integration │         │
│  │    STT      │  │    STT      │  │    App      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                 NLU Analysis                                │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ OpenRouter  │  │ DeepSeek R1 │                          │
│  │    LLM      │  │  Reasoning  │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Translation                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Gemini    │  │   Minimax   │  │ OpenRouter  │         │
│  │     MT      │  │     MT      │  │     MT      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Feedback Generation                          │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ DeepSeek R1 │  │  Qwen Max   │                          │
│  │  Reasoning  │  │ Long Context│                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                    TTS Output                               │
│  ┌─────────────┐                                           │
│  │ ElevenLabs  │                                           │
│  │    TTS      │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Data Persistence                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Neon     │  │  Supabase   │  │   Sentry    │         │
│  │ PostgreSQL  │  │   Realtime  │  │  Telemetry  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 2. Instant Translate Workflow
**Purpose**: Real-time translation with auto-detection and TTS

```
User Text Input
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Language Detection                           │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ OpenRouter  │  │   Gemini    │                          │
│  │ Detection   │  │ Detection   │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Translation                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Gemini    │  │   Minimax   │  │ OpenRouter  │         │
│  │     MT      │  │     MT      │  │     MT      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                    TTS Output                               │
│  ┌─────────────┐                                           │
│  │ ElevenLabs  │                                           │
│  │    TTS      │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Analytics Logging                            │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │    Neon     │  │  Supabase   │                          │
│  │ PostgreSQL  │  │   Events    │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### 3. Lesson Ingest Workflow
**Purpose**: Automated content ingestion from Notion and web sources

```
Content Source (Notion/Web)
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Content Fetching                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │   Notion    │  │  Firecrawl  │                          │
│  │    API      │  │    Crawl    │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Content Normalization                        │
│  ┌─────────────┐                                           │
│  │  Qwen Max   │                                           │
│  │ Long Context│                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Schema Validation                            │
│  ┌─────────────┐                                           │
│  │ PPL Model   │                                           │
│  │  Context    │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                Content Enrichment                           │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ Perplexity  │  │    Grok     │                          │
│  │  Research   │  │ Web-aware   │                          │
│  └─────────────┘  └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                RAG Ingestion                               │
│  ┌─────────────┐                                           │
│  │ Berry RAG   │                                           │
│  │  Embeddings │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│                PR Creation                                  │
│  ┌─────────────┐                                           │
│  │   GitHub    │                                           │
│  │     PR      │                                           │
│  └─────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### User Data Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Mobile    │    │    Web      │    │   Desktop   │
│    App      │    │    App      │    │    App      │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌─────────────┐
                    │   BFF API   │
                    │   (Hono)    │
                    └─────────────┘
                           │
                    ┌─────────────┐
                    │ MCP Router  │
                    │ Orchestrator│
                    └─────────────┘
                           │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Workflow  │    │   Workflow  │    │   Workflow  │
│   Engine    │    │   Engine    │    │   Engine    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Content Data Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Notion    │    │   Web      │    │   Manual    │
│   Content   │    │  Crawling  │    │   Upload    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌─────────────┐
                    │   Ingest    │
                    │  Workflow   │
                    └─────────────┘
                           │
                    ┌─────────────┐
                    │ Validation  │
                    │   Engine    │
                    └─────────────┘
                           │
                    ┌─────────────┐
                    │   Content   │
                    │   Store     │
                    │  (Neon DB)  │
                    └─────────────┘
```

## Technology Stack

### Frontend
- **Web**: React + TypeScript + Vite
- **Mobile**: Expo React Native + TypeScript
- **State Management**: Zustand
- **UI Components**: NativeBase / Tamagui
- **Styling**: Styled Components

### Backend
- **API Gateway**: Hono (BFF)
- **API Layer**: tRPC
- **Authentication**: Supabase Auth
- **Database**: Neon PostgreSQL
- **Realtime**: Supabase Realtime
- **File Storage**: Supabase Storage

### MCP Orchestration
- **Orchestrator**: Custom TypeScript orchestrator
- **Workflows**: YAML-based workflow definitions
- **Schemas**: JSON Schema validation
- **Health Monitoring**: Custom health check system

### AI & ML Services
- **LLM Gateway**: OpenRouter
- **Reasoning**: DeepSeek R1
- **Long Context**: Qwen Max
- **Multimodal**: Google Gemini
- **Fast Paraphrasing**: Minimax
- **Web-aware**: Grok
- **TTS**: ElevenLabs
- **STT**: OpenRouter/Gemini/Integration App

### External Integrations
- **Content**: Notion, Firecrawl
- **Support**: Intercom
- **Project Management**: Asana
- **Version Control**: GitHub
- **Payments**: Stripe
- **Analytics**: Sentry, Mixpanel
- **Marketing**: Adobe Express
- **Automation**: Zapier

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Prometheus
- **Logging**: Pino
- **Caching**: Redis

## Security Architecture

### Authentication & Authorization
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Supabase  │    │   Backend   │
│    App      │    │    Auth     │    │   Services  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Login Request  │                   │
       ├─────────────────►│                   │
       │                   │                   │
       │ 2. JWT Token     │                   │
       │◄─────────────────┤                   │
       │                   │                   │
       │ 3. API Request    │                   │
       │    + JWT          │                   │
       ├───────────────────┼─────────────────►│
       │                   │                   │
       │ 4. Validated      │                   │
       │    Response       │                   │
       │◄──────────────────┼───────────────────┤
```

### Data Protection
- **Encryption at Rest**: AES-256 for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **PII Redaction**: Automatic redaction in logs and analytics
- **Data Retention**: Configurable retention policies
- **Access Control**: Role-based access control (RBAC)

## Monitoring & Observability

### Metrics Collection
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Application │    │   Sentry     │    │ Prometheus  │
│   Metrics   │───►│   Errors    │───►│   Metrics   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Custom    │    │   Health    │    │   Alerts    │
│   Metrics   │    │   Checks    │    │   System    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Health Monitoring
- **Server Health**: Automated health checks for all MCP servers
- **Performance Metrics**: Response times, throughput, error rates
- **Business Metrics**: User engagement, conversion rates, learning progress
- **Infrastructure Metrics**: CPU, memory, disk, network usage

## Deployment Architecture

### Environment Strategy
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│Development  │    │   Staging   │    │ Production  │
│Environment  │    │ Environment │    │ Environment │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   │                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Local     │    │   Preview   │    │   Live      │
│   Testing   │    │   Testing   │    │   Users     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### CI/CD Pipeline
1. **Code Quality**: TypeScript checking, linting, formatting
2. **Testing**: Unit tests, integration tests, E2E tests
3. **Security**: Vulnerability scanning, dependency audit
4. **Build**: Docker image creation, artifact generation
5. **Deploy**: Staging deployment, production deployment
6. **Monitor**: Health checks, performance monitoring

## Scalability Considerations

### Horizontal Scaling
- **Stateless Services**: All services designed to be stateless
- **Load Balancing**: Multiple instances behind load balancers
- **Database Sharding**: Horizontal partitioning for large datasets
- **CDN**: Global content delivery for static assets

### Performance Optimization
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: Database connection optimization
- **Async Processing**: Background job processing
- **Resource Optimization**: Efficient memory and CPU usage

## Disaster Recovery

### Backup Strategy
- **Database Backups**: Automated daily backups with point-in-time recovery
- **Content Backups**: Regular snapshots of user-generated content
- **Configuration Backups**: Version-controlled configuration management
- **Cross-Region Replication**: Multi-region deployment for high availability

### Recovery Procedures
- **RTO (Recovery Time Objective)**: < 1 hour for critical services
- **RPO (Recovery Point Objective)**: < 15 minutes for data loss
- **Automated Failover**: Automatic failover to backup systems
- **Manual Recovery**: Documented procedures for manual recovery

## Future Architecture Considerations

### Planned Enhancements
- **Microservices Migration**: Gradual migration to microservices architecture
- **Event-Driven Architecture**: Implementation of event sourcing and CQRS
- **AI/ML Pipeline**: Dedicated ML pipeline for model training and deployment
- **Edge Computing**: Edge deployment for reduced latency
- **Multi-Tenancy**: Support for enterprise customers with isolated environments

### Technology Evolution
- **WebAssembly**: Client-side processing for performance-critical operations
- **GraphQL**: Potential migration from tRPC to GraphQL
- **Service Mesh**: Istio implementation for service-to-service communication
- **GitOps**: Git-based deployment and configuration management