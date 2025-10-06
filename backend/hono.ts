import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";
import { correlationMiddleware } from "@/backend/middleware/correlation";
import { requestLoggerMiddleware } from "@/backend/middleware/requestLogger";
import { securityHeadersMiddleware } from "@/backend/middleware/securityHeaders";
import { getCorsMiddleware } from "@/backend/middleware/cors";
import { timeout } from "@/backend/middleware/timeout";
import { rateLimit } from "@/backend/middleware/rateLimit";
import { config, getConfig } from "@/backend/config/env";
import { initSentry } from "@/backend/monitoring/sentry";
import ingestLogsApp from "@/backend/routes/ingestLogs";
import healthApp from "@/backend/routes/health";
import toolkitProxy from "@/backend/routes/toolkitProxy";
import sttApp from "@/backend/routes/stt";

// Initialize monitoring
if (getConfig.isProd() && config.SENTRY_DSN) {
  initSentry();
}

// app will be mounted at /api
const app = new Hono();

// Global middleware (order matters!)
app.use("*", correlationMiddleware);
app.use("*", securityHeadersMiddleware);
app.use("*", requestLoggerMiddleware);
app.use("*", timeout({ ms: 30000 })); // 30s global timeout

// Environment-aware CORS
app.use("*", getCorsMiddleware());

// Global rate limiting
app.use("*", rateLimit({
  windowMs: getConfig.rateLimit().windowMs,
  max: getConfig.rateLimit().maxRequests,
}));

// Apply stricter rate limiting to auth endpoints
app.use("/trpc/auth.*", rateLimit({
  windowMs: 60000, // 1 minute
  max: getConfig.rateLimit().maxLoginAttempts,
}));

// Mount tRPC router at /trpc (note: the app itself is mounted under /api by the host)
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext,
  })
);

// Health check endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Language Learning API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API info endpoint
app.get("/info", (c) => {
  return c.json({
    name: "Language Learning Backend",
    version: "1.0.0",
    endpoints: {
      trpc: "/api/trpc",
      health: "/api",
      info: "/api/info",
      ingestLogs: "/api/ingest/logs"
    }
  });
});

// Mount logging routes, toolkit proxy, and STT
app.route("/", ingestLogsApp);
app.route("/", healthApp);
app.route("/", toolkitProxy);
app.route("/", sttApp);

export default app;