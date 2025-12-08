# Environment Variables Guide

## Overview

This project uses environment-specific configuration files to manage different deployment scenarios. This approach provides:

- **Security**: Production secrets never committed to git
- **Clarity**: Clear separation between environments
- **Flexibility**: Easy switching between configurations
- **Safety**: Development values safe to commit

## File Structure

```
HausPet/
├── app/
│   ├── api/
│   │   ├── .env.development       # ✅ Safe to commit - Dev config
│   │   ├── .env.test              # ✅ Safe to commit - Test config
│   │   ├── .env.production.example # ✅ Template only
│   │   └── .env.production        # ❌ NEVER commit - Real secrets
│   └── frontend/
│       ├── .env.development       # ✅ Safe to commit - Dev config
│       ├── .env.test              # ✅ Safe to commit - Test config
│       └── .env.production        # ✅ Safe to commit - API URL only
└── docker/
    ├── dev/docker-compose.yaml    # Uses .env.development
    ├── test/docker-compose.yaml   # Uses .env.test
    └── prod/docker-compose.yaml   # Uses .env.production
```

## Backend (app/api)

### Files

- **`.env.development`** - Local development configuration
  - Uses `localhost` for services
  - Weak secrets (safe for development)
  - Small pagination for testing

- **`.env.test`** - Automated testing configuration
  - Test database names
  - Short token expiration
  - Optimized for CI/CD

- **`.env.production.example`** - Production template
  - All variables with `CHANGEME_` placeholders
  - Copy to `.env.production` on server
  - Replace ALL values with real secrets

### Usage

#### Local Development (without Docker)
```bash
cd app/api
# Uses .env.development by default
npm run dev
```

#### Local Development (with Docker)
```bash
# Uses app/api/.env.development + Docker overrides
make dev-up
```

#### Testing
```bash
cd app/api
# Uses .env.test
NODE_ENV=test npm test
```

#### Production Setup
```bash
cd app/api
# 1. Copy template
cp .env.production.example .env.production

# 2. Generate strong secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET

# 3. Edit .env.production with real values
nano .env.production

# 4. NEVER commit .env.production
git status  # Should not show .env.production
```

## Frontend (app/frontend)

### Important: Vite Build-Time Variables

⚠️ **CRITICAL**: Vite embeds environment variables at **build time**, not runtime.

- Variables are baked into the JavaScript bundle
- Only variables prefixed with `VITE_` are exposed
- Anyone can see these values in browser DevTools
- **NEVER** put secrets in frontend .env files

### Files

- **`.env.development`** - Local dev (Vite dev server)
  - `VITE_API_URL=http://localhost:3000`

- **`.env.test`** - Testing (Playwright)
  - `VITE_API_URL=http://localhost:3000`

- **`.env.production`** - Production build
  - `VITE_API_URL=https://api.hauspet.com`
  - This URL is visible to all users

### Usage

#### Local Development
```bash
cd app/frontend
# Uses .env.development
npm run dev
```

#### Build for Production
```bash
cd app/frontend
# Uses .env.production
npm run build

# Result: dist/ folder with API URL baked in
```

#### Testing
```bash
# Uses .env.test
npm run test
```

## Docker Compose

### How env_file Works

```yaml
services:
  hauspet_api:
    env_file:
      - ../../app/api/.env.development  # Load all variables
    environment:
      # Override specific variables for Docker networking
      - DATABASE_URL=postgresql://user:password@hauspet_db:5432/hauspet_db
```

**Priority**: `environment` overrides `env_file`

### Development
```bash
# Uses app/api/.env.development + Docker service names
docker compose -f docker/dev/docker-compose.yaml up
```

### Testing
```bash
# Uses app/api/.env.test + Docker service names
docker compose -f docker/test/docker-compose.yaml up
```

### Production
```bash
# Requires app/api/.env.production to exist
cd app/api
cp .env.production.example .env.production
# Edit .env.production with real values

cd ../../docker/prod
docker compose up -d
```

## Security Best Practices

### ✅ DO

- **Commit** `.env.development` and `.env.test` (no real secrets)
- **Commit** `.env.production.example` (template only)
- **Commit** frontend `.env` files (VITE variables are public anyway)
- Use strong random secrets in production (`openssl rand -base64 32`)
- Use different secrets for each environment
- Store production secrets in secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)

### ❌ DON'T

- **Never commit** `.env.production` (real secrets)
- Never put secrets in frontend `.env` files
- Never use development secrets in production
- Never share production `.env` files via Slack/email
- Never hardcode secrets in Docker Compose

## Environment Variables Reference

### Backend Required Variables

| Variable | Development | Test | Production |
|----------|-------------|------|------------|
| `NODE_ENV` | development | test | production |
| `DATABASE_URL` | localhost | localhost | RDS/managed DB |
| `REDIS_HOST` | localhost | localhost | ElastiCache/managed |
| `JWT_SECRET` | Weak dev key | Test key | **Strong random 32+ chars** |
| `JWT_REFRESH_SECRET` | Weak dev key | Test key | **Different strong random 32+ chars** |

### Frontend Required Variables

| Variable | Development | Test | Production |
|----------|-------------|------|------------|
| `VITE_API_URL` | http://localhost:3000 | http://localhost:3000 | https://api.hauspet.com |
| `VITE_DISABLE_CLIENT_VALIDATION` | false | false | **false** (never true in prod) |

## Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` in your `.env.*` file
- For Docker: Ensure service names match (`hauspet_db` not `localhost`)
- For local: Ensure database is running

### "JWT secret not configured"
- Check `JWT_SECRET` exists in `.env.*` file
- Production: Ensure secret is strong (32+ characters)

### "Frontend can't reach API"
- Check `VITE_API_URL` in `.env.*` file
- Remember: This is baked into build, rebuild after changing
- Development: Usually `http://localhost:3000`
- Production: Must be full HTTPS URL

### "Variables not loading in Docker"
- Check `env_file` path in `docker-compose.yaml`
- Ensure `.env.*` file exists at that path
- Check file permissions (must be readable)

## Migration from Old Setup

If you were using the old approach with a single `.env` file:

```bash
# 1. Backup old files
cp .env .env.backup
cp app/api/.env app/api/.env.backup
cp app/frontend/.env app/frontend/.env.backup

# 2. New files are already created, verify they work
cd app/api
npm run dev  # Should use .env.development

# 3. Once verified, remove old files
rm .env.backup app/api/.env.backup app/frontend/.env.backup

# 4. Update any scripts that reference old .env files
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run tests
  env:
    NODE_ENV: test
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
  run: npm test
```

### Production Deployment

```yaml
- name: Deploy to production
  env:
    NODE_ENV: production
    DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
    JWT_SECRET: ${{ secrets.PROD_JWT_SECRET }}
    # ... other secrets from GitHub Secrets
  run: |
    docker compose -f docker/prod/docker-compose.yaml up -d
```

## Additional Resources

- [The Twelve-Factor App: Config](https://12factor.net/config)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Compose env_file](https://docs.docker.com/compose/environment-variables/set-environment-variables/)
