# HausPet

A simple REST API for managing pet breeds, built with Node.js, Express, and TypeScript, following Domain-Driven Design (DDD) principles.

## Getting Started

This project uses Docker to run. Make sure you have Docker and Docker Compose installed.

### 1. First-Time Setup (Crucial for a Clean Start)

If you are cloning this repository for the first time, or if you need to reset your database completely, you must follow these steps to initialize the database schema correctly.

**a. Destroy any old Docker volumes:**
This command stops all containers and, crucially, removes the old database data, ensuring a clean slate.
```sh
docker-compose down -v
```

**b. Start only the database service:**
This gives Prisma a running, empty database to connect to.
```sh
docker-compose up -d hauspet_db
```

**c. Create the initial migration files:**
Run this command on your **local machine**. It will connect to the new database, create the necessary SQL migration files in the `prisma/migrations` directory, and apply them.
```sh
npx prisma migrate dev --name init
```

### 2. Everyday Use

Once the initial setup is complete, you can use the following command for your daily work:

```sh
make up
```

This command will build and run all containers. On startup, it will automatically:
1.  Apply any new database migrations (`prisma migrate deploy`).
2.  Seed the database with initial data (`prisma db seed`).
3.  Start the API server.

The API will be accessible at `http://localhost:3000`.

## Database Management

This project uses `prisma migrate` to manage the database schema. It is the single source of truth.

### Making Schema Changes

Whenever you modify the `prisma/schema.prisma` file (e.g., adding a new field or model), you must create a new migration.

1.  **Ensure your Docker environment is running** (`make up`).

2.  **Run the `migrate dev` command locally:**
    This command will generate a new SQL migration file based on your schema changes.
    ```sh
    npx prisma migrate dev --name "your-descriptive-migration-name"
    ```

3.  **Commit the new files** inside the `prisma/migrations` directory to your Git repository.

### Seeding the Database

The database is populated with initial data from the `prisma/seed.ts` script. This script is run automatically on startup by the `make up` command.

If you want to re-run the seed script manually at any time, you can use:

```sh
npm run db:seed
```

## Development

### Version Management

-   **Node.js:** The project uses Node.js version 22, as specified in the `.nvmrc` file. If you use `nvm` or `fnm`, run `nvm use` or `fnm use` to switch to the correct version.
-   **npm:** The specific npm version (`11.6.1`) is automatically installed inside the Docker containers.

### List All Routes

To see a list of all registered API endpoints, run:

```sh
make list-routes
```

### Accessing the Audit Database (MongoDB)

To connect to the MongoDB shell and inspect the audit logs, run:

```sh
make mongo-shell
```

## Testing

This project uses **Playwright** for functional API testing. To run the tests, use:

```sh
npm run test:functional
```

For more details, see the **[Testing Guide](./docs/TESTING.md)**.

## API Endpoints

### Generic Routes

-   `GET /api/pets/`: Get all pets.
-   `GET /api/pets/random-pet`: Get a random pet.
-   `POST /api/pets/add`: Add a new pet (requires `breed` and `type` in the body).

### Type-Specific Routes

-   `GET /api/pets/:type/`: Get all pets of a specific type.
-   `GET /api/pets/:type/random-pet`: Get a random pet of a specific type.
-   `POST /api/pets/:type/add`: Add a new pet to a specific type (requires `breed` in the body).

*For detailed examples, please see the sections below.*

*... (rest of the API endpoint documentation remains the same) ...*
