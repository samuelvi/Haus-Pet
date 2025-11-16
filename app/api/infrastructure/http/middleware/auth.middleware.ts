import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../auth/services/jwt.service";
import { SessionService } from "../../auth/services/session.service";
import {
  UnauthorizedError,
  InvalidTokenError,
  SessionNotFoundError,
} from "../../../domain/auth/errors";

// Extend the Express Request type to include authentication context
declare global {
  namespace Express {
    interface Request {
      authContext?: {
        userId: string;
        email: string;
        role: string;
        sessionId: string;
      };
    }
  }
}

/**
 * Authentication middleware factory
 * Creates a middleware that validates JWT tokens and sessions
 */
export function createAuthMiddleware(
  jwtService: JwtService,
  sessionService: SessionService
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract Authorization header
      const authHeader: string | undefined = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError(
          "Missing or invalid Authorization header"
        );
      }

      // Extract token
      const token: string = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Extract session ID from custom header
      const sessionId: string | undefined = req.headers[
        "x-session-id"
      ] as string;
      if (!sessionId) {
        throw new UnauthorizedError("Missing x-session-id header");
      }

      // Verify JWT token
      let payload;
      try {
        payload = jwtService.verifyAccessToken(token);
      } catch (error) {
        throw new InvalidTokenError("Invalid or expired access token");
      }

      // Validate session
      const isSessionValid: boolean = await sessionService.validateSession(
        sessionId
      );
      if (!isSessionValid) {
        throw new SessionNotFoundError("Session expired or not found");
      }

      // Refresh session TTL on activity
      await sessionService.refreshSession(sessionId);

      // Attach auth context to request
      req.authContext = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionId,
      };

      next();
    } catch (error) {
      if (
        error instanceof UnauthorizedError ||
        error instanceof InvalidTokenError ||
        error instanceof SessionNotFoundError
      ) {
        res.status(401).json({
          error: "Unauthorized",
          message: error.message,
        });
        return;
      }

      // Unexpected error
      res.status(500).json({
        error: "Internal Server Error",
        message: "An unexpected error occurred during authentication",
      });
    }
  };
}

/**
 * Optional authentication middleware factory
 * Does not fail if auth is missing, but populates authContext if valid credentials provided
 */
export function createOptionalAuthMiddleware(
  jwtService: JwtService,
  sessionService: SessionService
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader: string | undefined = req.headers.authorization;
      const sessionId: string | undefined = req.headers[
        "x-session-id"
      ] as string;

      // If no auth headers, continue without auth context
      if (!authHeader || !sessionId) {
        next();
        return;
      }

      // Try to authenticate
      if (authHeader.startsWith("Bearer ")) {
        const token: string = authHeader.substring(7);

        const payload = jwtService.verifyAccessToken(token);
        const isSessionValid: boolean = await sessionService.validateSession(
          sessionId
        );

        if (isSessionValid) {
          await sessionService.refreshSession(sessionId);

          req.authContext = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            sessionId,
          };
        }
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  };
}
