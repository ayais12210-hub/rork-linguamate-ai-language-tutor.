# Backend Development Plan

**Project:** Linguamate AI Tutor Backend Hardening  
**Date:** 2025-10-06  
**Status:** In Progress

---

## Plan Overview

This document outlines a prioritized roadmap for hardening the Linguamate backend, organized into **NOW** (P0 - critical), **NEXT** (P1 - required for scale), and **LATER** (P2 - nice to have).

**Total Estimated Effort:** 40-80 hours (2-4 sprint cycles)

---

## NOW (P0 - Critical for Production)

**Timeline:** Week 1 (8-12 hours)  
**Goal:** Make backend production-ready and secure

### 1. CORS Hardening

**Priority:** P0 (HIGH)  
**Effort:** 30 minutes  
**Status:** ⏳ Pending

**Problem:**
- CORS currently allows all origins (`origin: "*"`)
- Vulnerable to CSRF and XSS attacks from malicious sites
- Credentials enabled with wildcard origin is dangerous

**Solution:**
```typescript
// backend/hono.ts
const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim());

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return null; // Reject requests with no origin
    if (allowedOrigins.includes("*")) return origin; // Dev mode only
    if (allowedOrigins.includes(origin)) return origin;
    return null; // Reject unknown origins
  },
  credentials: true,
}));
```

**Environment Variable:**
```bash
# .env
CORS_ORIGIN=https://app.linguamate.com,https://www.linguamate.com
```

**Acceptance Criteria:**
- [x] CORS reads from `CORS_ORIGIN` env var
- [x] Rejects origins not in allowlist
- [x] Allows origins in allowlist
- [x] Documented in BE-ARCH.md
- [ ] Tested with cURL from allowed/denied origins

**Testing:**
```bash
# Allowed origin
curl -H "Origin: https://app.linguamate.com" \
  http://localhost:8080/api/

# Denied origin
curl -H "Origin: https://evil.com" \
  http://localhost:8080/api/
# Should not return Access-Control-Allow-Origin header
```

---

### 2. Database Integration

**Priority:** P0 (CRITICAL)  
**Effort:** 4-6 hours  
**Status:** ⏳ Pending

**Problem:**
- Users/sessions stored in-memory (`Map` objects)
- Data lost on server restart
- No persistence, no scalability

**Solution:** Integrate PostgreSQL with Prisma ORM

**Tasks:**
1. **Install Dependencies** (10 minutes)
   ```bash
   npm install prisma @prisma/client
   npm install -D prisma
   npx prisma init
   ```

2. **Define Schema** (1 hour)
   ```prisma
   // prisma/schema.prisma
   model User {
     id            String   @id @default(uuid())
     email         String   @unique
     passwordHash  String
     name          String
     nativeLanguage String?
     targetLanguage String?
     proficiencyLevel String?
     isPremium     Boolean  @default(false)
     createdAt     DateTime @default(now())
     updatedAt     DateTime @updatedAt
     sessions      Session[]
   }

   model Session {
     id          String   @id @default(uuid())
     userId      String
     refreshToken String  @unique
     expiresAt   DateTime
     createdAt   DateTime @default(now())
     user        User     @relation(fields: [userId], references: [id])
   }
   ```

3. **Run Migrations** (10 minutes)
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Replace Mock Storage** (2-3 hours)
   ```typescript
   // lib/db.ts
   import { PrismaClient } from '@prisma/client';
   export const prisma = new PrismaClient();

   // backend/trpc/routes/auth/auth.ts
   import { prisma } from '@/lib/db';

   // Replace Map-based storage
   const user = await prisma.user.create({
     data: {
       email: sanitizedEmail,
       passwordHash: await hashPassword(sanitizedPassword),
       name: input.name,
     },
   });
   ```

5. **Connection Pooling** (30 minutes)
   ```typescript
   // lib/db.ts
   export const prisma = new PrismaClient({
     log: ['query', 'error', 'warn'],
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   }).$extends({
     query: {
       $allOperations: async ({ operation, model, args, query }) => {
         const start = Date.now();
         const result = await query(args);
         const duration = Date.now() - start;
         logger.debug({ operation, model, duration }, 'Database query');
         return result;
       },
     },
   });
   ```

6. **Test Auth Flow** (1 hour)
   - Test signup: creates user in DB
   - Test login: finds user, verifies password
   - Test logout: deletes session
   - Test refreshToken: validates and rotates token

**Acceptance Criteria:**
- [ ] Prisma schema defined and migrated
- [ ] Users persisted to PostgreSQL
- [ ] Sessions persisted to PostgreSQL
- [ ] Auth flow works end-to-end
- [ ] Connection pooling configured
- [ ] Database health check in /health endpoint

---

### 3. Password Hashing (bcrypt)

**Priority:** P0 (HIGH)  
**Effort:** 30 minutes  
**Status:** ⏳ Pending

**Problem:**
- Passwords hashed with simple XOR-like algorithm
- Trivially crackable with rainbow tables
- No salt, no cost factor

**Solution:** Use bcrypt with cost factor 10

**Tasks:**
1. **Install bcrypt** (2 minutes)
   ```bash
   npm install bcrypt @types/bcrypt
   ```

2. **Replace Hash Functions** (10 minutes)
   ```typescript
   // backend/trpc/routes/auth/auth.ts
   import bcrypt from 'bcrypt';

   const hashPassword = async (password: string): Promise<string> => {
     return await bcrypt.hash(password, 10); // Cost factor 10
   };

   const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
     return await bcrypt.compare(password, hash);
   };
   ```

3. **Migrate Existing Users** (N/A for now, no real users)

4. **Test** (10 minutes)
   - Test signup: password hashed with bcrypt
   - Test login: bcrypt.compare succeeds with correct password
   - Test login: bcrypt.compare fails with incorrect password

**Acceptance Criteria:**
- [ ] bcrypt installed
- [ ] hashPassword uses bcrypt.hash()
- [ ] verifyPassword uses bcrypt.compare()
- [ ] Tests pass (signup, login with correct/incorrect password)

---

### 4. Request Timeouts

**Priority:** P1 (MEDIUM)  
**Effort:** 1 hour  
**Status:** ⏳ Pending

**Problem:**
- No global timeout on requests
- External API calls can hang indefinitely
- Risk of resource exhaustion, DoS

**Solution:** Add global timeout middleware + per-request timeouts

**Tasks:**
1. **Global Timeout Middleware** (30 minutes)
   ```typescript
   // backend/middleware/timeout.ts
   import type { Context, Next } from 'hono';

   export function timeoutMiddleware(timeoutMs: number = 30000) {
     return async (c: Context, next: Next) => {
       const timeoutPromise = new Promise((_, reject) => {
         setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
       });

       try {
         await Promise.race([next(), timeoutPromise]);
       } catch (error) {
         if (error instanceof Error && error.message === 'Request timeout') {
           c.status(408 as any);
           return c.json({ error: 'Request timeout' }, 408);
         }
         throw error;
       }
     };
   }

   // backend/hono.ts
   import { timeoutMiddleware } from './middleware/timeout';
   app.use('*', timeoutMiddleware(30000)); // 30s global timeout
   ```

2. **Per-Request Timeout** (30 minutes)
   ```typescript
   // backend/routes/toolkitProxy.ts
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 30000);

   const res = await fetch(url, {
     signal: controller.signal,
     ...init,
   }).finally(() => clearTimeout(timeout));
   ```

3. **Test** (10 minutes)
   - Test slow request (31s) → 408 timeout
   - Test fast request (1s) → 200 OK
   - Test upstream timeout (fetch aborted) → 503

**Acceptance Criteria:**
- [ ] Global timeout middleware added (30s)
- [ ] External fetch calls have AbortController timeout
- [ ] Tests pass (timeout, normal, upstream timeout)
- [ ] Timeout logged with correlation ID

---

## NEXT (P1 - Required for Scale)

**Timeline:** Week 2 (16-20 hours)  
**Goal:** Scalability, observability, and comprehensive testing

### 5. Backend Test Suite

**Priority:** P1 (HIGH)  
**Effort:** 6-8 hours  
**Status:** ⏳ Pending

**Problem:**
- Only 3 test files (rate limiting, validation, STT)
- No tests for auth, user, lessons, chat, analytics
- Current coverage: ~40% | Target: 80%

**Solution:** Add comprehensive integration tests

**Tasks:**

#### Auth Tests (2 hours)
```typescript
// backend/__tests__/auth.test.ts
describe('auth router', () => {
  describe('auth.login', () => {
    it('should return tokens with valid credentials', async () => {
      const caller = appRouter.createCaller({ req: mockReq(), userId: null, sessionId: null });
      const result = await caller.auth.login({ email: 'test@example.com', password: 'password123' });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UNAUTHORIZED with invalid email', async () => {
      const caller = appRouter.createCaller({ req: mockReq(), userId: null, sessionId: null });
      await expect(caller.auth.login({ email: 'wrong@example.com', password: 'password123' }))
        .rejects.toThrow('UNAUTHORIZED');
    });

    it('should throw TOO_MANY_REQUESTS when rate limited', async () => {
      const caller = appRouter.createCaller({ req: mockReq(), userId: null, sessionId: null });
      // Make 61 requests
      for (let i = 0; i < 61; i++) {
        try {
          await caller.auth.login({ email: 'test@example.com', password: 'wrong' });
        } catch {}
      }
      await expect(caller.auth.login({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow('TOO_MANY_REQUESTS');
    });
  });

  // Similar tests for signup, logout, refreshToken
});
```

#### Protected Procedure Tests (1 hour)
```typescript
// backend/__tests__/user.test.ts
describe('user router', () => {
  it('should return user profile when authenticated', async () => {
    const caller = appRouter.createCaller({ req: mockReq(), userId: 'user-123', sessionId: 'session-123' });
    const result = await caller.user.get();
    expect(result).toHaveProperty('id', 'user-123');
  });

  it('should throw UNAUTHORIZED when not authenticated', async () => {
    const caller = appRouter.createCaller({ req: mockReq(), userId: null, sessionId: null });
    await expect(caller.user.get()).rejects.toThrow('UNAUTHORIZED');
  });
});
```

#### Validation Error Tests (1 hour)
```typescript
// backend/__tests__/validation.integration.test.ts
describe('input validation', () => {
  it('should throw BAD_REQUEST with missing required field', async () => {
    const caller = appRouter.createCaller({ req: mockReq(), userId: 'user-123', sessionId: 'session-123' });
    await expect(caller.lessons.getById({ id: '' })) // Missing ID
      .rejects.toThrow('BAD_REQUEST');
  });

  it('should throw BAD_REQUEST with invalid UUID', async () => {
    const caller = appRouter.createCaller({ req: mockReq(), userId: 'user-123', sessionId: 'session-123' });
    await expect(caller.lessons.getById({ id: 'not-a-uuid' }))
      .rejects.toThrow('BAD_REQUEST');
  });
});
```

#### Upstream Failure Tests (1 hour)
```typescript
// backend/__tests__/toolkit.proxy.test.ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('toolkit proxy', () => {
  it('should retry 2x on upstream 500 error', async () => {
    let attempts = 0;
    server.use(
      http.post('https://toolkit.rork.com/text/llm/', () => {
        attempts++;
        if (attempts < 3) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json({ text: 'Success' });
      })
    );

    const res = await fetch('http://localhost:8080/api/toolkit/text/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });

    expect(attempts).toBe(3);
    expect(res.status).toBe(200);
  });

  it('should return 503 after 2 retries fail', async () => {
    server.use(
      http.post('https://toolkit.rork.com/text/llm/', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const res = await fetch('http://localhost:8080/api/toolkit/text/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });

    expect(res.status).toBe(503);
  });
});
```

#### Security Tests (2 hours)
```typescript
// backend/__tests__/security.test.ts
describe('JWT security', () => {
  it('should reject JWT with tampered signature', () => {
    const token = signJwt({ sub: 'user-123', expInSec: 900 });
    const [header, payload, signature] = token.split('.');
    const tamperedToken = `${header}.${payload}.${signature}abc`;
    const result = verifyJwt(tamperedToken);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('BAD_SIGNATURE');
  });

  it('should reject expired JWT', () => {
    jest.useFakeTimers();
    const token = signJwt({ sub: 'user-123', expInSec: 1 });
    jest.advanceTimersByTime(2000); // 2 seconds later
    const result = verifyJwt(token);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TOKEN_EXPIRED');
    jest.useRealTimers();
  });
});

describe('XSS sanitization', () => {
  it('should remove script tags from HTML', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const output = sanitiseHTML(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('<p>Hello</p>');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(1)">Click me</div>';
    const output = sanitiseHTML(input);
    expect(output).not.toContain('onclick');
  });
});
```

**Acceptance Criteria:**
- [ ] Auth tests: login, signup, logout (happy + error paths)
- [ ] Protected procedure tests: user.get, lessons.getAll
- [ ] Validation tests: missing fields, invalid types
- [ ] Upstream tests: toolkit retry, failure, rate limit
- [ ] Security tests: JWT tampering, expiration, XSS
- [ ] Coverage >= 80% for backend/

---

### 6. Distributed Rate Limiting (Redis)

**Priority:** P1 (MEDIUM)  
**Effort:** 4 hours  
**Status:** ⏳ Pending

**Problem:**
- Current rate limiting is in-memory only
- Not synchronized across multiple instances
- Lost on server restart

**Solution:** Use Upstash Redis for distributed rate limiting

**Tasks:**
1. **Install Upstash Redis** (10 minutes)
   ```bash
   npm install @upstash/redis
   ```

2. **Configure Redis Client** (20 minutes)
   ```typescript
   // lib/redis.ts
   import { Redis } from '@upstash/redis';

   export const redis = new Redis({
     url: process.env.UPSTASH_REDIS_URL,
     token: process.env.UPSTASH_REDIS_TOKEN,
   });
   ```

3. **Replace In-Memory Rate Limit** (2 hours)
   ```typescript
   // backend/middleware/rateLimit.ts
   import { redis } from '@/lib/redis';

   export function rateLimit({ windowMs = 60_000, max = 30 }: RateLimitOptions = {}) {
     return async (c: Context, next: Next) => {
       const ip = c.req.header('x-forwarded-for') ?? 'local';
       const route = new URL(c.req.url).pathname;
       const key = `rate:${ip}:${route}`;

       const count = await redis.incr(key);
       if (count === 1) {
         await redis.expire(key, Math.ceil(windowMs / 1000));
       }

       if (count > max) {
         const ttl = await redis.ttl(key);
         c.header('X-RateLimit-Limit', String(max));
         c.header('X-RateLimit-Remaining', '0');
         c.header('X-RateLimit-Reset', String(ttl));
         return c.json({ error: 'Rate limit exceeded', retryAfter: ttl }, 429);
       }

       c.header('X-RateLimit-Limit', String(max));
       c.header('X-RateLimit-Remaining', String(max - count));
       await next();
     };
   }
   ```

4. **Test Across Instances** (1 hour)
   ```bash
   # Start 2 instances
   PORT=8080 npm run backend:dev &
   PORT=8081 npm run backend:dev &

   # Make 30 requests to instance 1
   for i in {1..30}; do curl http://localhost:8080/api/; done

   # 31st request to instance 2 should be rate limited
   curl http://localhost:8081/api/
   # Expected: 429 Rate limit exceeded
   ```

5. **Add Redis Health Check** (30 minutes)
   ```typescript
   // backend/routes/health.ts
   import { redis } from '@/lib/redis';

   app.get('/health', async (c) => {
     const dependencies = {
       redis: 'unknown',
       // Add more dependencies later
     };

     try {
       await redis.ping();
       dependencies.redis = 'ok';
     } catch (error) {
       dependencies.redis = 'error';
     }

     const status = Object.values(dependencies).every(s => s === 'ok') ? 'ok' : 'degraded';

     return c.json({
       status,
       dependencies,
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       env: process.env.NODE_ENV,
     });
   });
   ```

**Acceptance Criteria:**
- [ ] Upstash Redis configured
- [ ] Rate limiting uses Redis (not in-memory)
- [ ] Rate limits persist across instances
- [ ] Redis health check in /health endpoint
- [ ] Tests pass (multi-instance rate limiting)

---

### 7. Health Endpoint Enhancement

**Priority:** P1 (MEDIUM)  
**Effort:** 2 hours  
**Status:** ⏳ Pending

**Solution:**
```typescript
// backend/routes/health.ts
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

app.get('/health', async (c) => {
  const dependencies: Record<string, string> = {
    database: 'unknown',
    redis: 'unknown',
    toolkit: 'unknown',
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    dependencies.database = 'ok';
  } catch (error) {
    dependencies.database = 'error';
  }

  // Check Redis
  try {
    await redis.ping();
    dependencies.redis = 'ok';
  } catch (error) {
    dependencies.redis = 'error';
  }

  // Check Toolkit API
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_TOOLKIT_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    dependencies.toolkit = res.ok ? 'ok' : 'error';
  } catch (error) {
    dependencies.toolkit = 'error';
  }

  const status = Object.values(dependencies).every(s => s === 'ok') ? 'ok' : 'degraded';
  const statusCode = status === 'ok' ? 200 : 503;

  return c.json({
    status,
    version: process.env.GIT_COMMIT_SHA || '1.0.0',
    buildSha: process.env.GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
    dependencies,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  }, statusCode);
});
```

**Acceptance Criteria:**
- [ ] Health endpoint checks database connectivity
- [ ] Health endpoint checks Redis connectivity
- [ ] Health endpoint checks external API status
- [ ] Returns 503 if any dependency is down
- [ ] Includes build SHA and version

---

### 8. Backend Scripts

**Priority:** P1 (LOW)  
**Effort:** 1 hour  
**Status:** ⏳ Pending

**Solution:**
```json
// package.json
{
  "scripts": {
    "backend:dev": "bun run --watch backend/hono.ts",
    "backend:build": "tsc --project tsconfig.backend.json --outDir dist/backend",
    "backend:test": "jest --testPathPattern=backend --passWithNoTests",
    "backend:test:watch": "jest --testPathPattern=backend --watch",
    "backend:test:coverage": "jest --testPathPattern=backend --coverage",
    "backend:typecheck": "tsc --project tsconfig.backend.json --noEmit",
    "backend:lint": "eslint backend/ --ext .ts --max-warnings=0"
  }
}
```

**Create `tsconfig.backend.json`:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/backend",
    "rootDir": "./backend"
  },
  "include": ["backend/**/*.ts"],
  "exclude": ["backend/**/*.test.ts"]
}
```

**Acceptance Criteria:**
- [ ] `backend:dev` starts backend in watch mode
- [ ] `backend:build` compiles backend to dist/
- [ ] `backend:test` runs backend tests only
- [ ] `backend:typecheck` checks backend types only
- [ ] `backend:lint` lints backend code only

---

### 9. Circuit Breaker

**Priority:** P2 (LOW)  
**Effort:** 3 hours  
**Status:** ⏳ Pending

**Solution:** Use `opossum` circuit breaker library

**Tasks:**
1. **Install opossum** (2 minutes)
   ```bash
   npm install opossum @types/opossum
   ```

2. **Wrap External Calls** (2 hours)
   ```typescript
   // lib/circuit-breaker.ts
   import CircuitBreaker from 'opossum';

   const options = {
     timeout: 30000, // 30s
     errorThresholdPercentage: 50, // Open after 50% errors
     resetTimeout: 30000, // Try again after 30s
   };

   export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
     fn: T,
     fallback?: (...args: Parameters<T>) => Promise<ReturnType<T>>
   ): CircuitBreaker<Parameters<T>, Awaited<ReturnType<T>>> {
     const breaker = new CircuitBreaker(fn, options);
     if (fallback) {
       breaker.fallback(fallback);
     }
     return breaker;
   }

   // backend/routes/toolkitProxy.ts
   import { createCircuitBreaker } from '@/lib/circuit-breaker';

   const toolkitFetch = createCircuitBreaker(
     async (url: string, init: RequestInit) => fetch(url, init),
     async () => {
       // Fallback: return cached response or error
       return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
         status: 503,
       });
     }
   );

   // Use breaker instead of fetch
   const res = await toolkitFetch(url, { method: 'POST', headers, body });
   ```

3. **Test Circuit Breaker** (1 hour)
   - Test closed state: requests pass through
   - Test open state (after 5 failures): returns fallback
   - Test half-open state (after reset timeout): allows 1 request

**Acceptance Criteria:**
- [ ] Circuit breaker wraps external API calls
- [ ] Opens after 50% error rate
- [ ] Returns fallback response when open
- [ ] Resets to half-open after 30s
- [ ] Tests pass (closed, open, half-open)

---

## LATER (P2 - Nice to Have)

**Timeline:** Week 3+ (16-24 hours)  
**Goal:** Polish, optimization, advanced features

### 10. OpenAPI / tRPC Docs

**Priority:** P2 (LOW)  
**Effort:** 4 hours  
**Status:** ⏳ Pending

**Solution:** Generate tRPC docs with `@trpc/docs`

```bash
npm install @trpc/docs
```

```typescript
// backend/hono.ts
import { renderTrpcPanel } from '@trpc/docs';

app.get('/docs', (c) => {
  return c.html(
    renderTrpcPanel({
      endpoint: '/api/trpc',
      router: appRouter,
    })
  );
});
```

**Acceptance Criteria:**
- [ ] tRPC docs available at /api/docs
- [ ] All procedures documented
- [ ] Interactive playground works

---

### 11. Prometheus Metrics

**Priority:** P2 (LOW)  
**Effort:** 4 hours  
**Status:** ⏳ Pending

**Solution:** Export Prometheus metrics

```bash
npm install prom-client
```

```typescript
// backend/middleware/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Register();
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestCount = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export function metricsMiddleware() {
  return async (c: Context, next: Next) => {
    const start = Date.now();
    await next();
    const duration = (Date.now() - start) / 1000;
    const route = c.req.routePath || c.req.path;
    httpRequestDuration.observe({ method: c.req.method, route, status: c.res.status }, duration);
    httpRequestCount.inc({ method: c.req.method, route, status: c.res.status });
  };
}

// Metrics endpoint
app.get('/metrics', async (c) => {
  return c.text(await register.metrics());
});
```

**Acceptance Criteria:**
- [ ] Metrics endpoint at /metrics
- [ ] Request duration histogram
- [ ] Request count counter
- [ ] Error rate counter
- [ ] Grafana dashboard configured

---

### 12. Caching Layer (Redis)

**Priority:** P2 (LOW)  
**Effort:** 6 hours  
**Status:** ⏳ Pending

**Solution:** Implement Redis caching for hot data

```typescript
// lib/cache.ts
import { redis } from './redis';

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await fn();
  await redis.setex(key, ttlSeconds, JSON.stringify(result));
  return result;
}

// Usage in tRPC procedures
export const getLessonsProcedure = protectedProcedure.query(async ({ ctx }) => {
  return withCache(`lessons:${ctx.userId}`, 300, async () => {
    // Fetch from database
    return await prisma.lesson.findMany({ where: { userId: ctx.userId } });
  });
});
```

**Acceptance Criteria:**
- [ ] Cache utility implemented
- [ ] Hot data cached (lessons, user profile)
- [ ] Cache invalidation on updates
- [ ] Cache hit/miss metrics

---

### 13. Account Lockout

**Priority:** P2 (LOW)  
**Effort:** 2 hours  
**Status:** ⏳ Pending

**Solution:** Lock account after 5 failed login attempts

```typescript
// backend/trpc/routes/auth/auth.ts
export const loginProcedure = publicProcedure
  .input(SignInSchema)
  .mutation(async ({ input }) => {
    const lockKey = `lockout:${input.email}`;
    const attempts = await redis.get(lockKey);

    if (attempts && parseInt(attempts) >= 5) {
      const ttl = await redis.ttl(lockKey);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Account locked. Try again in ${ttl} seconds.`,
      });
    }

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const isValid = user && await verifyPassword(input.password, user.passwordHash);

    if (!isValid) {
      await redis.incr(lockKey);
      await redis.expire(lockKey, 1800); // 30 minutes
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    // Reset attempts on successful login
    await redis.del(lockKey);

    // Return tokens...
  });
```

**Acceptance Criteria:**
- [ ] Account locked after 5 failed attempts
- [ ] Lockout lasts 30 minutes
- [ ] Lockout reset on successful login
- [ ] Email sent on lockout (optional)

---

### 14. Graceful Shutdown

**Priority:** P2 (LOW)  
**Effort:** 2 hours  
**Status:** ⏳ Pending

**Solution:** Drain connections on SIGTERM

```typescript
// backend/server.ts
import app from './hono';

const server = Bun.serve({
  fetch: app.fetch,
  port: process.env.PORT || 8080,
});

let isShuttingDown = false;

process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('SIGTERM received, shutting down gracefully...');

  // Stop accepting new requests
  server.stop();

  // Wait for active requests to finish (max 10s)
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Close database connections
  await prisma.$disconnect();

  console.log('Shutdown complete');
  process.exit(0);
});
```

**Acceptance Criteria:**
- [ ] Server stops accepting new requests on SIGTERM
- [ ] Active requests allowed to finish (max 10s)
- [ ] Database connections closed
- [ ] Graceful shutdown tested

---

## Summary

| Phase  | Tasks | Effort   | Priority | Status |
|--------|-------|----------|----------|--------|
| **NOW**   | 4     | 8-12h    | P0       | ⏳ Pending |
| **NEXT**  | 5     | 16-20h   | P1       | ⏳ Pending |
| **LATER** | 5     | 16-24h   | P2       | ⏳ Pending |

**Total:** 40-56 hours (2-3 sprint cycles)

**Recommended Timeline:**
- **Week 1:** NOW (P0) - CORS, Database, Password, Timeouts
- **Week 2:** NEXT (P1) - Tests, Redis, Health, Scripts, Circuit Breaker
- **Week 3+:** LATER (P2) - Docs, Metrics, Caching, Lockout, Shutdown

---

**Plan Owner:** Backend Team  
**Last Updated:** 2025-10-06  
**Next Review:** After P0 items complete
