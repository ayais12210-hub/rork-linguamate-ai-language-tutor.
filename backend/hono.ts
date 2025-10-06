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

// Enable CORS with production allowlist
const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map(o => o.trim()).filter(Boolean);
const isDev = process.env.NODE_ENV === "development";

app.use("*", cors({
  origin: (origin) => {
    // Development: allow all origins if no CORS_ORIGIN is set
    if (isDev && allowedOrigins.length === 0) {
      return origin ?? "*";
    }
    
    // Production: strict allowlist
    if (!origin) {
      // Allow same-origin requests (no Origin header)
      return null;
    }
    
    // Check if origin is in allowlist
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return origin;
    }
    
    // Reject unknown origins
    return null;
  },
  allowHeaders: ["Content-Type", "Authorization", "x-correlation-id", "x-session-id"],
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