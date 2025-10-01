import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes (dev-friendly)
app.use("*", cors({
  origin: (origin) => origin ?? "*",
  allowHeaders: ["Content-Type", "Authorization"],
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
      info: "/api/info"
    }
  });
});

export default app;