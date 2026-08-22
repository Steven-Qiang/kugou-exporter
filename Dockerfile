# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy all source code
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build (web + launcher)
RUN pnpm build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy node_modules + built output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/pnpm-lock.yaml .
COPY --from=builder /app/apps/launcher/dist ./apps/launcher/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Expose port
EXPOSE 3000

# Create volume for data (SQLite)
VOLUME ["/app/data"]

# Set environment variables
ENV KUGOU_DB_PATH=/app/data/kugou.db

# Start the application
CMD ["node", "apps/launcher/dist/index.cjs"]
