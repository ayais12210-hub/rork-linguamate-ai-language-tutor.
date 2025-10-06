# Backend Architecture Documentation

## Overview

The Linguamate AI tutor backend is built with modern, type-safe technologies designed for scalability, security, and maintainability.

## Technology Stack

- **Runtime**: Bun (primary), Node.js (fallback)
- **Framework**: Hono (lightweight, fast HTTP framework)
- **API Layer**: tRPC (type-safe RPC)
- **Validation**: Zod (runtime type validation)
- **Logging**: Pino (high-performance logging)
- **Testing**: Jest (unit testing)
- **TypeScript**: Full type safety

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web App       │    │  External APIs  │
│   (React Native)│    │   (Expo Web)    │    │  (OpenAI, etc.) │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Load Balancer        │
                    │      (Production)         │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Hono Server          │
                    │   (Port 8080/8081)        │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Middleware Stack       │
                    │  ┌─────────────────────┐  │
                    │  │  Correlation ID     │  │
                    │  │  Security Headers   │  │
                    │  │  Request Logging    │  │
                    │  │  Error Handling     │  │
                    │  │  CORS               │  │
                    │  │  Rate Limiting      │  │
                    │  │  Timeout            │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Route Handlers       │
                    │  ┌─────────────────────┐  │
                    │  │  Health Check       │  │
                    │  │  API Info           │  │
                    │  │  Log Ingestion      │  │
                    │  │  STT Processing     │  │
                    │  │  Toolkit Proxy      │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      tRPC Router          │
                    │  ┌─────────────────────┐  │
                    │  │  Auth Procedures    │  │
                    │  │  User Management    │  │
                    │  │  Lessons & Learning │  │
                    │  │  Chat & AI Features │  │
                    │  │  Analytics          │  │
                    │  │  Preferences        │  │
                    │  │  Leaderboard        │  │
                    │  │  Dialogue           │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Business Logic         │
                    │  ┌─────────────────────┐  │
                    │  │  JWT Validation     │  │
                    │  │  Input Sanitization │  │
                    │  │  Rate Limiting      │  │
                    │  │  Error Handling     │  │
                    │  │  Logging            │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    External Services      │
                    │  ┌─────────────────────┐  │
                    │  │  OpenAI API         │  │
                    │  │  Speech Services    │  │
                    │  │  Analytics          │  │
                    │  │  Monitoring         │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
```

## Request Flow

### 1. Request Entry
- Client sends HTTP request to `/api/*` endpoint
- Load balancer (production) or direct connection (development)
- Hono server receives request

### 2. Middleware Processing
Requests pass through middleware in this order:
1. **Correlation ID**: Generates unique request ID for tracing
2. **Security Headers**: Adds security headers (XSS, CSRF, etc.)
3. **Request Logging**: Logs request details with structured logging
4. **Error Handling**: Catches and formats errors
5. **CORS**: Validates and sets CORS headers
6. **Rate Limiting**: Applies rate limits to sensitive routes
7. **Timeout**: Sets request timeout limits

### 3. Route Resolution
- **Health/Info Routes**: Direct Hono handlers
- **tRPC Routes**: `/trpc/*` → tRPC router
- **Other Routes**: Specific route handlers (STT, logging, etc.)

### 4. tRPC Processing
- **Context Creation**: Extracts user ID, session ID from JWT
- **Procedure Execution**: Runs the specific tRPC procedure
- **Input Validation**: Zod schema validation
- **Business Logic**: Executes the actual business logic
- **Output Serialization**: Serializes response with SuperJSON

### 5. Response
- **Error Handling**: Any errors are caught and formatted
- **Logging**: Response is logged with correlation ID
- **Headers**: Security and CORS headers are added
- **Serialization**: Response is serialized and sent

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Access and refresh token system
- **Secret Validation**: Mandatory secure JWT secret
- **Token Verification**: Every protected route validates JWT
- **Session Management**: Session tracking and validation

### Input Validation & Sanitization
- **Zod Schemas**: Runtime type validation for all inputs
- **Input Sanitization**: XSS prevention, HTML sanitization
- **File Upload Validation**: MIME type, size, content validation
- **SQL Injection Prevention**: Parameterized queries (when DB added)

### Rate Limiting & DDoS Protection
- **Per-IP Rate Limiting**: Configurable limits per endpoint
- **Per-User Rate Limiting**: Authenticated user limits
- **Endpoint-Specific Limits**: Different limits for different operations
- **Memory-Based Storage**: In-memory rate limiting (Redis for production)

### CORS & Security Headers
- **Environment-Based CORS**: Different origins for dev/prod
- **Security Headers**: XSS, CSRF, clickjacking protection
- **Content Security Policy**: Prevents code injection
- **HTTPS Enforcement**: HSTS headers in production

## Error Handling

### Error Types
1. **Validation Errors**: Input validation failures (400)
2. **Authentication Errors**: JWT validation failures (401)
3. **Authorization Errors**: Permission denied (403)
4. **Not Found Errors**: Resource not found (404)
5. **Rate Limit Errors**: Too many requests (429)
6. **Timeout Errors**: Request timeout (408)
7. **External API Errors**: Third-party service failures (502)
8. **Internal Errors**: Server errors (500)

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "timestamp": "2024-10-06T21:34:32.807Z",
    "requestId": "req_123456789"
  }
}
```

### Error Logging
- **Structured Logging**: JSON format with correlation IDs
- **Error Categorization**: Security, validation, external API, etc.
- **PII Redaction**: Sensitive data is redacted from logs
- **Error Aggregation**: Errors are grouped and tracked

## Configuration

### Environment Variables
```bash
# Server Configuration
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Security
JWT_SECRET=your-secure-secret-here
CORS_ORIGIN=https://linguamate.app,https://www.linguamate.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_SIGNING_KEY=your-log-signing-key

# External APIs
OPENAI_API_KEY=your-openai-key
TOOLKIT_API_KEY=your-toolkit-key
```

### Development vs Production
- **Development**: Relaxed CORS, verbose logging, no HTTPS
- **Production**: Strict CORS, structured logging, HTTPS enforcement
- **Testing**: Mock external APIs, in-memory storage

## Monitoring & Observability

### Logging
- **Structured Logs**: JSON format with correlation IDs
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Log Categories**: Security, validation, external API, business logic
- **Log Retention**: Configurable retention periods

### Health Checks
- **Basic Health**: `/api/` - Server status
- **Detailed Health**: `/api/info` - Version, endpoints, configuration
- **Dependency Health**: External API connectivity (future)

### Metrics (Future)
- **Request Metrics**: Response times, error rates
- **Business Metrics**: User actions, learning progress
- **System Metrics**: CPU, memory, disk usage

## Testing Strategy

### Unit Tests
- **Middleware Tests**: Rate limiting, validation, error handling
- **Utility Tests**: JWT validation, input sanitization
- **Schema Tests**: Zod validation schemas

### Integration Tests
- **API Tests**: End-to-end request/response testing
- **Security Tests**: CORS, rate limiting, authentication
- **Error Tests**: Error handling and response formatting

### Test Coverage
- **Target Coverage**: 80%+ for backend code
- **Critical Paths**: 95%+ for security and validation
- **External APIs**: Mocked for consistent testing

## Deployment

### Development
```bash
# Install dependencies
bun install

# Start development server
bun run backend:dev

# Run tests
bun run backend:test

# Type check
bun run backend:typecheck
```

### Production
```bash
# Build and start
bun run backend:start

# Health check
curl http://localhost:8080/api/

# API info
curl http://localhost:8080/api/info
```

### Docker (Future)
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY backend/ ./backend/
EXPOSE 8080
CMD ["bun", "run", "backend:start"]
```

## Performance Considerations

### Current Optimizations
- **Bun Runtime**: Fast JavaScript runtime
- **Hono Framework**: Lightweight, fast HTTP framework
- **In-Memory Rate Limiting**: Fast rate limiting (Redis for production)
- **Structured Logging**: Efficient JSON logging

### Future Optimizations
- **Redis Caching**: Cache frequently accessed data
- **Connection Pooling**: Database connection pooling
- **CDN Integration**: Static asset delivery
- **Load Balancing**: Horizontal scaling

## Security Considerations

### Current Security Measures
- **JWT Validation**: Secure token validation
- **Input Sanitization**: XSS and injection prevention
- **Rate Limiting**: DDoS and abuse protection
- **CORS Configuration**: Cross-origin request control
- **Security Headers**: Browser security features

### Future Security Enhancements
- **API Key Management**: Secure API key storage
- **Audit Logging**: Security event logging
- **Penetration Testing**: Regular security assessments
- **Vulnerability Scanning**: Automated security scanning

## Troubleshooting

### Common Issues
1. **JWT Secret Error**: Ensure JWT_SECRET is set and secure
2. **CORS Issues**: Check CORS_ORIGIN configuration
3. **Rate Limiting**: Check rate limit configuration
4. **Timeout Issues**: Check timeout configuration

### Debugging
1. **Check Logs**: Look for error messages in logs
2. **Verify Configuration**: Check environment variables
3. **Test Endpoints**: Use curl to test API endpoints
4. **Check Dependencies**: Ensure all dependencies are installed

### Monitoring
1. **Health Checks**: Monitor `/api/` endpoint
2. **Error Rates**: Monitor error response rates
3. **Response Times**: Monitor API response times
4. **Resource Usage**: Monitor CPU and memory usage