# Multi-stage Dockerfile for omni-mcp orchestrator
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/orchestrator/package.json ./apps/orchestrator/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN npm install -g pnpm@latest

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S omni-mcp -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/orchestrator/package.json ./apps/orchestrator/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/apps/orchestrator/dist ./apps/orchestrator/dist

# Copy configuration files
COPY config/ ./config/
COPY servers/ ./servers/

# Create directories for logs and audit
RUN mkdir -p /app/logs /app/audit && \
    chown -R omni-mcp:nodejs /app

# Switch to non-root user
USER omni-mcp

# Expose port
EXPOSE 8787

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8787/healthz').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "apps/orchestrator/dist/index.js"]