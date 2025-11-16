import { Request, Response } from "express";
import { AuthService } from "../../../application/auth/auth.service";
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  InactiveUserError,
  InvalidTokenError,
  SessionNotFoundError,
} from "../../../domain/auth/errors";
import { Role } from "../../../domain/auth/entities/user";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/signup
   * Registers a new user
   */
  public async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role } = req.body;

      // Validate input
      if (!email || typeof email !== "string") {
        res.status(400).json({
          status: "ERROR",
          message: "Invalid input: 'email' must be a non-empty string",
        });
        return;
      }

      if (!password || typeof password !== "string") {
        res.status(400).json({
          status: "ERROR",
          message: "Invalid input: 'password' must be a non-empty string",
        });
        return;
      }

      if (!name || typeof name !== "string") {
        res.status(400).json({
          status: "ERROR",
          message: "Invalid input: 'name' must be a non-empty string",
        });
        return;
      }

      // Validate role if provided
      if (role && !Object.values(Role).includes(role)) {
        res.status(400).json({
          status: "ERROR",
          message: `Invalid input: 'role' must be one of ${Object.values(
            Role
          ).join(", ")}`,
        });
        return;
      }

      const result = await this.authService.register({
        email,
        password,
        name,
        role,
      });

      res.status(201).json({
        status: "OK",
        data: {
          user: result.user,
          tokens: result.tokens,
          sessionId: result.sessionId,
        },
      });
    } catch (error: any) {
      if (error instanceof UserAlreadyExistsError) {
        res.status(409).json({ status: "ERROR", message: error.message });
      } else if (error.message && error.message.includes("Invalid email")) {
        res.status(400).json({ status: "ERROR", message: error.message });
      } else if (
        error.message &&
        error.message.includes("Password must be at least")
      ) {
        res.status(400).json({ status: "ERROR", message: error.message });
      } else {
        res
          .status(500)
          .json({ status: "ERROR", message: "Error creating user" });
      }
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates a user
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || typeof email !== "string") {
        res.status(400).json({
          status: "ERROR",
          message: "Invalid input: 'email' must be a non-empty string",
        });
        return;
      }

      if (!password || typeof password !== "string") {
        res.status(400).json({
          status: "ERROR",
          message: "Invalid input: 'password' must be a non-empty string",
        });
        return;
      }

      const result = await this.authService.login({ email, password });

      res.status(200).json({
        status: "OK",
        data: {
          user: result.user,
          tokens: result.tokens,
          sessionId: result.sessionId,
        },
      });
    } catch (error: any) {
      if (error instanceof InvalidCredentialsError) {
        res.status(401).json({ status: "ERROR", message: error.message });
      } else if (error instanceof InactiveUserError) {
        res.status(403).json({ status: "ERROR", message: error.message });
      } else {
        res
          .status(500)
          .json({ status: "ERROR", message: "Error during login" });
      }
    }
  }

  /**
   * POST /api/auth/refresh
   * Refreshes access token
   */
  public async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const sessionId: string | undefined = req.headers[
        "x-session-id"
      ] as string;

      // Validate input
      if (!refreshToken || typeof refreshToken !== "string") {
        res.status(400).json({
          status: "ERROR",
          message: "Invalid input: 'refreshToken' must be a non-empty string",
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          status: "ERROR",
          message: "Missing x-session-id header",
        });
        return;
      }

      const tokens = await this.authService.refreshToken(
        refreshToken,
        sessionId
      );

      res.status(200).json({
        status: "OK",
        data: { tokens },
      });
    } catch (error: any) {
      if (
        error instanceof InvalidTokenError ||
        error instanceof SessionNotFoundError
      ) {
        res.status(401).json({ status: "ERROR", message: error.message });
      } else {
        res
          .status(500)
          .json({ status: "ERROR", message: "Error refreshing token" });
      }
    }
  }

  /**
   * POST /api/auth/logout
   * Logs out a user by destroying their session
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      // Session ID comes from auth middleware
      const sessionId: string | undefined = req.authContext?.sessionId;

      if (!sessionId) {
        res.status(400).json({
          status: "ERROR",
          message: "Missing session information",
        });
        return;
      }

      await this.authService.logout(sessionId);

      res.status(200).json({
        status: "OK",
        data: { message: "Logged out successfully" },
      });
    } catch (error: any) {
      res.status(500).json({ status: "ERROR", message: "Error during logout" });
    }
  }

  /**
   * GET /api/auth/me
   * Gets current authenticated user
   */
  public async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // User ID and session ID come from auth middleware
      const userId: string | undefined = req.authContext?.userId;
      const sessionId: string | undefined = req.authContext?.sessionId;

      if (!userId || !sessionId) {
        res.status(400).json({
          status: "ERROR",
          message: "Missing authentication context",
        });
        return;
      }

      const user = await this.authService.getCurrentUser(userId, sessionId);

      res.status(200).json({
        status: "OK",
        data: user.toJSON(),
      });
    } catch (error: any) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({ status: "ERROR", message: error.message });
      } else if (error instanceof InactiveUserError) {
        res.status(403).json({ status: "ERROR", message: error.message });
      } else if (error instanceof SessionNotFoundError) {
        res.status(401).json({ status: "ERROR", message: error.message });
      } else {
        res
          .status(500)
          .json({ status: "ERROR", message: "Error fetching user" });
      }
    }
  }
}
