# HausPet

A full-stack pet breeds management system with authentication, built with Node.js, Express, TypeScript, and React, following Domain-Driven Design (DDD) principles.

## Features

- **Backend REST API** - Express + TypeScript with DDD architecture
- **Dependency Injection** - InversifyJS for clean architecture and testability
- **Authentication System** - JWT tokens + Redis sessions
- **Frontend Admin Panel** - React + TypeScript + Vite (wireframe)
- **Async Audit Logging** - BullMQ + MongoDB
- **Pet Sponsorship System** - Event Sourcing architecture with public gallery
- **System Counters** - Event-driven precalculated metrics dashboard
- **Database** - PostgreSQL (Prisma ORM) + MongoDB (Audit logs)
- **Message Queue** - Redis + BullMQ

## Project Structure

This is a monorepo with two apps and shared tooling:

```
HausPet/
├── app/
│   ├── api/                     # Backend API + worker (DDD-style)
│   │   ├── domain/              # Entities, repositories, errors, eventsourcing
│   │   ├── application/         # Services (auth, breeds, audit, sponsorship)
│   │   ├── infrastructure/      # Prisma, HTTP controllers, queue, auth, repos
│   │   │   ├── di/              # Dependency Injection (InversifyJS)
│   │   │   ├── events/          # Event Bus and handlers
│   │   │   ├── http/            # Controllers and middleware
│   │   │   ├── persistence/     # Prisma repositories
│   │   │   └── queue/           # BullMQ configuration
│   │   ├── routes/              # Express routers (auth, breed, pet, admin)
│   │   ├── prisma/              # Schema, migrations, seed
│   │   ├── index.ts / worker.ts # API and BullMQ worker entrypoints
│   │   └── scripts/             # Utilities (route listing, commit msg helper)
│   └── frontend/                # React + Vite admin UI (TypeScript)
│       ├── src/                 # Components and pages
│       ├── Dockerfile.dev       # Dev container used by docker-compose.yaml
│       └── vite/ts configs
├── docker/                      # Docker environments (dev/test/prod) with compose files + configs
├── tests/functional/            # Playwright API tests
├── docs/                        # Project documentation
├── Makefile                     # Common orchestration commands
└── package.json                 # Root tooling (husky, commitlint, playwright)
```

**Key Points:**
- Each app (`app/api`, `app/frontend`) keeps its own dependencies.
- Prisma schema and migrations live in `app/api/prisma/`.
- Docker Compose brings up API, worker, frontend, Postgres, Redis, MongoDB, and nginx for local dev. Each environment (dev/test/prod) has its own directory under `docker/` with dedicated compose files and service configurations.

## Quick Start

### First-Time Setup

To initialize the entire HausPet development environment:

```sh
make init
```

This command will:
1. Stop any existing services
2. Build all Docker containers
3. Start all services (API, worker, frontend, databases, nginx)
4. Display access URLs and useful commands

After initialization, access the application at:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000
- **Nginx (Proxy):** http://localhost

### Database Reset

For a clean database setup or reset:

```sh
make prune      # stop stack and clear dev volumes
make reset-db   # drop schemas/types/migration table in dev DB
make seed       # apply migrations and seed data
make up         # start API, worker, frontend, dbs, nginx
```

When changing the schema, create a migration in `app/api`:

```sh
cd app/api
npx prisma migrate dev --name <change>
```

## Authentication

The system includes a complete authentication system with the following features:

- **User registration and login** with email/password
- **JWT tokens** (access + refresh) for stateless authentication
- **Redis sessions** (database 1, separate from BullMQ)
- **Protected routes** with middleware validation
- **Role-based access** (ADMIN, USER)

### Default Admin Credentials

The seed script creates a default admin user:

- **Email:** `admin@hauspet.com`
- **Password:** `Admin123`

**⚠️ Important:** Change these credentials in production!

### Authentication Endpoints

All auth endpoints are under `/api/auth`:

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/logout` - Logout (requires auth)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (requires auth)

See the **[Authentication API](#authentication-api)** section for detailed examples.

## Frontend (Admin Panel)

The project includes a React-based admin panel with **role-based access control**:

- **Technology:** React + TypeScript + Vite
- **Styling:** Tailwind CSS v3.4 (modern, responsive design system)
- **Documentation:** See [docs/TAILWIND.md](docs/TAILWIND.md) for styling guide
- **Routing:** React Router DOM with protected routes
- **State Management:** Context API (AuthContext)
- **Security:** Role-based authentication (ADMIN only)

### Running the Frontend

The frontend is **automatically started** with the Docker Compose stack:

```sh
make up
```

The frontend will be available at `http://localhost:5173`.

**Note:** The GUI service is included in the Docker setup, so you don't need to run it separately. All services (API, Worker, GUI, and databases) start with a single command.

### Accessing the Application

After starting the services:

1. **Navigate to:** `http://localhost:5173`
2. **Login with default admin credentials:**
   - Email: `admin@hauspet.com`
   - Password: `Admin123`
3. **You'll be redirected to:** `/admin/dashboard`

### Frontend Routes

#### Public Routes (No Authentication Required)
- `/login` - Authentication page

#### Protected Routes (ADMIN Role Required)
- `/admin/dashboard` - Admin dashboard with user info
- `/admin/breeds` - Breed management (list, search, filter)
- `/admin/breeds/new` - Create new breed
- `/admin/breeds/edit/:id` - Edit existing breed

**Security Note:** All routes except `/login` require authentication and ADMIN role. Attempting to access protected routes will redirect to login or show a 403 Forbidden page.

### Frontend Features

- ✅ Login page with form validation
- ✅ Role-based protected routes (ADMIN only)
- ✅ Protected dashboard with user info
- ✅ Complete Pet breeds CRUD operations
- ✅ Fuzzy search and filtering (by type, breed name)
- ✅ Automatic token refresh
- ✅ Session persistence (localStorage)
- ✅ 403 Forbidden page for unauthorized access

## Nginx Reverse Proxy

The project includes an optional Nginx reverse proxy for unified access to all services. The proxy is configured but **not required** for development.

### Running with Nginx (Optional)

The Nginx service is included in the Docker Compose stack and starts automatically:

```sh
make up
```

**Access through Nginx (port 80):**
- **Frontend:** http://localhost/
- **API:** http://localhost/api/

**Direct access (without proxy):**
- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000

### Nginx Configuration

Located in `docker/dev/nginx/nginx.dev.conf`:

- Routes `/` to frontend (port 5173)
- Routes `/api/*` to backend API (port 3000)
- Supports WebSocket for Vite HMR
- Includes CORS headers for development

**Note:** The proxy configuration uses `host.docker.internal` to connect to services, allowing you to access services both directly and through the proxy simultaneously.

## Getting Started

### Version Management

This project ensures consistent development and production environments through version pinning:

-   **Node.js:** The project uses Node.js version 22, as specified in the `.nvmrc` file. If you use a version manager like `nvm` or `fnm`, you can run `nvm use` or `fnm use` in the project root to automatically switch to the correct Node version.
-   **npm:** The specific npm version (`11.6.1`) is automatically installed inside the Docker containers at startup, ensuring a consistent build environment.

### Running the Project

This project uses Docker to run. Make sure you have Docker and Docker Compose installed.

1.  **Clone the repository** (if you haven't already).

2.  **Build and run all containers** in detached mode:

    ```sh
    make up
    ```

    This command will start the full stack:
    - **API Server** - `http://localhost:3000`
    - **Frontend (GUI)** - `http://localhost:5173`
    - **Worker** - Background process for audit logging
    - **Databases** - PostgreSQL (5432), MongoDB (27017), Redis (6379)

## Development

### Common Makefile Commands

The project includes a comprehensive Makefile with commands for managing the development environment:

#### Environment Management
```sh
make init          # 🚀 Initialize entire environment (first-time setup)
make up            # Start all services
make down          # Stop all services
make restart       # Restart all services
make prune         # Stop and remove all volumes (clean slate)
make logs          # View API logs
```

#### Frontend (GUI) Commands
```sh
make gui-build     # Rebuild frontend container (use after package.json changes)
make gui-restart   # Restart frontend service
make gui-logs      # View frontend logs
make gui-shell     # Access frontend container shell
```

#### Database Commands
```sh
make reset-db      # Reset database schema and migrations
make seed          # Apply migrations and seed data
make mongo-shell   # Access MongoDB audit database
```

#### Testing
```sh
make test          # Run all tests (unit + integration + functional)
make test-unit     # Run unit tests only
make test-integration  # Run integration tests
make test-functional   # Run functional tests with Playwright
```

#### Utilities
```sh
make list-routes   # List all API routes
make shell         # Access API container shell
```

### Suggesting a Commit Message (AI-assisted)

This project includes a tool to help you write Conventional Commit messages with AI assistance.

1.  Stage your changes as you normally would:
    ```sh
    git add .
    ```

2.  Run the suggestion script:
    ```sh
    npm run commit-msg:suggest
    ```

3.  The script will analyze your staged files and generate a detailed prompt in your terminal.

4.  **Copy the entire prompt** from the terminal.

5.  **Paste the prompt to the AI** (e.g., me) and ask for a commit message.

6.  Use the suggested message to create your commit:
    ```sh
    git commit -m "feat(api): add user authentication endpoint"
    ```

### Enforcing Commit Message Format

This project uses `commitlint` and `husky` to ensure all commit messages follow the [Conventional Commits](https.conventionalcommits.org/) standard. If your commit message is not formatted correctly, the commit will be automatically rejected.

### List All Routes

To see a list of all registered API endpoints, you can run the following command:

```sh
make list-routes
```

This will output a table with all available paths and their corresponding HTTP methods.

### Accessing the Audit Database (MongoDB)

To connect to the MongoDB shell and inspect the audit logs, you can run:

```sh
make mongo-shell
```

Once inside the shell, you can run the following commands to see the logs:

```shell
// Switch to the correct database
use audit_log_db;

// Find all documents in the 'logs' collection and display them nicely
db.logs.find().pretty();
```

## Deployment

This project is configured to automatically handle database migrations when running in Docker. However, understanding the manual workflow is crucial for production deployments or troubleshooting.

### Database Migration Workflow

The project uses `prisma migrate` to manage the database schema. The workflow is divided into two main commands:

1.  **`npx prisma migrate dev` (for Development):**
  *   This is an **interactive** command meant to be run on your **local development machine** from the `app/api` directory.
  *   It compares your `app/api/prisma/schema.prisma` file with the database state.
  *   It automatically generates new SQL migration files in the `app/api/prisma/migrations` directory.
  *   **You should run this command locally whenever you change your Prisma schema.**

2.  **`npx prisma migrate deploy` (for Production/Staging):**
  *   This is a **non-interactive** command meant for automated environments like Docker, CI/CD, or production servers.
  *   It simply applies all **existing** migration files from the `app/api/prisma/migrations` directory to the database.
  *   It does **not** generate new files or ask for confirmation.

### Manual Deployment Steps

If you were to deploy this application manually (e.g., on a cloud server without Docker Compose), the steps would be:

1.  **Generate Migration Files (Locally):**
    Before deploying, make sure you have committed all necessary migration files. If you've made changes to `app/api/prisma/schema.prisma`, create a new migration:
    ```sh
    # Run on your local machine, while Docker containers are running
    cd app/api
    npx prisma migrate dev --name "your-migration-name"
    ```
    Commit the newly created files inside `app/api/prisma/migrations` to your Git repository.

2.  **Deploy the Application:**
    On your production server, after pulling the latest code, you need to:
  *   Install dependencies: `npm install`
  *   Apply migrations: `npx prisma migrate deploy`
  *   Start the application: `npm start` (or a similar command for production)

    *Note: The provided `docker-compose.yaml` already automates the `migrate deploy` step for you.*

## Testing

This project uses automated testing to ensure code quality and reliability.

### Test Levels

#### 1. Unit Tests (Vitest)
Fast, isolated tests for pure utility functions, business logic, and algorithms. These tests use mocks and don't require external dependencies.

**Run unit tests:**
```sh
make test-unit              # Run once
make test-unit-watch        # Watch mode
make test-unit-coverage     # With coverage report
```

**Using npm:**
```sh
npm run test:unit           # Run once
npm run test:unit:watch     # Watch mode
npm run test:unit:ui        # Interactive UI
npm run test:unit:coverage  # With coverage
```

**Location:** `tests/unit/`

**Current tests:**
- Example utility function tests

#### 2. Functional Tests (Playwright)
End-to-end tests that verify complete user workflows and business processes against a real test environment.

**Run functional tests:**
```sh
make test-functional        # Starts test env, runs tests, cleans up
```

**Using npm:**
```sh
npm run test:functional     # Run functional tests only
```

**Location:** `tests/functional/`

**Current tests:**
- Breed CRUD operations (create, read, update, delete)

### Running All Tests

To run all test suites:

```sh
make test          # or make test-all
npm test           # or npm run test:all
```

This will execute:
1. Unit tests (fast, no dependencies)
2. Functional tests (with Docker test environment)

### Test Environment

Functional tests use a dedicated test environment:
- **Test Database:** PostgreSQL on port 5433 (separate from dev port 5432)
- **Test API:** Running on port 3000
- **Isolated:** Completely separate from development environment
- **Auto-cleanup:** Test environment is automatically torn down after tests

### Test Configuration

- **Unit Tests:** `vitest.config.ts`
- **Functional Tests:** `playwright.config.ts`

### CI/CD Integration

The project includes a comprehensive GitHub Actions workflow that automatically runs all tests on every push and pull request to the `main` branch.

**Pipeline Structure:**

```
┌─────────────────┐
│  Unit Tests     │  (Fast, no dependencies)
└────────┬────────┘
         │ ✓ Pass
         ▼
┌─────────────────┐
│ Integration     │  (Docker + API + DB)
│ Tests           │
└────────┬────────┘
         │ ✓ Pass
         ▼
┌─────────────────┐
│ Functional      │  (Full workflows)
│ Tests           │
└────────┬────────┘
         │ ✓ Pass
         ▼
┌─────────────────┐
│ Test Summary    │  (Overall status)
└─────────────────┘
```

**Workflow File:** `.github/workflows/test.yml`

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**

1. **Unit Tests**
   - Runs Vitest tests (isolated, no dependencies)
   - Generates code coverage report
   - Uploads coverage as artifact

2. **Integration Tests**
   - Starts Docker test environment
   - Runs Playwright integration tests
   - Uploads test reports

3. **Functional Tests**
   - Starts Docker test environment
   - Runs Playwright functional tests
   - Uploads test reports

4. **Test Summary**
   - Aggregates results from all test suites
   - Fails if any suite failed
   - Displays overall status

**Artifacts:**
- Coverage reports (7 days retention)
- Integration test reports (7 days retention)
- Functional test reports (7 days retention)

**View Results:**
Go to the **Actions** tab in your GitHub repository to see test runs and download artifacts.

For a more detailed explanation of the testing philosophy and architecture, please see the **[Testing Guide](./docs/TESTING.md)**.

## MCP Server

This project includes an MCP (Model Context Protocol) server that allows you to interact with the HausPet API directly from Claude Desktop.

For setup instructions and usage details, see the **[MCP Guide](./docs/MCP-README.md)**.

## Pet Sponsorship System

The project includes a complete Pet Sponsorship System built with **Event Sourcing** architecture. This allows users to browse adoptable pets and sponsor them.

### Features

- **Public Gallery** - Browse pets (dogs, cats, birds) with photos
- **Sponsorship** - Users can sponsor pets with donations
- **Event Sourcing** - All changes are stored as immutable events
- **Admin Management** - Protected CRUD operations for pets
- **Admin UI (frontend)** - `/admin/pets` (event-sourced CRUD with fuzzy search) and `/admin/breeds` (Prisma CRUD)

### Seeding Pet Data

To populate the database with sample pets for development/testing:

```sh
# Run from Docker container
docker exec hauspet_api npx ts-node prisma/seed-pets.ts

# Or run locally (with Docker database running)
cd app/api
npx ts-node prisma/seed-pets.ts
```

This creates 11 pets: 4 dogs, 4 cats, and 3 birds with photos and sample sponsorship amounts.

### Pet API Endpoints

#### Public Routes 🌐

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pets` | List all pets |
| GET | `/api/pets/type/:type` | List pets by type (cat/dog/bird) |
| GET | `/api/pets/:id` | Get single pet by ID |

#### Admin Routes 🔒 (Requires ADMIN role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/pets` | Create new pet |
| PATCH | `/api/admin/pets/:id` | Update pet |
| DELETE | `/api/admin/pets/:id` | Delete pet |

#### Admin UI (Frontend)

- Login as `admin@hauspet.com / Admin123`
- Dashboard links:
  - `http://localhost/admin/pets` (event-sourced CRUD for pets, with fuzzy search in the admin list)
  - `http://localhost/admin/breeds` (Prisma-based CRUD for breeds)
  - `http://localhost/admin/breed-types` (breed type CRUD; delete blocked if breeds exist)
- All admin UI routes are under `/admin/*` and protected by the ADMIN role

#### Breed Type Admin Routes 🔒 (Requires ADMIN role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/breed-types` | List breed types |
| POST | `/api/admin/breed-types` | Create breed type |
| PATCH | `/api/admin/breed-types/:id` | Rename breed type |
| DELETE | `/api/admin/breed-types/:id` | Delete breed type (fails if breeds exist) |

### Sponsorship API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sponsorships` | Create a sponsorship |
| GET | `/api/sponsorships/pet/:petId` | Get sponsorships for a pet |
| GET | `/api/sponsorships/recent?limit=10` | Get recent sponsorships (max 100) |

**Example - Create Sponsorship:**

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "petId": "uuid-here",
    "email": "sponsor@example.com",
    "name": "John Doe",
    "amount": 25.00
  }' \
  http://localhost:3000/api/sponsorships
```

## API Endpoints

The API is divided into **public routes** (read-only) and **protected routes** (write operations requiring authentication).

### Security Model

- 🌐 **Public Routes (GET):** Anyone can read breed data
- 🔒 **Protected Routes (POST/PUT/DELETE):** Require authentication with JWT token

### Breed Routes (public + protected)

Key endpoints:

| Purpose | Method | URL |
| --- | --- | --- |
| List breeds (filter by `type`/`search`) | GET | `/api/breeds` |
| Get breed by ID | GET | `/api/breeds/:id` |
| Random breed | GET | `/api/breeds/random-breed` |
| Random breed by type | GET | `/api/breeds/:type/random-breed` |
| List breeds by type | GET | `/api/breeds/type/:type` |
| Create breed | POST | `/api/breeds/add` (auth) |
| Update breed | PUT | `/api/breeds/:id` (auth) |
| Delete breed | DELETE | `/api/breeds/:id` (auth) |

Examples:

```sh
# List all breeds
curl http://localhost:3000/api/breeds

# Filter by type and search term
curl "http://localhost:3000/api/breeds?type=dog&search=retriever"

# Random breed (optionally by type)
curl http://localhost:3000/api/breeds/random-breed
curl http://localhost:3000/api/breeds/dog/random-breed

# Create breed (requires JWT + session headers)
curl -X POST http://localhost:3000/api/breeds/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "x-session-id: YOUR_SESSION_ID" \
  -d '{"name": "Beagle", "animalType": "dog"}'
```

## Authentication API

### 1. Signup (Register New User)

Creates a new user account and returns authentication tokens.

-   **Method:** `POST`
-   **URL:** `/api/auth/signup`
-   **Body:** `json`

**Request Body:**

-   `email` (string, required): User email address
-   `password` (string, required): Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
-   `name` (string, required): User's full name
-   `role` (string, optional): Either `ADMIN` or `USER` (defaults to `ADMIN`)

**Example with `curl`:**

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }' \
  http://localhost:3000/api/auth/signup
```

**Response:**

```json
{
  "status": "OK",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2025-11-14T...",
      "updatedAt": "2025-11-14T..."
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    },
    "sessionId": "uuid"
  }
}
```

### 2. Login

Authenticates a user and returns tokens + session ID.

-   **Method:** `POST`
-   **URL:** `/api/auth/login`
-   **Body:** `json`

**Request Body:**

-   `email` (string, required): User email
-   `password` (string, required): User password

**Example with `curl`:**

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hauspet.com",
    "password": "Admin123"
  }' \
  http://localhost:3000/api/auth/login
```

**Response:** Same as signup response.

### 3. Get Current User

Retrieves the authenticated user's information.

-   **Method:** `GET`
-   **URL:** `/api/auth/me`
-   **Headers:**
    -   `Authorization: Bearer <accessToken>`
    -   `x-session-id: <sessionId>`

**Example with `curl`:**

```sh
curl -X GET \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "x-session-id: uuid" \
  http://localhost:3000/api/auth/me
```

**Response:**

```json
{
  "status": "OK",
  "data": {
    "id": "uuid",
    "email": "admin@hauspet.com",
    "name": "Admin User",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2025-11-14T...",
    "updatedAt": "2025-11-14T..."
  }
}
```

### 4. Refresh Token

Refreshes the access token using a refresh token.

-   **Method:** `POST`
-   **URL:** `/api/auth/refresh`
-   **Headers:**
    -   `x-session-id: <sessionId>`
-   **Body:** `json`

**Request Body:**

-   `refreshToken` (string, required): The refresh token

**Example with `curl`:**

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-session-id: uuid" \
  -d '{
    "refreshToken": "eyJhbGci..."
  }' \
  http://localhost:3000/api/auth/refresh
```

**Response:**

```json
{
  "status": "OK",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    }
  }
}
```

### 5. Logout

Destroys the user's session and invalidates tokens.

-   **Method:** `POST`
-   **URL:** `/api/auth/logout`
-   **Headers:**
    -   `Authorization: Bearer <accessToken>`
    -   `x-session-id: <sessionId>`

**Example with `curl`:**

```sh
curl -X POST \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "x-session-id: uuid" \
  http://localhost:3000/api/auth/logout
```

**Response:**

```json
{
  "status": "OK",
  "data": {
    "message": "Logged out successfully"
  }
}
```

## Architecture

### Backend (DDD)

The backend follows Domain-Driven Design with three distinct layers:

```
src/api/
├── domain/              # Business logic (entities, value objects, interfaces)
│   ├── auth/           # User, Email, Password, errors
│   └── breed.ts        # Breed aggregate + repositories
├── application/        # Use cases and orchestration (BreedService, AuthService)
└── infrastructure/     # Technical implementations
    ├── auth/              # SessionService, JwtService, PasswordHasher
    ├── http/              # Controllers/middleware (BreedController, AuthController)
    └── queue/             # BullMQ + Redis
```

### Data Storage

- **PostgreSQL (port 5432)** - Users and breeds (Prisma ORM)
- **MongoDB (port 27017)** - Audit logs (Mongoose)
- **Redis (port 6379)**
  - Database 0: BullMQ message queue
  - Database 1: User sessions

### Frontend Architecture

```
app/frontend/src/
├── components/              # React components
│   ├── Login.tsx           # Login form
│   ├── Dashboard.tsx       # Admin dashboard
│   ├── PetGallery.tsx      # Public gallery
│   ├── PetDetail.tsx       # Detail view
│   ├── ProtectedRoute.tsx  # Auth-only route wrapper
│   └── RoleProtectedRoute.tsx  # Role-based route wrapper (ADMIN)
├── contexts/               # React Context providers (Auth)
├── services/               # API communication
├── types/                  # TypeScript type definitions
├── schemas/                # Zod validation schemas
└── App.tsx                 # Routes and providers
```

**Security Features:**
- `RoleProtectedRoute` - Enforces ADMIN role requirement
- `ProtectedRoute` - Basic authentication check
- JWT token validation on all protected API calls
- Automatic token refresh
- Session management with Redis

## Documentation

Detailed documentation is available in the `/docs` directory:

- **[Dependency Injection (InversifyJS)](docs/DEPENDENCY_INJECTION.md)** - Complete guide to the DI system
- **[System Counters Architecture](docs/SYSTEM_COUNTERS.md)** - Event-driven metrics system
- **[Production Deployment](docs/PRODUCTION.md)** - Deployment guide

### Key Architectural Patterns

- **Dependency Injection**: InversifyJS for clean, testable code
- **Domain-Driven Design**: Clear separation of domain, application, and infrastructure layers
- **Event-Driven Architecture**: Event Bus for loosely coupled components
- **Repository Pattern**: Abstract data access layer
- **CQRS**: Separate read and write models for counters
- **Event Sourcing**: Pet sponsorship system uses event store
