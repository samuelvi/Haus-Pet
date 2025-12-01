# Use Multi-Level Testing Strategy (Unit, Functional, E2E)

**Date**: 2024-02-01
**Author**: HausPet Team

## Context

The application requires comprehensive testing to ensure reliability and enable confident refactoring. With the layered architecture established, we need a testing strategy that validates each layer and their integration.

## Decision

We will implement a three-level testing pyramid:
- **Unit Tests**: Test individual functions and services in isolation with mocked dependencies
- **Functional Tests**: Test API endpoints with real database (test container) and full request/response cycle
- **E2E Tests**: Test complete user workflows through the frontend using Playwright

Key practices:
- Use Jest for unit and functional tests
- Use Playwright for E2E tests
- Docker test containers for isolated functional test database
- Test fixtures for consistent test data
- Coverage reports to identify untested code

## Alternatives Considered

- **Only E2E tests**: Comprehensive but slow, expensive, and harder to debug
- **Only unit tests**: Fast but misses integration issues
- **Mock database in functional tests**: Faster but doesn't catch real database behavior
- **Cypress instead of Playwright**: Popular alternative, but Playwright has better TypeScript support and multi-browser testing

## Positive Consequences

- Unit tests provide fast feedback during development
- Functional tests validate API contracts and database interactions
- E2E tests ensure user workflows work end-to-end
- Test containers provide real database without manual setup
- Clear separation makes it easy to run specific test levels
- Good balance between speed and confidence

## Negative Consequences

- More test infrastructure to maintain (three frameworks/approaches)
- Test containers require Docker and take time to spin up
- E2E tests can be flaky and slower to run
- Maintaining test fixtures requires discipline
- Coverage across three levels can lead to redundant testing if not careful
