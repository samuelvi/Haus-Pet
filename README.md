# ApiCat

A simple REST API for managing cat breeds, built with Node.js, Express, and TypeScript, following Domain-Driven Design (DDD) principles.

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

This project uses `commitlint` and `husky` to ensure all commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. If your commit message is not formatted correctly, the commit will be automatically rejected.

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

```javascript
// Switch to the correct database
use audit_log_db;

// Find all documents in the 'logs' collection and display them nicely
db.logs.find().pretty();
```

### Connecting an IDE to the Audit Database

To connect a database client or IDE (like PhpStorm, DataGrip, etc.) to the MongoDB audit database, it is highly recommended to use the full connection string, as it includes the necessary authentication details.

-   **Connection String:**
    ```
    mongodb://audit_user:audit_pass@localhost:27017/audit_log_db?authSource=admin
    ```
-   **Key Parameter:** The `authSource=admin` parameter is crucial. It tells the client to authenticate against the `admin` database, where the user was created, even though you will be working with the `audit_log_db` database.

## API Endpoints

Here are the available endpoints.

### 1. Get All Cat Breeds

Retrieves a list of all cat breeds.

-   **Method:** `GET`
-   **URL:** `/api/cats/`

**Example with `curl`:**

```sh
curl http://localhost:3000/api/cats/
```

**Success Response (200 OK):**

```json
{
  "status": "OK",
  "data": [
    {
      "breed": "Siamese"
    },
    {
      "breed": "Persian"
    },
    {
      "breed": "Maine Coon"
    }
  ]
}
```

### 2. Get a Random Cat Breed

Retrieves a random cat breed from the list.

-   **Method:** `GET`
-   **URL:** `/api/cats/random-cat`

**Example with `curl`:**

```sh
curl http://localhost:3000/api/cats/random-cat
```

**Success Response (200 OK):**

```json
{
  "status": "OK",
  "data": {
    "breed": "Siamese"
  }
}
```

### 3. Add a New Cat Breed

Adds a new cat breed to the list. The breed must not already exist.

-   **Method:** `POST`
-   **URL:** `/api/cats/add`
-   **Body:** `json`

**Example with `curl`:**

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"breed": "Turkish Angora"}' \
  http://localhost:3000/api/cats/add
```

**Success Response (201 Created):**

```json
{
  "status": "OK",
  "data": {
    "message": "Cat breed added successfully",
    "cat": {
      "breed": "Turkish Angora"
    }
  }
}
```

**Error Response (409 Conflict - Breed already exists):**

If you try to add the same breed again, you will get the following response:

```json
{
  "status": "ERROR",
  "message": "Cat breed already exists"
}
```
