# Multi-stage build for omni-mcp orchestrator
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/orchestrator/package.json ./apps/orchestrator/

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built application
COPY --from=builder /app/apps/orchestrator/dist ./dist
COPY --from=builder /app/apps/orchestrator/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/config ./config
COPY --from=builder /app/servers ./servers

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S omni-mcp -u 1001

# Change ownership
RUN chown -R omni-mcp:nodejs /app

USER omni-mcp

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8787/healthz || exit 1

# Start the application
CMD ["node", "dist/index.js"]