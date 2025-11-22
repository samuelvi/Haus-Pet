# Production Deployment Guide

This guide covers strategies for deploying HausPet from development (Docker Compose) to production environments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Deployment Options](#deployment-options)
- [Production-Ready Docker Setup](#production-ready-docker-setup)
- [Environment Variables & Secrets](#environment-variables--secrets)
- [Security Hardening](#security-hardening)
- [Monitoring & Observability](#monitoring--observability)
- [Backup Strategy](#backup-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Pre-Launch Checklist](#pre-launch-checklist)

---

## Architecture Overview

HausPet runs three app containers plus supporting data services. The same stack powers local dev (`docker/docker-compose.yaml`) and the test setup (`docker/docker-compose.test.yaml` with different ports/volumes).

```
┌─────────────────┐
│   hauspet_gui   │ React + Vite (port 5173)
└───────┬─────────┘
        │ proxies /api via nginx (port 80) in dev
┌───────▼─────────┐
│  hauspet_api    │ Express API (port 3000)
└───────┬─────────┘
        │
        ├──► PostgreSQL (hauspet_db:5432) — Prisma schemas public/eventstore/readmodels
        ├──► Redis (hauspet_redis:6379) — sessions + BullMQ
        └──► MongoDB (hauspet_audit_db:27017) — audit logs
                  ▲
                  │ BullMQ jobs
           ┌──────┴──────┐
           │ hauspet_worker │ Background worker (event projections/audit)
           └──────────────┘
```

**Application layout (repo):**
- Frontend: `app/frontend` (Vite dev server, nginx proxy in Compose).
- API + Worker: `app/api` (DDD folders `domain/`, `application/`, `infrastructure/`, `routes/`; entrypoints `index.ts` and `worker.ts`).
- Infra configs: `docker/` (dev/test/proxy compose + nginx), `Makefile` (helpers), `docs/` (guides), `tests/functional` (Playwright).

**Key Considerations**:
- API and Worker share Redis queue
- Worker writes audit logs to MongoDB
- API reads/writes breed data to PostgreSQL
- GUI is a static SPA served separately

---

## Deployment Options

### Option 1: Simple VPS Deployment (DigitalOcean, Linode, Hetzner)

**Best for**: Small-medium projects, budget-conscious, single-server apps

**Pros**:
- Simple to understand and manage
- Cost-effective ($12-40/month)
- Full control over server
- Docker Compose works out of the box

**Cons**:
- No auto-scaling
- Manual updates required
- Single point of failure

**Steps**:
1. Provision VPS (Ubuntu 22.04, 2-4GB RAM minimum)
2. Install Docker & Docker Compose
3. Clone repository
4. Set up production docker-compose (see below)
5. Configure nginx as reverse proxy
6. Set up SSL with Let's Encrypt
7. Configure systemd service for auto-restart

**Cost Estimate**: $12-40/month (single VPS + managed DBs optional)

---

### Option 2: Container Platform (Render, Railway, Fly.io)

**Best for**: Fast deployment, minimal DevOps, startups

**Pros**:
- Zero server management
- Automatic SSL, deployments, scaling
- Built-in monitoring and logging
- Free tier available (limited)

**Cons**:
- Higher cost at scale
- Less control
- Platform lock-in

**Recommended Platform**: **Render** (best Docker support)

**Steps** (Render):
1. Create separate services for:
   - `hauspet_api` (Web Service)
   - `hauspet_worker` (Background Worker)
   - `hauspet_gui` (Static Site)
   - PostgreSQL (Managed Database)
   - Redis (Managed Redis)
   - MongoDB (External - MongoDB Atlas)
2. Configure environment variables per service
3. Set up health checks
4. Connect via internal URLs

**Cost Estimate**: $7/month (free tier) → $40-100/month (production)

---

### Option 3: Kubernetes (GKE, EKS, AKS, DigitalOcean Kubernetes)

**Best for**: High-traffic apps, enterprise, multi-region

**Pros**:
- Auto-scaling (horizontal + vertical)
- Self-healing
- Zero-downtime deployments
- Multi-region support

**Cons**:
- Complex setup and learning curve
- Higher operational cost
- Overkill for small projects

**Steps**:
1. Create Kubernetes cluster
2. Containerize services (separate Dockerfiles)
3. Create Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets)
4. Use Helm charts for easier management
5. Set up Ingress Controller (nginx-ingress)
6. Configure horizontal pod autoscaler (HPA)
7. Use managed databases (Cloud SQL, DocumentDB, ElastiCache)

**Cost Estimate**: $100-500/month (cluster + managed services)

**Not Recommended Unless**: >10K daily active users or enterprise requirements

---

### Option 4: Serverless/Hybrid (AWS Fargate, Cloud Run, Lambda)

**Best for**: Variable traffic, cost optimization, event-driven

**Pros**:
- Pay-per-use pricing
- Scales to zero
- No server management

**Cons**:
- Stateless design required
- Cold start latency
- Vendor lock-in

**Recommended Approach**:
- **API**: AWS Fargate or Google Cloud Run (containerized)
- **Worker**: AWS Lambda + SQS (replace BullMQ/Redis)
- **GUI**: Vercel, Netlify, or Cloudflare Pages
- **Databases**: Managed services (RDS, DocumentDB, ElastiCache)

**Cost Estimate**: $20-200/month (depends on usage)

---

### **Recommendation for HausPet**

Start with **Option 1 (VPS)** or **Option 2 (Render)** based on:

| Factor | Choose VPS | Choose Render |
|--------|------------|---------------|
| Budget | <$40/month | <$100/month acceptable |
| DevOps Experience | Comfortable with Linux | Prefer managed |
| Traffic Expectations | Predictable | Variable/growing |
| Time to Market | 1-2 days setup | <2 hours |

---

## Production-Ready Docker Setup

Use the provided production templates (`docker/Dockerfile.prod`, `docker/docker-compose.prod.yaml`, `app/frontend/Dockerfile.prod`, `app/frontend/nginx.conf`) and adjust environment variables, TLS paths, and domain names before deploying. The nginx container includes certbot + cron to auto-renew certificates (see nginx section).

### 1. Production Dockerfile (Multi-Stage Build)

Create `docker/Dockerfile.prod`:

```dockerfile
# Stage 1: Build
FROM node:22-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:22-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r hauspet && useradd -r -g hauspet hauspet

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Generate Prisma Client (production)
RUN npx prisma generate

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
RUN chown -R hauspet:hauspet /app

# Switch to non-root user
USER hauspet

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Default command (can be overridden)
CMD ["node", "dist/index.js"]
```

### 2. Production Docker Compose

Create `docker/docker-compose.prod.yaml`:

```yaml
services:
  hauspet_api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.prod
    container_name: hauspet_api
    depends_on:
      hauspet_db:
        condition: service_healthy
      hauspet_redis:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - PORT=3000
      - PERSISTENCE_TYPE=postgres
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=hauspet_redis
      - REDIS_PORT=6379
      - AUDIT_DB_URI=${AUDIT_DB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - hauspet-prod-network
    command: sh -c "npx prisma migrate deploy && node dist/index.js"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  hauspet_worker:
    build:
      context: ..
      dockerfile: docker/Dockerfile.prod
    container_name: hauspet_worker
    depends_on:
      hauspet_audit_db:
        condition: service_healthy
      hauspet_redis:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - AUDIT_DB_URI=${AUDIT_DB_URI}
      - REDIS_HOST=hauspet_redis
      - REDIS_PORT=6379
    restart: unless-stopped
    networks:
      - hauspet-prod-network
    command: node dist/worker.js
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  hauspet_gui:
    build:
      context: ..
      dockerfile: app/frontend/Dockerfile.prod
    container_name: hauspet_gui
    environment:
      - VITE_API_URL=${API_URL}
    ports:
      - "8080:80"
    restart: unless-stopped
    networks:
      - hauspet-prod-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  hauspet_db:
    image: postgres:14-alpine
    container_name: hauspet_db
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hauspet-prod-network
    # Do NOT expose port in production unless needed for external access

  hauspet_audit_db:
    image: mongo:6.0
    container_name: hauspet_audit_db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hauspet-prod-network

  hauspet_redis:
    image: redis:7-alpine
    container_name: hauspet_redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - hauspet-prod-network
    volumes:
      - redis_data:/data

  # Nginx reverse proxy (optional but recommended)
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile.prod
    container_name: hauspet_nginx
    depends_on:
      - hauspet_api
      - hauspet_gui
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/letsencrypt:/etc/letsencrypt
      - ./nginx/letsencrypt-lib:/var/lib/letsencrypt
      - ./nginx/www:/var/www/certbot
    restart: unless-stopped
    networks:
      - hauspet-prod-network

networks:
  hauspet-prod-network:
    driver: bridge

volumes:
  postgres_data:
  mongo_data:
  redis_data:
```

### 3. GUI Production Dockerfile

`app/frontend/Dockerfile.prod`:

```dockerfile
# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `app/frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Environment Variables & Secrets

### Production `.env` File

Create `.env.production` (NEVER commit this):

```bash
# Application
NODE_ENV=production
PORT=3000
PERSISTENCE_TYPE=postgres

# Database
DB_USER=hauspet_prod
DB_PASSWORD=<STRONG_PASSWORD_HERE>
DB_NAME=hauspet_production
DB_HOST=hauspet_db
DB_PORT=5432
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# MongoDB Audit
MONGO_USER=audit_prod
MONGO_PASSWORD=<STRONG_PASSWORD_HERE>
AUDIT_DB_URI=mongodb://${MONGO_USER}:${MONGO_PASSWORD}@hauspet_audit_db:27017/audit_log_db?authSource=admin

# Redis
REDIS_PASSWORD=<STRONG_PASSWORD_HERE>
REDIS_HOST=hauspet_redis
REDIS_PORT=6379

# JWT (Authentication)
JWT_SECRET=<RANDOM_256_BIT_SECRET>
JWT_EXPIRES_IN=7d

# Frontend
API_URL=https://api.yourdomain.com
```

### Generating Secrets

```bash
# Generate strong password (32 characters)
openssl rand -base64 32

# Generate JWT secret (256-bit)
openssl rand -hex 32
```

### Secrets Management Options

1. **Environment Files** (simple, VPS):
   ```bash
   # On server
   sudo nano /etc/hauspet/.env.production
   sudo chmod 600 /etc/hauspet/.env.production
   ```

2. **Docker Secrets** (Docker Swarm):
   ```bash
   echo "my_secret_password" | docker secret create db_password -
   ```

3. **Vault/Cloud Secrets**:
   - AWS Secrets Manager
   - Google Cloud Secret Manager
   - HashiCorp Vault
   - Doppler

---

## Security Hardening

### 1. Network Security

**Nginx Reverse Proxy** (`docker/nginx/nginx.conf`):

```nginx
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=3r/s;

    # Upstream API
    upstream hauspet_api {
        server hauspet_api:3000;
    }

    # Upstream GUI
    upstream hauspet_gui {
        server hauspet_gui:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Certificates (Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Frontend (SPA)
        location / {
        proxy_pass http://hauspet_gui;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://hauspet_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # Authentication endpoints (stricter rate limit)
        location /api/auth/ {
            limit_req zone=auth_limit burst=5 nodelay;

            proxy_pass http://hauspet_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check (no rate limit)
        location /health {
            proxy_pass http://hauspet_api;
            access_log off;
        }
    }
}
```

### 2. SSL Certificate Setup (Let's Encrypt)

The `hauspet_nginx` container already has certbot + a daily cron renewal (`0 3 * * * certbot renew --webroot -w /var/www/certbot --deploy-hook "nginx -s reload"`).

**Initial issuance (run once):**
```bash
make prod-cert DOMAIN=yourdomain.com WWW_DOMAIN=www.yourdomain.com LETSENCRYPT_EMAIL=you@example.com
```

Update `docker/nginx/nginx.prod.conf` with your `server_name` and matching certificate paths in `/etc/letsencrypt/live/<domain>/`.

### 3. Firewall Configuration (UFW)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny all other incoming, allow outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable
```

### 4. Database Security

**PostgreSQL**:
- Use strong passwords (32+ characters)
- Do NOT expose port 5432 externally
- Enable SSL connections
- Restrict `pg_hba.conf` to specific IPs

**MongoDB**:
- Enable authentication (already configured)
- Do NOT expose port 27017 externally
- Use role-based access control (RBAC)

**Redis**:
- Set strong password (`requirepass`)
- Do NOT expose port 6379 externally
- Disable dangerous commands: `CONFIG`, `FLUSHALL`

### 5. Application Security Checklist

- [ ] Enable CORS only for trusted domains
- [ ] Validate all user input (already using Zod)
- [ ] Use prepared statements (Prisma already does this)
- [ ] Implement rate limiting (see nginx config)
- [ ] Enable Helmet.js middleware
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Remove unnecessary dependencies
- [ ] Disable directory listing
- [ ] Set secure HTTP headers

Add to `src/app.ts`:

```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS (production)
if (process.env.NODE_ENV === 'production') {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true,
  }));
}
```

---

## Monitoring & Observability

### 1. Health Checks

Add comprehensive health endpoint (`src/routes/main.router.ts`):

```typescript
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      mongodb: 'unknown',
    },
  };

  try {
    // Check PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'ok';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
  }

  try {
    // Check Redis
    await redisClient.ping();
    health.services.redis = 'ok';
  } catch (error) {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  try {
    // Check MongoDB
    await mongoose.connection.db.admin().ping();
    health.services.mongodb = 'ok';
  } catch (error) {
    health.services.mongodb = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### 2. Logging Strategy

**Structured Logging** with Winston:

```bash
npm install winston
```

Create `src/infrastructure/logger.ts`:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hauspet-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
```

### 3. Monitoring Tools

**Option A: Self-Hosted (VPS)**

Add to `docker-compose.prod.yaml`:

```yaml
  # Prometheus (metrics)
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped
    networks:
      - hauspet-network

  # Grafana (dashboards)
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3001:3000"
    restart: unless-stopped
    networks:
      - hauspet-network
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

**Option B: SaaS (Managed)**

- **Sentry**: Error tracking (free tier available)
- **Datadog**: Full observability ($15/host/month)
- **New Relic**: APM (free tier available)
- **LogDNA/Logtail**: Log management
- **UptimeRobot**: Uptime monitoring (free)

**Recommended for HausPet**: Sentry (errors) + UptimeRobot (uptime)

---

## Backup Strategy

### 1. PostgreSQL Backups

**Automated Daily Backups**:

Create `scripts/backup-postgres.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/hauspet/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hauspet_db_$TIMESTAMP.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
docker exec hauspet_db pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Upload to S3 (optional)
# aws s3 cp $BACKUP_FILE s3://your-bucket/postgres-backups/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Cron Job**:

```bash
# Daily at 3 AM
0 3 * * * /opt/hauspet/scripts/backup-postgres.sh >> /var/log/hauspet-backup.log 2>&1
```

### 2. MongoDB Backups

Create `scripts/backup-mongo.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/hauspet/mongo"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/audit_db_$TIMESTAMP"

mkdir -p $BACKUP_DIR

docker exec hauspet_audit_db mongodump \
  --username $MONGO_USER \
  --password $MONGO_PASSWORD \
  --authenticationDatabase admin \
  --out /tmp/backup

docker cp hauspet_audit_db:/tmp/backup $BACKUP_FILE

tar -czf "$BACKUP_FILE.tar.gz" -C $BACKUP_DIR $(basename $BACKUP_FILE)
rm -rf $BACKUP_FILE

find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.tar.gz"
```

### 3. Backup to Cloud Storage

**AWS S3**:

```bash
# Install AWS CLI
sudo apt install awscli

# Configure credentials
aws configure

# Upload backup
aws s3 cp /var/backups/hauspet/ s3://your-bucket/hauspet-backups/ --recursive
```

**Backblaze B2** (cheaper alternative):

```bash
# Install B2 CLI
pip install b2

# Configure
b2 authorize-account <keyID> <applicationKey>

# Upload
b2 sync /var/backups/hauspet/ b2://your-bucket/hauspet-backups/
```

### 4. Disaster Recovery Plan

**Recovery Steps**:

1. **Provision new server** (same specs as original)
2. **Install Docker & Docker Compose**
3. **Clone repository**
4. **Restore environment variables** (from secure backup)
5. **Restore PostgreSQL**:
   ```bash
   gunzip -c backup.sql.gz | docker exec -i hauspet_db psql -U user -d hauspet_db
   ```
6. **Restore MongoDB**:
   ```bash
   docker exec hauspet_audit_db mongorestore --username user --password pass /path/to/backup
   ```
7. **Start services**:
   ```bash
   docker compose -f docker/docker-compose.prod.yaml up -d
   ```

**Test Recovery Annually**

---

## CI/CD Pipeline

### GitHub Actions Production Deployment

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: make test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile.prod
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api:${{ github.sha }}

      - name: Build and push GUI image
        uses: docker/build-push-action@v5
        with:
          context: ./app/frontend
          file: ./app/frontend/Dockerfile.prod
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-gui:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-gui:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/hauspet
            docker compose -f docker/docker-compose.prod.yaml pull
            docker compose -f docker/docker-compose.prod.yaml up -d
            docker system prune -f
```

**Required Secrets** (GitHub Settings → Secrets):
- `PRODUCTION_HOST`: Your server IP
- `PRODUCTION_USER`: SSH username
- `SSH_PRIVATE_KEY`: Private SSH key for deployment

---

## Pre-Launch Checklist

### Infrastructure
- [ ] Server provisioned (VPS/Cloud)
- [ ] Domain name registered and DNS configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] Firewall configured (UFW/Security Groups)
- [ ] Backup strategy implemented and tested

### Application
- [ ] Environment variables configured (`.env.production`)
- [ ] Secrets generated and stored securely
- [ ] Database migrations run successfully
- [ ] Health checks returning 200 OK
- [ ] All tests passing

### Security
- [ ] Strong passwords set (32+ characters)
- [ ] JWT secret generated (256-bit)
- [ ] Database ports NOT exposed externally
- [ ] Nginx reverse proxy configured
- [ ] Rate limiting enabled
- [ ] CORS configured for production domains
- [ ] Helmet.js middleware enabled
- [ ] Security headers set (CSP, HSTS, etc.)

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Logging configured (Winston)
- [ ] Health check endpoint tested
- [ ] Alerts configured (email/Slack)

### Performance
- [ ] Database indices created
- [ ] Static assets compressed (gzip)
- [ ] CDN configured (optional)
- [ ] Connection pooling configured
- [ ] Load testing performed

### Documentation
- [ ] API documentation updated
- [ ] Deployment runbook created
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployment process
- [ ] Certbot initial issuance run (`make prod-cert DOMAIN=<domain> WWW_DOMAIN=www.<domain> LETSENCRYPT_EMAIL=<email>`) to populate `/etc/letsencrypt`, then reloads nginx automatically

### Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Cookie consent implemented (if applicable)

---

## Quick Start Guide

### VPS Deployment (Ubuntu 22.04)

```bash
# 1. Initial server setup
ssh root@your-server-ip

# 2. Create non-root user
adduser hauspet
usermod -aG sudo hauspet
su - hauspet

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 4. Install Docker Compose
sudo apt update
sudo apt install docker-compose-plugin

# 5. Clone repository
cd /opt
sudo git clone https://github.com/yourusername/HausPet.git
sudo chown -R hauspet:hauspet HausPet
cd HausPet

# 6. Create production environment file
cp .env.example .env.production
nano .env.production  # Edit with your values

# 7. Build and start services
docker compose -f docker/docker-compose.prod.yaml up -d --build

# 8. Check logs
docker compose -f docker/docker-compose.prod.yaml logs -f

# 9. Install and configure nginx
sudo apt install nginx certbot python3-certbot-nginx
sudo cp docker/nginx/nginx.conf /etc/nginx/sites-available/hauspet
sudo ln -s /etc/nginx/sites-available/hauspet /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 10. Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 11. Set up auto-start
sudo nano /etc/systemd/system/hauspet.service
```

**Systemd Service** (`/etc/systemd/system/hauspet.service`):

```ini
[Unit]
Description=HausPet Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/HausPet
ExecStart=/usr/bin/docker compose -f docker/docker-compose.prod.yaml up -d
ExecStop=/usr/bin/docker compose -f docker/docker-compose.prod.yaml down
User=hauspet

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable hauspet
sudo systemctl start hauspet
sudo systemctl status hauspet
```

---

## Troubleshooting

### Common Issues

**1. Container won't start**
```bash
# Check logs
docker compose -f docker/docker-compose.prod.yaml logs hauspet_api

# Check container status
docker ps -a

# Restart service
docker compose -f docker/docker-compose.prod.yaml restart hauspet_api
```

**2. Database connection failed**
```bash
# Verify database is running
docker exec hauspet_db pg_isready -U user -d hauspet_db

# Check connection string
docker exec hauspet_api env | grep DATABASE_URL
```

**3. High memory usage**
```bash
# Check resource usage
docker stats

# Restart containers
docker compose -f docker/docker-compose.prod.yaml restart
```

**4. SSL certificate issues**
```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

---

## Cost Estimation

### VPS Deployment (DigitalOcean)

| Component | Specs | Monthly Cost |
|-----------|-------|--------------|
| VPS Droplet | 2 CPU, 4GB RAM, 80GB SSD | $24 |
| Backups (20%) | - | $5 |
| Bandwidth | 4TB included | $0 |
| Domain | .com | $12/year (~$1/mo) |
| **Total** | | **~$30/month** |

### Managed Platform (Render)

| Component | Tier | Monthly Cost |
|-----------|------|--------------|
| Web Service (API) | Starter | $7 |
| Background Worker | Starter | $7 |
| PostgreSQL | Starter (1GB) | $7 |
| Redis | Starter | $0 (free) |
| Static Site (GUI) | - | $0 (free) |
| MongoDB Atlas | M0 Shared | $0 (free) |
| **Total** | | **$21/month** |

### Production-Scale (AWS)

| Component | Specs | Monthly Cost |
|-----------|-------|--------------|
| ECS Fargate (API + Worker) | 2 tasks × 0.5 vCPU | ~$30 |
| RDS PostgreSQL | db.t3.micro | $15 |
| DocumentDB | t3.medium (single) | $75 |
| ElastiCache Redis | cache.t3.micro | $12 |
| CloudFront (GUI) | 1TB transfer | $10 |
| Load Balancer | Application LB | $20 |
| **Total** | | **~$162/month** |

---

## Next Steps

1. **Choose deployment option** based on budget and requirements
2. **Set up staging environment** (clone of production for testing)
3. **Configure monitoring** (start with free tier of Sentry + UptimeRobot)
4. **Run security audit** (`npm audit`, penetration testing)
5. **Load test** application (use Apache Bench or k6)
6. **Document runbook** for common operations
7. **Schedule backups** and test recovery process
8. **Go live!** 🚀

---

## Support

For questions or issues:
- Check logs: `docker compose -f docker/docker-compose.prod.yaml logs -f`
- Review health endpoint: `curl https://yourdomain.com/health`
- Consult documentation in `docs/` folder
