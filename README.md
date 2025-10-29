# HausPet

A simple REST API for managing pet breeds, built with Node.js, Express, and TypeScript, following Domain-Driven Design (DDD) principles.

## Database Initialization and First-Time Setup

This project uses Prisma to manage the database schema. If you are cloning this repository for the first time, or if you need to reset your database completely, you must follow these steps to initialize the database schema correctly.

**This process is crucial for the application to start without errors.**

### Step 1: Destroy Old Docker Environment

This command stops all running containers and, most importantly, **deletes the database data volume**. This ensures you start with a completely clean slate.

```sh
docker-compose down -v
```

### Step 2: Start the Database Service

Start *only* the database container. This provides a running, empty PostgreSQL instance for Prisma to connect to.

```sh
docker-compose up -d hauspet_db
```

### Step 3: Create Initial Migration

Run this command on your **local machine**. It will connect to the new database, inspect your `prisma/schema.prisma` file, and generate the necessary SQL migration files inside the `prisma/migrations` directory.

```sh
npx prisma migrate dev --name init
```

### Step 4: Start the Full Application

Now that the migration files exist, you can start the entire application stack.

```sh
make up
```

The application will now start correctly, apply the migrations, and seed the database with initial data.

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

    This command will start the full stack (API, Worker, PostgreSQL, MongoDB, Redis), which will be accessible at `http://localhost:3000`.

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
  *   This is an **interactive** command meant to be run on your **local development machine**.
  *   It compares your `prisma/schema.prisma` file with the database state.
  *   It automatically generates new SQL migration files in the `prisma/migrations` directory.
  *   **You should run this command locally whenever you change your Prisma schema.**

2.  **`npx prisma migrate deploy` (for Production/Staging):**
  *   This is a **non-interactive** command meant for automated environments like Docker, CI/CD, or production servers.
  *   It simply applies all **existing** migration files from the `prisma/migrations` directory to the database.
  *   It does **not** generate new files or ask for confirmation.

### Manual Deployment Steps

If you were to deploy this application manually (e.g., on a cloud server without Docker Compose), the steps would be:

1.  **Generate Migration Files (Locally):**
    Before deploying, make sure you have committed all necessary migration files. If you've made changes to `schema.prisma`, create a new migration:
    ```sh
    # Run on your local machine, while Docker containers are running
    npx prisma migrate dev --name "your-migration-name"
    ```
    Commit the newly created files inside `prisma/migrations` to your Git repository.

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

## API Endpoints

The API is divided into generic routes and type-specific routes.

### Generic Routes

These endpoints operate on all pet types.

#### 1. Get All Pets

Retrieves a list of all pets of all types.

-   **Method:** `GET`
-   **URL:** `/api/pets/`

**Example with `curl`:**

```sh
curl http://localhost:3000/api/pets/
```

#### 2. Get a Random Pet

Retrieves a random pet from the entire collection.

-   **Method:** `GET`
-   **URL:** `/api/pets/random-pet`

**Example with `curl`:**

```sh
curl http://localhost:3000/api/pets/random-pet
```

#### 3. Add a New Pet (Generic)

Adds a new pet to the list. This generic endpoint requires specifying the `type` in the request body.

-   **Method:** `POST`
-   **URL:** `/api/pets/add`
-   **Body:** `json`

**Request Body:**

-   `breed` (string, required): The name of the breed.
-   `type` (string, required): The type of animal. Must be one of `cat`, `dog`, or `bird`.

**Example with `curl`:**

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"breed": "Parakeet", "type": "bird"}' \
  http://localhost:3000/api/pets/add
```

### Type-Specific Routes

These endpoints allow you to work with a specific type of pet (`cat`, `dog`, or `bird`).

#### 1. Get Pets by Type

Retrieves a list of all pets of a specific type.

-   **Method:** `GET`
-   **URL:** `/api/pets/:type/`

**Example with `curl` (for dogs):**

```sh
curl http://localhost:3000/api/pets/dog/
```

#### 2. Get a Random Pet by Type

Retrieves a random pet of a specific type.

-   **Method:** `GET`
-   **URL:** `/api/pets/:type/random-pet`

**Example with `curl` (for cats):**

```sh
curl http://localhost:3000/api/pets/cat/random-pet
```

#### 3. Add a New Pet by Type

Adds a new pet breed to the specified type. The `type` is taken from the URL, so you only need to provide the `breed`.

-   **Method:** `POST`
-   **URL:** `/api/pets/:type/add`
-   **Body:** `json`

**Request Body:**

-   `breed` (string, required): The name of the breed.

**Example with `curl` (for dogs):**

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"breed": "Beagle"}' \
  http://localhost:3000/api/pets/dog/add
```
