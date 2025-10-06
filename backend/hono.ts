import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";
import { correlationMiddleware } from "@/backend/middleware/correlation";
import { requestLoggerMiddleware } from "@/backend/middleware/requestLogger";
import { securityHeadersMiddleware } from "@/backend/middleware/securityHeaders";
import ingestLogsApp from "@/backend/routes/ingestLogs";
import healthApp from "@/backend/routes/health";
import toolkitProxy from "@/backend/routes/toolkitProxy";
import sttApp from "@/backend/routes/stt";

// app will be mounted at /api
const app = new Hono();

// Global middleware
app.use("*", correlationMiddleware);
app.use("*", securityHeadersMiddleware);
app.use("*", requestLoggerMiddleware);

// Enable CORS for all routes
// In production, restrict to an allow-list specified via ALLOWED_ORIGINS (comma-separated)
const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return isProd ? false : "*";
    if (!isProd) return origin;
    return allowedOrigins.includes(origin) ? origin : false;
  },
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "x-correlation-id",
    "x-session-id",
  ],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
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
    environment: process.env.NODE_ENV || "development",
    buildSha: process.env.GIT_SHA || null,
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

// Centralized error handling and 404 mapping
app.onError((err, c) => {
  const correlationId = c.get("correlationId");
  const status = 500;
  return c.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
      correlationId,
    },
    status as any
  );
});

app.notFound((c) =>
  c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    },
    404 as any
  )
);

export default app;