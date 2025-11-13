# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HausPet is a REST API for managing pet breeds built with Node.js, Express, and TypeScript. The project follows **Domain-Driven Design (DDD)** principles with a clear separation between Domain, Application, and Infrastructure layers.

## 🚧 ACTIVE WORK IN PROGRESS

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

The system consists of:
- **Main API**: Express.js REST API server
- **Background Worker**: BullMQ-based worker for async audit logging
- **PostgreSQL**: Primary database for pet data (via Prisma ORM)
- **MongoDB**: Audit log storage (via Mongoose)
- **Redis**: Message queue backend for BullMQ
- **MCP Server**: Model Context Protocol server for Claude Desktop integration

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
npm run dev

# Terminal 2: Start the background worker
npm run start:worker
```

### Building and Compilation

```bash
# Build TypeScript to dist/
npm run build

# Build the MCP server (creates dist/mcp-server.js)
npm run build && npm run mcp
```

### Database Management

**First-time setup or complete reset:**

```bash
# 1. Destroy old environment
docker-compose down -v

# 2. Start only the database
docker-compose up -d hauspet_db

# 3. Create initial migration (run locally)
npx prisma migrate dev --name init

# 4. Start full application
make up
```

**Schema changes:**

```bash
# After modifying prisma/schema.prisma
npx prisma migrate dev --name description_of_change
```

**Seed database:**

```bash
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

## Architecture

### DDD Layer Structure

```
src/
├── domain/                  # Business logic, no framework dependencies
│   ├── pet.ts              # Pet entity
│   ├── audit.ts            # Audit entity
│   ├── pet-read.repository.ts    # Read repository interface
│   ├── pet-write.repository.ts   # Write repository interface
│   ├── audit.repository.ts       # Audit repository interface
│   └── errors/                   # Domain-specific errors
│
├── application/            # Use cases and orchestration
│   ├── pet.service.ts                        # Core pet service
│   ├── audit.service.ts                      # Audit service
│   └── audit-logging-pet.service.decorator.ts # Decorator pattern for audit
│
├── infrastructure/         # Technical implementations
│   ├── database/
│   │   ├── prisma-client.ts      # Prisma client singleton
│   │   ├── postgres-pool.ts      # Direct PostgreSQL pool
│   │   └── mongoose.ts           # Mongoose connection
│   ├── repositories/
│   │   ├── postgres-pet.repository.ts    # Prisma-based pet repository
│   │   ├── in-memory-pet.repository.ts   # In-memory for testing
│   │   ├── mongo-audit.repository.ts     # MongoDB audit repository
│   │   └── repository.factory.ts         # Factory pattern
│   ├── http/
│   │   ├── controllers/pet.controller.ts # HTTP handlers
│   │   └── middleware/audit.middleware.ts # Request auditing
│   └── queue/
│       ├── queue.service.ts              # BullMQ queue wrapper
│       ├── redis-connection.ts           # Redis connection
│       └── redis-health.service.ts       # Health checks
│
├── routes/                 # Express route definitions
│   ├── main.router.ts
│   └── api/
│       ├── index.ts
│       └── pet.router.ts
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
- Interfaces defined in Domain (`pet-read.repository.ts`, `pet-write.repository.ts`)
- Implementations in Infrastructure (`postgres-pet.repository.ts`, `in-memory-pet.repository.ts`)
- Factory creates appropriate implementation (`repository.factory.ts`)

**Decorator Pattern**:
- `AuditLoggingPetServiceDecorator` wraps `PetService` to add audit logging
- Follows DDD principle of keeping cross-cutting concerns separate

**Async Audit Logging**:
- Write operations trigger audit events
- Events pushed to Redis-backed BullMQ queue
- Background worker consumes queue and writes to MongoDB
- This keeps the API fast by making audit logging async

### Database Strategy

**PostgreSQL (Prisma)**:
- Primary data store for Pet entities
- Schema defined in `prisma/schema.prisma`
- Single model: `Pet` with `id`, `breed`, `type` (enum: cat/dog/bird)

**MongoDB (Mongoose)**:
- Audit log storage only
- Stores operation history (add/list operations)
- Accessed only by audit service and worker

**Separation Rationale**:
- Relational for structured pet data
- Document-based for flexible audit logs

## Important Conventions

### Type Safety
- **Always use explicit types** for variables, parameters, and return types
- Avoid `any` - use `unknown` when type is truly unknown
- Example: `const port: number = Number(process.env.PORT ?? 3000);`

### Comments and Documentation
- **All comments must be in English** (per .ai-rules)
- Use JSDoc for public methods
- Self-documenting code preferred over excessive comments

### Commit Messages
- Project uses Conventional Commits enforced by commitlint + husky
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- Husky pre-commit hook will reject non-conforming messages

### Error Handling
- Domain errors in `src/domain/errors/`
- Custom error classes extend base `Error`
- Example: `PetBreedAlreadyExistsError`, `CatBreedAlreadyExistsError`

### Version Management
- Node.js v22 (see `.nvmrc`)
- Use `nvm use` or `fnm use` to switch to correct version
- npm v11.6.1 automatically installed in Docker containers

## Testing Strategy

**Functional Tests** (Playwright):
- Located in `tests/functional/`
- Test against real isolated test database (port 5433)
- Each test has `beforeEach` that cleans DB and inserts fixtures
- Run via `npm run test:functional` or `make test`

**Philosophy**:
- Focus on testing from the outside-in (HTTP → DB)
- High confidence that entire system works
- Clean slate for each test ensures independence

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

## MCP Server

The project includes an MCP server for Claude Desktop integration:

**Setup**:
1. Build: `npm run build`
2. Configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)
3. Start services: `make up`, `npm run dev`, `npm run start:worker`
4. See `docs/MCP-README.md` for full setup

**Available Tools**:
- `list_all_pets`: List all pet breeds
- `list_pets_by_type`: Filter by type (cat/dog/bird)
- `get_random_pet`: Get random pet
- `add_pet`: Add new breed

## Common Workflows

### Adding a New Pet Endpoint

1. Add route in `src/routes/api/pet.router.ts`
2. Add handler in `src/infrastructure/http/controllers/pet.controller.ts`
3. Add business logic in `src/application/pet.service.ts` if needed
4. Add domain logic in `src/domain/` if it involves business rules
5. Add test in `tests/functional/`
6. Run tests: `make test`

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name your_change_name`
3. Commit migration files in `prisma/migrations/`
4. Migration auto-applies on Docker startup via `prisma migrate deploy`

### Working with Audit Logs

Audit logs are async:
1. API operation happens
2. Event pushed to Redis queue
3. Background worker consumes and writes to MongoDB
4. View logs: `make mongo-shell` then `db.logs.find().pretty()`

## Key Files

- `src/app.ts`: Express app configuration (middleware, routes)
- `src/index.ts`: API server entry (starts HTTP server)
- `src/worker.ts`: Background worker (processes audit queue)
- `src/infrastructure/repositories/repository.factory.ts`: Repository creation logic
- `prisma/schema.prisma`: Database schema
- `Makefile`: Common development commands
- `docker/docker-compose.yaml`: Development environment
- `docker/docker-compose.test.yaml`: Test environment
- `.ai-rules`: Comprehensive DDD and TypeScript guidelines (1080 lines)

## Additional Documentation

- `docs/TESTING.md`: Detailed testing guide
- `docs/MCP-README.md`: MCP server setup (Spanish)
- `README.md`: General project overview and getting started
