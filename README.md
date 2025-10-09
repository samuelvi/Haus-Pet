# HausPet

A simple REST API for managing pet breeds, built with Node.js, Express, and TypeScript, following Domain-Driven Design (DDD) principles.

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

```javascript
// Switch to the correct database
use audit_log_db;

// Find all documents in the 'logs' collection and display them nicely
db.logs.find().pretty();
```

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

**Success Response (200 OK):**

```json
{
  "status": "OK",
  "data": [
    {
      "id": 11,
      "breed": "Golden Retriever",
      "type": "dog"
    },
    {
      "id": 12,
      "breed": "Labrador Retriever",
      "type": "dog"
    }
  ]
}
```

#### 2. Get a Random Pet by Type

Retrieves a random pet of a specific type.

-   **Method:** `GET`
-   **URL:** `/api/pets/:type/random-pet`

**Example with `curl` (for cats):**

```sh
curl http://localhost:3000/api/pets/cat/random-pet
```

**Success Response (200 OK):**

```json
{
  "status": "OK",
  "data": {
    "id": 2,
    "breed": "Persian",
    "type": "cat"
  }
}
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

**Success Response (201 Created):**

```json
{
  "status": "OK",
  "data": {
    "message": "dog added successfully",
    "pet": {
      "id": 31,
      "breed": "Beagle",
      "type": "dog"
    }
  }
}
```
