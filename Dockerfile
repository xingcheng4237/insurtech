# Multi-stage build for Insurtech News Tracker
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy patches directory if it exists
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy patches
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy necessary runtime files
COPY drizzle ./drizzle
COPY scripts ./scripts

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["pnpm", "start"]
