# ApiCat

A simple REST API for managing cat breeds, built with Node.js, Express, and TypeScript, following Domain-Driven Design (DDD) principles.

## Getting Started

This project uses Docker to run. Make sure you have Docker and Docker Compose installed.

1.  **Clone the repository** (if you haven't already).

2.  **Build and run the container** in detached mode:

    ```sh
    make up
    ```

    This command will start the server, which will be accessible at `http://localhost:3000`.

## Development

### List All Routes

To see a list of all registered API endpoints, you can run the following command:

```sh
make list-routes
```

This will output a table with all available paths and their corresponding HTTP methods.

## API Endpoints

Here are the available endpoints.

### 1. Get a Random Cat Breed

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

### 2. Add a New Cat Breed

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
