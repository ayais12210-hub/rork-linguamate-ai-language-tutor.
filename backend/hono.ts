import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";
import { correlationMiddleware } from "@/backend/middleware/correlation";
import { requestLoggerMiddleware } from "@/backend/middleware/requestLogger";
import { securityHeadersMiddleware } from "@/backend/middleware/securityHeaders";
import { rateLimit } from "@/backend/middleware/rateLimit";
import { timeout } from "@/backend/middleware/timeout";
import { errorHandlerMiddleware } from "@/backend/middleware/errorHandler";
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
app.use("*", errorHandlerMiddleware);

// Enable CORS for all routes with environment-based configuration
const getAllowedOrigins = () => {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin || corsOrigin === "*") {
    // In development, allow all origins
    if (process.env.NODE_ENV === "development") {
      return "*";
    }
    // In production, default to secure origins
    return ["https://linguamate.app", "https://www.linguamate.app"];
  }
  return corsOrigin.split(",").map(origin => origin.trim());
};

app.use("*", cors({
  origin: (origin) => {
    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes("*")) return true;
    return allowedOrigins.includes(origin || "");
  },
  allowHeaders: ["Content-Type", "Authorization", "x-correlation-id", "x-session-id"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

// Apply rate limiting to sensitive tRPC routes
app.use("/trpc/auth/*", rateLimit({ windowMs: 15 * 60 * 1000, max: 5 })); // 5 attempts per 15 minutes for auth
app.use("/trpc/user/*", rateLimit({ windowMs: 60 * 1000, max: 30 })); // 30 requests per minute for user operations
app.use("/trpc/chat/*", rateLimit({ windowMs: 60 * 1000, max: 20 })); // 20 requests per minute for chat
app.use("/trpc/analytics/*", rateLimit({ windowMs: 60 * 1000, max: 50 })); // 50 requests per minute for analytics

// Apply timeout middleware to all tRPC routes
app.use("/trpc/*", timeout({ timeoutMs: 30 * 1000 })); // 30 second timeout

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

// Server startup (only when run directly)
if (import.meta.main) {
  const port = parseInt(process.env.PORT || "8080", 10);
  const host = process.env.HOST || "0.0.0.0";
  
  console.log(`🚀 Starting Linguamate Backend Server`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Server: http://${host}:${port}`);
  console.log(`🔗 Health Check: http://${host}:${port}/api/`);
  console.log(`📊 API Info: http://${host}:${port}/api/info`);
  
  // Start the server
  const server = {
    port,
    hostname: host,
    fetch: app.fetch,
  };
  
  // For Bun runtime
  if (typeof Bun !== "undefined") {
    Bun.serve(server);
  } else {
    // For Node.js runtime (if needed)
    console.log("⚠️  Node.js runtime detected. Consider using Bun for better performance.");
    console.log("   To run with Node.js, you'll need to implement a Node.js server adapter.");
  }
}

export default app;