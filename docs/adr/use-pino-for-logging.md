# Use Pino for Structured Logging

**Date**: 2025-12-01
**Author**: HausPet Team

## Context

The application needs a professional logging system to track errors, monitor application behavior, and facilitate debugging. With the existing architecture using Express and TypeScript, we need a logging solution that provides structured logging, good performance, and proper error tracking.

## Decision

We will use **Pino** as our logging library with the following configuration:
- **Development**: Pretty-printed logs with colors (pino-pretty) at `debug` level
- **Production**: JSON structured logs at `info` level to stdout
- **Multi-streaming**: Logs simultaneously to stdout (Docker/console) and files (persistence)
- **File organization**: Logs stored in `logs/<env>/` directory structure
  - `logs/dev/` for development (NODE_ENV=development)
  - `logs/prod/` for production (NODE_ENV=production)
  - `logs/test/` for testing (NODE_ENV=test)
  - `error.log`: Error and fatal level logs only
  - `warn.log`: Warning, error, and fatal logs
  - `combined.log`: All logs (production only)
- **HTTP logging**: Automatic request/response logging using `pino-http` middleware
- **Error handling**: Centralized error handler middleware that logs all exceptions
- **Global handlers**: Uncaught exceptions and unhandled rejections are logged and cause graceful shutdown

## Alternatives Considered

- **Winston**: Most popular in Node.js ecosystem (similar to Monolog in PHP), but slower than Pino and more complex configuration
- **Bunyan**: Good structured logging with JSON, but less actively maintained and slower than Pino
- **Console.log**: Simple but lacks structure, levels, formatting, and proper error handling
- **No logging**: Would make debugging and monitoring very difficult in production

## Positive Consequences

- Extremely fast logging with minimal performance overhead (important for API throughput)
- Multi-streaming allows logs in both Docker (stdout) and files simultaneously
- Structured JSON logs in production are easy to parse and analyze
- Pretty-printed logs in development improve developer experience
- Automatic HTTP logging captures all requests without manual instrumentation
- Request IDs enable tracing requests through the system
- Response time tracking helps identify performance bottlenecks
- Centralized error handling provides consistent error responses and logging
- Environment-based log directories keep logs organized (`logs/dev/`, `logs/prod/`, `logs/test/`)
- Separate log files by severity enable focused troubleshooting
- Uncaught exception handling prevents silent failures
- Easy integration with log aggregation services (ELK, Datadog, etc.)
- Compatible with Docker and Kubernetes (logs to stdout)
- File persistence enables historical analysis and auditing

## Negative Consequences

- Additional dependency to maintain and keep updated
- JSON logs in production are not human-readable without tools
- Log files accumulate over time and need manual cleanup/rotation strategy
- Multi-streaming to files adds minimal I/O overhead
- Developers need to learn Pino's API (child loggers, context objects)
- Pretty-printing adds slight overhead in development (negligible)
- Need to monitor disk space usage for log files
