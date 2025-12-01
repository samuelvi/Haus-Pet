import { Request, Response, NextFunction } from 'express';
import logger from '../../logger/logger';
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  InactiveUserError,
  InvalidTokenError,
  SessionNotFoundError,
} from '../../../domain/auth/errors';

// Define error response structure
interface ErrorResponse {
  status: 'ERROR';
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Central error handling middleware
 * Catches all errors thrown by controllers and formats consistent responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Create base error response
  const errorResponse: ErrorResponse = {
    status: 'ERROR',
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  };

  // Log the error with context
  const logContext = {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  };

  // Handle known domain errors (4xx errors)
  if (
    err instanceof UserAlreadyExistsError ||
    err instanceof UserNotFoundError
  ) {
    logger.warn(logContext, `Client error (404): ${err.message}`);
    res.status(404).json(errorResponse);
    return;
  }

  // Handle not found errors by message pattern (for breeds, pets, etc.)
  if (err.message.toLowerCase().includes('not found')) {
    logger.warn(logContext, `Resource not found (404): ${err.message}`);
    res.status(404).json(errorResponse);
    return;
  }

  if (
    err instanceof InvalidCredentialsError ||
    err instanceof InactiveUserError ||
    err instanceof InvalidTokenError ||
    err instanceof SessionNotFoundError
  ) {
    logger.warn(logContext, `Authentication error (401): ${err.message}`);
    res.status(401).json(errorResponse);
    return;
  }

  // Handle validation errors (400)
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    logger.warn(logContext, `Validation error (400): ${err.message}`);
    errorResponse.details = (err as any).errors || (err as any).issues;
    res.status(400).json(errorResponse);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    logger.error(logContext, `Database error: ${prismaError.code}`);

    // Handle unique constraint violation
    if (prismaError.code === 'P2002') {
      errorResponse.message = 'Resource already exists';
      res.status(409).json(errorResponse);
      return;
    }

    // Handle foreign key constraint violation
    if (prismaError.code === 'P2003') {
      errorResponse.message = 'Related resource not found';
      res.status(404).json(errorResponse);
      return;
    }

    // Generic database error
    errorResponse.message = 'Database operation failed';
    res.status(500).json(errorResponse);
    return;
  }

  // Handle all other errors as 500 Internal Server Error
  logger.error(logContext, `Unhandled error (500): ${err.message}`);

  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production') {
    errorResponse.message = 'Internal server error';
  }

  res.status(500).json(errorResponse);
}

/**
 * Helper to wrap async route handlers and forward errors to error handler
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
