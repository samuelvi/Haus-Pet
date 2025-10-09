# Testing Guide

This document provides a detailed guide on how to run the functional API tests for the HausPet project.

## Philosophy

Our testing strategy focuses on functional tests that validate the application's behavior from the outside in. We use **Playwright** to send real HTTP requests to the API and **a dedicated test database** to ensure that our tests run in a clean, isolated, and predictable environment.

This approach gives us high confidence that the entire system works as expected, from the API endpoints to the database interactions.

## Test Environment

To achieve complete isolation from the development environment, we use a separate Docker Compose configuration located at `docker/docker-compose.test.yaml`.

This setup includes:

-   A dedicated PostgreSQL database (`hauspet_test_db`) that runs on a different port (`5433`) to avoid conflicts.
-   An isolated data volume (`postgres_test_data`) to keep test data separate.
-   A dedicated API service configured to connect to the test database.

## How to Run Tests

We have created several `make` commands to simplify the process of running tests.

### The Main Command (Recommended)

To run the entire test suite from start to finish, simply use:

```sh
npm run test:functional
```

Or the equivalent `make` command:

```sh
make test
```

This single command will automatically:

1.  **Start the test environment** (`make test-up`).
2.  **Run the Playwright tests** inside the appropriate container (`make test-run`).
3.  **Shut down and clean up** the test environment (`make test-down`).

### Manual Control

If you need more granular control over the test environment (for example, to inspect the test database after a run), you can use the following commands.

1.  **Start the test environment:**

    ```sh
    make test-up
    ```

2.  **Run the tests manually (inside the container):**

    Once the environment is up, you can run the tests using the dedicated `make` command. This command executes `npx playwright test` *inside the API container*, which is necessary for the tests to connect to the test database.

    ```sh
    make test-run
    ```

3.  **Stop the test environment:**

    When you are finished, you can stop and clean up the environment:

    ```sh
    make test-down
    ```

## Writing Tests

The tests are located in the `tests/functional/` directory. Our test files (`*.spec.ts`) follow a clear structure:

1.  **Database Connection:** A `Pool` object is configured to connect to the **test database** on port `5433`.
2.  **Data Fixtures:** A `test.beforeEach` block is used to clean the database tables and insert a known set of data before each test runs.
3.  **Test Cases:** Each `test` block makes an API request using Playwright's `request` object and uses `expect` to assert that the response is correct.

This ensures that every test is independent and runs against a predictable state.
