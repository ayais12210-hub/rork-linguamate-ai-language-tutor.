import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";
import { correlationMiddleware } from "@/backend/middleware/correlation";
import { requestLoggerMiddleware } from "@/backend/middleware/requestLogger";
import { securityHeadersMiddleware } from "@/backend/middleware/securityHeaders";
import { rateLimit } from "@/backend/middleware/rateLimit";
import { errorHandlerMiddleware } from "@/backend/middleware/errorHandler";
import ingestLogsApp from "@/backend/routes/ingestLogs";
import healthApp from "@/backend/routes/health";
import toolkitProxy from "@/backend/routes/toolkitProxy";
import sttApp from "@/backend/routes/stt";

// app will be mounted at /api
const app = new Hono();

// Global middleware (order matters!)
app.use("*", errorHandlerMiddleware); // Error handling first
app.use("*", correlationMiddleware);
app.use("*", securityHeadersMiddleware);
app.use("*", requestLoggerMiddleware);

// CORS configuration with production security
const getAllowedOrigins = (): string[] => {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin === "*") {
    // Only allow wildcard in development
    if (process.env.NODE_ENV === "production") {
      console.warn("WARNING: CORS_ORIGIN=* in production is insecure");
      return ["https://linguamate.app", "https://www.linguamate.app"];
    }
    return ["*"];
  }
  return corsOrigin ? corsOrigin.split(",").map(o => o.trim()) : [
    "http://localhost:3000",
    "http://localhost:8081", 
    "https://linguamate.app",
    "https://www.linguamate.app"
  ];
};

app.use("*", cors({
  origin: (origin) => {
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes("*")) return origin ?? "*";
    return allowedOrigins.includes(origin || "") ? origin : null;
  },
  allowHeaders: ["Content-Type", "Authorization", "x-correlation-id", "x-session-id"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Rate limiting for tRPC endpoints (more restrictive for auth endpoints)
app.use("/trpc/auth.*", rateLimit({ windowMs: 60_000, max: 10 })); // 10 auth requests per minute
app.use("/trpc/*", rateLimit({ windowMs: 60_000, max: 100 })); // 100 requests per minute for other tRPC

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