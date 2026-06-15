FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies (bun:sqlite is built into Bun — no native modules needed for prod)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build React frontend
COPY . .
RUN bun run build

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built assets and server source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Data dir for SQLite volume mount
RUN mkdir -p /data

EXPOSE 3000

CMD ["bun", "run", "src/server/index.ts"]
