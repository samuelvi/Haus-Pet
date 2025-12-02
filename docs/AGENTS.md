# HausPet - Agent Guidelines

This file provides comprehensive guidance for AI agents (like Claude Code) working with this repository.

## Table of Contents

- [Active Work in Progress](#-active-work-in-progress)
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Development Commands](#development-commands)
- [Important Conventions](#important-conventions)
- [Common Workflows](#common-workflows)
- [Testing Strategy](#testing-strategy)
- [Key Files Reference](#key-files-reference)
- [Documentation Index](#documentation-index)

---

## 🚧 Active Work in Progress

**Current Project**: Building Admin Panel with Authentication

**Status**: Backend authentication foundation completed (4/21 tasks)
- ✅ User model in Prisma schema
- ✅ Domain entities (User, Email, Password value objects)
- ✅ Password hashing service (bcrypt)
- ✅ JWT service
- ⏳ NEXT: Design screens in Figma
- ⏳ PENDING: Complete backend (use cases, controllers, routes, middleware)
- ⏳ PENDING: Build React frontend
- ⏳ PENDING: Integration

**Plan**: Backend → Figma Design → React Frontend → Integration

See conversation history or ask "What's the status of the admin panel project?"

---

## Project Overview

HausPet is a REST API for managing pet breeds built with Node.js, Express, and TypeScript. The project follows **Domain-Driven Design (DDD)** principles with a clear separation between Domain, Application, and Infrastructure layers.

### System Components

- **Main API**: Express.js REST API server
- **Background Worker**: BullMQ-based worker for async audit logging
- **PostgreSQL**: Primary database for pet data (via Prisma ORM)
- **MongoDB**: Audit log storage (via Mongoose)
- **Redis**: Message queue backend for BullMQ
- **MCP Server**: Model Context Protocol server for Claude Desktop integration

### Project Structure

Monorepo under `app/`:
- **Backend API + Worker**: `app/api` (DDD folders: `domain/`, `application/`, `infrastructure/`, `routes/`, entries: `index.ts` and `worker.ts`)
- **Frontend**: `app/frontend` (React + Vite)
- **Ops & Docs**: `docker/` (dev/test/proxy Compose + nginx) and `docs/` (testing, schema, production guidance)
- **Tests**: Playwright specs in `tests/functional`; artifacts in `playwright-report/` and `test-results/`
- **Data Layer**: Prisma schema/migrations at `app/api/prisma/` (schemas: public/eventstore/readmodels)
- **Scripts/Utilities**: `app/api/scripts`

---

## Architecture

### DDD Layer Structure

```
app/api/src/api/
├── domain/                  # Business logic, no framework dependencies
│   ├── breed.ts            # Breed entity
│   ├── pet/                # Pet aggregate (event sourcing)
│   ├── sponsorship/        # Sponsorship aggregate
│   ├── auth/               # User, Email, Password value objects
│   ├── audit.ts            # Audit entity
│   ├── *-read.repository.ts    # Read repository interfaces
│   ├── *-write.repository.ts   # Write repository interfaces
│   └── errors/             # Domain-specific errors
│
├── application/            # Use cases and orchestration
│   ├── breed.service.ts    # Core breed service
│   ├── pet.service.ts      # Pet service
│   ├── sponsorship.service.ts  # Sponsorship service
│   ├── auth.service.ts     # Authentication service
│   ├── audit.service.ts    # Audit service
│   └── audit-logging-*.service.decorator.ts  # Decorator pattern for audit
│
├── infrastructure/         # Technical implementations
│   ├── database/
│   │   ├── prisma-client.ts    # Prisma client singleton
│   │   ├── postgres-pool.ts    # Direct PostgreSQL pool
│   │   └── mongoose.ts         # Mongoose connection
│   ├── repositories/
│   │   ├── postgres-*.repository.ts  # Prisma-based repositories
│   │   ├── in-memory-*.repository.ts # In-memory for testing
│   │   ├── mongo-audit.repository.ts # MongoDB audit repository
│   │   └── repository.factory.ts     # Factory pattern
│   ├── http/
│   │   ├── controllers/    # HTTP handlers
│   │   ├── middleware/     # Request middleware (auth, audit)
│   │   └── validators/     # Request validation (Zod)
│   ├── auth/
│   │   ├── jwt.service.ts          # JWT token management
│   │   ├── password-hasher.ts      # bcrypt password hashing
│   │   └── session.service.ts      # Redis session management
│   ├── queue/
│   │   ├── queue.service.ts        # BullMQ queue wrapper
│   │   ├── redis-connection.ts     # Redis connection
│   │   └── redis-health.service.ts # Health checks
│   └── projections/        # Event sourcing projections
│
├── routes/                 # Express route definitions
│   ├── main.router.ts
│   └── api/
│       ├── index.ts
│       ├── auth.router.ts
│       ├── breed.router.ts
│       ├── pet.router.ts
│       ├── sponsorship.router.ts
│       └── admin/          # Protected admin routes
│
├── app.ts                  # Express app setup (no server start)
├── index.ts                # API server entry point
├── worker.ts               # Background worker entry point
└── mcp-server.ts           # MCP server for Claude Desktop
```

### Key Architectural Patterns

**Dependency Flow**: Infrastructure → Application → Domain
- Domain layer has no dependencies on other layers
- Application layer depends only on Domain
- Infrastructure implements Domain interfaces

**Repository Pattern**:
- Interfaces defined in Domain (e.g., `breed-read.repository.ts`, `breed-write.repository.ts`)
- Implementations in Infrastructure (e.g., `postgres-breed.repository.ts`, `in-memory-breed.repository.ts`)
- Factory creates appropriate implementation (`repository.factory.ts`)

**Decorator Pattern**:
- `AuditLoggingPetServiceDecorator` wraps `PetService` to add audit logging
- Follows DDD principle of keeping cross-cutting concerns separate

**Event Sourcing**:
- Pet and Sponsorship aggregates use event sourcing
- Events stored in `eventstore` schema
- Read models projected to `readmodels` schema
- Background worker processes projections

**Async Audit Logging**:
- Write operations trigger audit events
- Events pushed to Redis-backed BullMQ queue
- Background worker consumes queue and writes to MongoDB
- This keeps the API fast by making audit logging async

### Database Strategy

**PostgreSQL (Prisma)** - Multi-schema organization:
- `public` schema: Breed and User entities
- `eventstore` schema: Immutable event store
- `readmodels` schema: Projected read models (Animals, Sponsorships)
- Schema defined in `app/api/prisma/schema.prisma`

**MongoDB (Mongoose)**:
- Audit log storage only
- Stores operation history (add/list operations)
- Accessed only by audit service and worker

**Redis**:
- Database 0: BullMQ message queue
- Database 1: User sessions (authentication)

**Separation Rationale**:
- Relational for structured data (breeds, users, read models)
- Document-based for flexible audit logs
- Event store for immutable event history
- See `docs/SCHEMA-ORGANIZATION.md` for scalability strategy

---

## Development Commands

### Starting Services

```bash
# Start all services (recommended for development)
make up

# Stop all services
make down

# Stop and delete volumes (complete reset)
make prune
```

### Running the Application Locally

When running locally (outside Docker):

```bash
# Terminal 1: Start the API server
npm run dev:api

# Terminal 2: Start the background worker
npm run dev:worker

# Terminal 3: Start the frontend
npm run dev:frontend
```

### Building and Compilation

```bash
# From repo root
npm run build:api       # type-check + compile API to dist/

# Build the MCP server (creates app/api/dist/mcp-server.js)
cd app/api
npm run build
npm run build:mcp
```

### Database Management

**First-time setup or complete reset:**

```bash
# 1. Destroy old environment
make prune

# 2. Reset database
make reset-db

# 3. Apply migrations and seed data
make seed

# 4. Start full application
make up
```

**Schema changes:**

```bash
# After modifying app/api/prisma/schema.prisma
cd app/api
npx prisma migrate dev --name description_of_change
```

**Seed database:**

```bash
cd app/api
npm run db:seed
```

### Testing

```bash
# Run full test suite (starts services, runs tests, cleans up)
npm run test:functional
# OR
make test

# Manual test control
make test-up        # Start test environment
make test-run       # Run tests
make test-down      # Stop test environment
make test-prune     # Stop and delete test volumes
```

Tests use Playwright and run against an isolated test database on port 5433.

### Utilities

```bash
# List all API routes
make list-routes

# Access MongoDB audit logs
make mongo-shell
# Then in shell:
use audit_log_db;
db.logs.find().pretty();

# Suggest commit message (AI-assisted)
git add .
npm run commit-msg:suggest
```

---

## Important Conventions

### Type Safety

- **Always use explicit types** for variables, parameters, and return types
- Avoid `any` - use `unknown` when type is truly unknown
- Example: `const port: number = Number(process.env.PORT ?? 3000);`
- TypeScript `strict` mode is enabled in `app/api`

### Coding Style & Naming

- **TypeScript everywhere**; use `ts-node-dev` for dev and `tsc` for builds
- **Prefer 2-space indentation**, camelCase for functions/variables, PascalCase for types/classes, kebab-case for files
- **Keep DDD separation** (`domain` vs `application` vs `infrastructure`)
- Frontend linting uses flat ESLint config in `app/frontend/eslint.config.js` (hooks + Vite rules)
- No API lint script yet—rely on `npm run build:api` for type safety until a lint step is added

### Comments and Documentation

- **All comments must be in English**
- Use JSDoc for public methods
- Self-documenting code preferred over excessive comments

### Commit Messages

- Project uses **Conventional Commits** enforced by commitlint + husky
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Header limit: 200 chars (configured in `commitlint.config.js`)
- Husky pre-commit hook will reject non-conforming messages

### Error Handling

- Domain errors in `app/api/src/api/domain/errors/`
- Custom error classes extend base `Error`
- Example: `PetBreedAlreadyExistsError`, `CatBreedAlreadyExistsError`

### Version Management

- **Node.js v22** (see `.nvmrc`)
- Use `nvm use` or `fnm use` to switch to correct version
- **npm v11.6.1** automatically installed in Docker containers

---

## Common Workflows

### Adding a New Breed Endpoint

1. Add route in `app/api/src/api/routes/api/breed.router.ts`
2. Add handler in `app/api/src/api/infrastructure/http/controllers/breed.controller.ts`
3. Add business logic in `app/api/src/api/application/breed.service.ts` if needed
4. Add domain logic in `app/api/src/api/domain/` if it involves business rules
5. Add test in `tests/functional/`
6. Run tests: `make test`

### Adding a New Pet Endpoint (Event Sourcing)

1. Define event in `app/api/src/api/domain/pet/pet.events.ts`
2. Update aggregate in `app/api/src/api/domain/pet/pet.aggregate.ts`
3. Add use case in `app/api/src/api/application/pet.service.ts`
4. Add projection logic in `app/api/src/api/infrastructure/projections/pet.projector.ts`
5. Add route in `app/api/src/api/routes/api/pet.router.ts`
6. Add controller in `app/api/src/api/infrastructure/http/controllers/pet.controller.ts`
7. Add test in `tests/functional/`
8. Run tests: `make test`

### Modifying Database Schema

1. Edit `app/api/prisma/schema.prisma`
2. Create migration: `cd app/api && npx prisma migrate dev --name your_change_name`
3. Commit migration files in `app/api/prisma/migrations/`
4. Migration auto-applies on Docker startup via `prisma migrate deploy`

### Working with Audit Logs

Audit logs are async:
1. API operation happens
2. Event pushed to Redis queue
3. Background worker consumes and writes to MongoDB
4. View logs: `make mongo-shell` then `db.logs.find().pretty()`

### Creating a Git Commit

Only create commits when requested by the user. When the user asks:

1. Run in parallel (using Bash tool):
   - `git status` to see untracked files
   - `git diff` to see staged and unstaged changes
   - `git log` to see recent commit style

2. Analyze changes and draft commit message:
   - Summarize nature of changes (new feature, enhancement, bug fix, refactor, test, docs)
   - Ensure message accurately reflects changes
   - Focus on "why" rather than "what"
   - Do not commit files with secrets (.env, credentials.json)

3. Run in parallel:
   - Add relevant untracked files to staging area
   - Create commit with message ending with:
     ```
     🤖 Generated with [Claude Code](https://claude.com/claude-code)

     Co-Authored-By: Claude <noreply@anthropic.com>
     ```
   - Run `git status` after commit completes (sequentially)

4. If commit fails due to pre-commit hook changes, retry ONCE
   - Check authorship: `git log -1 --format='%an %ae'`
   - Check not pushed: `git status` shows "Your branch is ahead"
   - If both true: amend commit. Otherwise: create NEW commit

**Important**:
- NEVER run additional commands to read or explore code (besides git commands)
- NEVER use TodoWrite or Task tools during commit workflow
- DO NOT push unless user explicitly asks
- NEVER use git commands with `-i` flag (interactive mode not supported)
- Always pass commit message via HEREDOC for proper formatting

---

## Testing Strategy

**Philosophy**:
- Focus on testing from the outside-in (HTTP → DB)
- High confidence that entire system works
- Clean slate for each test ensures independence

**Functional Tests** (Playwright):
- Located in `tests/functional/`
- Test against real isolated test database (port 5433)
- Each test has `beforeEach` that cleans DB and inserts fixtures
- Run via `npm run test:functional` or `make test`

**Writing Tests**:
- Keep specs close to the feature
- Use descriptive `describe`/`test` names
- Include assertions for HTTP status, payload shape, and auth flows
- Record new fixtures via Prisma seeds when possible

**Test Environment**:
- Separate Docker Compose configuration (`docker/docker-compose.test.yaml`)
- Dedicated PostgreSQL database (`hauspet_test_db`) on port 5433
- Isolated data volume (`postgres_test_data`)

For detailed testing guide, see `docs/TESTING.md`.

---

## CI/CD

**GitHub Actions Pipeline** (`.github/workflows/test.yml`):
- Automatically runs on push to `main` and pull requests
- Uses Node.js v22 with npm caching
- Executes full test suite via `make test`
- Uploads Playwright reports and test results as artifacts (7-day retention)
- Docker Compose available by default in GitHub runners

**Pipeline Steps**:
1. Checkout code
2. Setup Node.js v22
3. Install dependencies (`npm ci`)
4. Install Playwright browsers
5. Run tests (starts services, tests, cleanup)
6. Upload artifacts (always runs, even on failure)

---

## MCP Server

The project includes an MCP server for Claude Desktop integration:

**Setup**:
1. Build: `cd app/api && npm run build`
2. Configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)
3. Start services: `make up`
4. See `docs/MCP-README.md` for full setup

**Available Tools**:
- `list_all_breeds`: List all available breeds
- `list_breeds_by_type`: Filter by type (cat/dog/bird)
- `get_random_breed`: Get random breed
- `add_breed`: Add new breed

---

## Key Files Reference

### Core Application Files

- **`app/api/src/api/app.ts`**: Express app configuration (middleware, routes)
- **`app/api/src/api/index.ts`**: API server entry (starts HTTP server)
- **`app/api/src/api/worker.ts`**: Background worker (processes audit queue)
- **`app/api/src/api/infrastructure/repositories/repository.factory.ts`**: Repository creation logic
- **`app/api/prisma/schema.prisma`**: Database schema (multi-schema: public/eventstore/readmodels)

### Configuration Files

- **`Makefile`**: Common development commands
- **`docker/docker-compose.yaml`**: Development environment
- **`docker/docker-compose.test.yaml`**: Test environment
- **`.ai-rules`**: Comprehensive DDD and TypeScript guidelines (1080 lines)
- **`commitlint.config.js`**: Commit message validation
- **`playwright.config.ts`**: Playwright test configuration

### Frontend Files

- **`app/frontend/src/App.tsx`**: React app entry with routes
- **`app/frontend/src/contexts/AuthContext.tsx`**: Authentication context
- **`app/frontend/eslint.config.js`**: ESLint configuration

---

## Documentation Index

### Core Documentation

- **`README.md`**: General project overview, getting started, API endpoints, user guide
- **`docs/AGENTS.md`**: This file - comprehensive agent guidelines

### Technical Documentation

- **`docs/TESTING.md`**: Detailed testing guide (Playwright, test environment)
- **`docs/MCP-README.md`**: MCP server setup and API testing examples
- **`docs/PRODUCTION.md`**: Production deployment guide (Docker, security, monitoring, backups)
- **`docs/FUZZY-SEARCH.md`**: Fuzzy search implementation details (Fuse.js)
- **`docs/SCHEMA-ORGANIZATION.md`**: Database schema organization for scalability

### Additional Resources

- **`.ai-rules`**: Detailed DDD and TypeScript rules for AI assistants

---

## Quick Reference

### Most Common Commands

```bash
make up              # Start all services
make down            # Stop all services
make test            # Run full test suite
make list-routes     # List all API routes
npm run dev:api      # Start API in dev mode (local)
npm run dev:worker   # Start worker in dev mode (local)
npm run dev:frontend # Start frontend in dev mode (local)
```

### Most Important Directories

```
app/api/src/api/domain/          # Business logic
app/api/src/api/application/     # Use cases
app/api/src/api/infrastructure/  # Technical implementations
app/api/prisma/                  # Database schema & migrations
tests/functional/                # Playwright tests
docs/                            # Technical documentation
```

### Need Help?

- **Testing**: See `docs/TESTING.md`
- **Deployment**: See `docs/PRODUCTION.md`
- **MCP Setup**: See `docs/MCP-README.md`
- **Database Schema**: See `docs/SCHEMA-ORGANIZATION.md`
- **Fuzzy Search**: See `docs/FUZZY-SEARCH.md`
- **API Endpoints**: See `README.md`
