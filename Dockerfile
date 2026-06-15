FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
# --ignore-scripts: skip better-sqlite3 native compilation (only needed for vitest shim, not production)
RUN bun install --ignore-scripts

COPY . .
# Build React frontend with Vite
RUN bun x vite build

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Only production dependencies (hono + runtime deps); skip devDeps + native compilation
COPY package.json bun.lock ./
RUN bun install --production --ignore-scripts

# Built React app and server source
COPY --from=builder /app/dist ./dist
COPY src ./src

# Data dir for SQLite volume mount
RUN mkdir -p /data

EXPOSE 3000

CMD ["bun", "run", "src/server/index.ts"]
