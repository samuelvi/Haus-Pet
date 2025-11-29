# Production image for hauspet_api and hauspet_worker

FROM node:22-slim AS builder

RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/api

# Install dependencies
COPY app/api/package*.json ./
RUN npm ci

# Copy source and build
COPY app/api/ .
RUN npx prisma generate
RUN npm run build

# --- Runtime image ---
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app/api

# Install production deps
COPY app/api/package*.json ./
RUN npm ci --omit=dev

# Prisma client + schema
COPY --from=builder /app/api/node_modules/.prisma ./node_modules/.prisma
COPY app/api/prisma ./prisma
RUN npx prisma generate

# Built artifacts
COPY --from=builder /app/api/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
