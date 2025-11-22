# HausPet

A full-stack pet breeds management system with authentication, built with Node.js, Express, TypeScript, and React, following Domain-Driven Design (DDD) principles.

## Features

- **Backend REST API** - Express + TypeScript with DDD architecture
- **Authentication System** - JWT tokens + Redis sessions
- **Frontend Admin Panel** - React + TypeScript + Vite (wireframe)
- **Async Audit Logging** - BullMQ + MongoDB
- **Animal Sponsorship System** - Event Sourcing architecture with public gallery
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
│   │   ├── routes/              # Express routers (auth, breed, animal, admin)
│   │   ├── prisma/              # Schema, migrations, seed
│   │   ├── index.ts / worker.ts # API and BullMQ worker entrypoints
│   │   └── scripts/             # Utilities (route listing, commit msg helper)
│   └── frontend/                # React + Vite admin UI (TypeScript)
│       ├── src/                 # Components and pages
│       ├── Dockerfile.dev       # Dev container used by docker-compose.yaml
│       └── vite/ts configs
├── docker/                      # Docker Compose (dev, test, proxy) + nginx configs
├── tests/functional/            # Playwright API tests
├── docs/                        # Project documentation
├── Makefile                     # Common orchestration commands
└── package.json                 # Root tooling (husky, commitlint, playwright)
```

**Key Points:**
- Each app (`app/api`, `app/frontend`) keeps its own dependencies.
- Prisma schema and migrations live in `app/api/prisma/`.
- Docker Compose brings up API, worker, frontend, Postgres, Redis, MongoDB, and nginx for local dev. The same stack has a dedicated test variant in `docker/docker-compose.test.yaml`.

## Database Initialization and First-Time Setup

This project uses Prisma to manage the database schema. If you are cloning this repository for the first time, or if you need to reset your database completely, you must follow these steps to initialize the database schema correctly.

**This process is crucial for the application to start without errors.**

### Step 1: Start a Clean Environment

```sh
make prune   # optional: stops stack and clears dev volumes
make up      # builds/starts API, worker, frontend, dbs, nginx
```

The API container installs deps, runs `prisma generate`, deploys migrations, and seeds data automatically on startup.

### Step 2: Apply New Migrations (when schema changes)

From `app/api`, create and deploy migrations against the local stack:

```sh
cd app/api
npx prisma migrate dev --name <change>
```

### Step 3: Rerun Stack

If needed, restart the stack to pick up changes:

```sh
make restart
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
- **Styling:** Inline styles (wireframe/minimalist design)
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

Located in `docker/nginx/nginx.dev.conf`:

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

This project uses **Playwright** for functional API testing. The tests run against a real, isolated database to ensure that the entire application stack works as expected.

To run the tests, you can use the following command:

```sh
npm run test:functional
```

For a more detailed explanation of the testing philosophy, environment, and available commands, please see the **[Testing Guide](./docs/TESTING.md)**.

## MCP Server

This project includes an MCP (Model Context Protocol) server that allows you to interact with the HausPet API directly from Claude Desktop.

For setup instructions and usage details, see the **[MCP Guide](./docs/MCP-README.md)**.

## Animal Sponsorship System

The project includes a complete Animal Sponsorship System built with **Event Sourcing** architecture. This allows users to browse adoptable animals and sponsor them.

### Features

- **Public Gallery** - Browse animals (dogs, cats, birds) with photos
- **Sponsorship** - Users can sponsor animals with donations
- **Event Sourcing** - All changes are stored as immutable events
- **Admin Management** - Protected CRUD operations for animals

### Seeding Animal Data

To populate the database with sample animals for development/testing:

```sh
# Run from Docker container
docker exec hauspet_api npx ts-node prisma/seed-animals.ts

# Or run locally (with Docker database running)
cd app/api
npx ts-node prisma/seed-animals.ts
```

This creates 11 animals: 4 dogs, 4 cats, and 3 birds with photos and sample sponsorship amounts.

### Animal API Endpoints

#### Public Routes 🌐

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/animals` | List all animals |
| GET | `/api/animals/type/:type` | List animals by type (cat/dog/bird) |
| GET | `/api/animals/:id` | Get single animal by ID |

#### Admin Routes 🔒 (Requires ADMIN role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/animals` | Create new animal |
| PATCH | `/api/admin/animals/:id` | Update animal |
| DELETE | `/api/admin/animals/:id` | Delete animal |

### Sponsorship API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sponsorships` | Create a sponsorship |
| GET | `/api/sponsorships/animal/:animalId` | Get sponsorships for an animal |
| GET | `/api/sponsorships/recent?limit=10` | Get recent sponsorships (max 100) |

**Example - Create Sponsorship:**

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "animalId": "uuid-here",
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
│   ├── AnimalGallery.tsx   # Public gallery
│   ├── AnimalDetail.tsx    # Detail view
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
